'use client';

import { UIMessage } from 'ai';
import { Response } from '@/components/response';
import { GetTimeInput, GetTimeOutput, GetWeatherInput, GetWeatherOutput } from '@/lib/tools';
import { Clock, Brain, Cloud, CloudRain, Sun, CloudSnow, Thermometer, Wind, Droplets, Eye, Gauge, Sun as UV } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface AIMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export function AIMessage({ message, isStreaming = false }: AIMessageProps) {
  return (
    <div className="w-full mb-4">
      <div className="space-y-2">
        {message.parts.map((part, index) => {
          switch (part.type) {
            case 'text':
              return (
                <div key={index} className="text-foreground prose prose-sm max-w-none">
                  <Response>{part.text}</Response>
                </div>
              );
            
            case 'reasoning': {
              const itemId = `reasoning-${index}`;
              // Determine if this reasoning part is the last part in the message and still streaming
              const isLastPart = index === message.parts.length - 1;
              const label = (isLastPart && isStreaming) ? 'Thinking' : 'Thought';
              return (
                <div key={index}>
                  <Accordion type="single" collapsible>
                    <AccordionItem value={itemId} className="border-none">
                      <AccordionTrigger className="py-2 hover:no-underline hover:bg-transparent transition-colors duration-200 group w-fit flex-none">
                        <div className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                          <Brain className="h-4 w-4" />
                          <span className="text-sm">
                            {label}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="ml-1.5 border-l-2 border-blue-200 pl-4">
                          <Response className="text-sm text-muted-foreground leading-relaxed">
                            {part.text}
                          </Response>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              );
            }
            
            // Handle getTime tool calls and results
            case 'tool-getTime': {
              const callId = part.toolCallId;
              const input = part.input as GetTimeInput;
              const output = part.output as GetTimeOutput;

              switch (part.state) {
                case 'input-streaming':
                  return (
                    <div key={callId} className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="h-4 w-4 animate-pulse" />
                      <span>Getting time request...</span>
                    </div>
                  );
                case 'input-available':
                  return (
                    <div key={callId} className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Getting current time{input?.timezone ? ` for ${input.timezone}` : ''}...
                      </span>
                    </div>
                  );
                case 'output-available':
                  return (
                    <div key={callId} className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-foreground">Current Time</div>
                        <div className="text-sm text-muted-foreground">
                          {output.time}
                        </div>
                      </div>
                    </div>
                  );
                case 'output-error':
                  return (
                    <div key={callId} className="flex items-center space-x-2 text-destructive">
                      <Clock className="h-4 w-4" />
                      <span>Error: {part.errorText}</span>
                    </div>
                  );
              }
              break;
            }
            
            // Handle getWeather tool calls and results
            case 'tool-getWeather': {
              const callId = part.toolCallId;
              const input = part.input as GetWeatherInput;
              const output = part.output as GetWeatherOutput;

              // Helper function to get weather icon based on conditions
              const getWeatherIcon = (conditions: string) => {
                const lower = conditions.toLowerCase();
                if (lower.includes('rain') || lower.includes('drizzle')) return <CloudRain className="h-5 w-5 text-blue-500" />;
                if (lower.includes('snow')) return <CloudSnow className="h-5 w-5 text-blue-300" />;
                if (lower.includes('cloud')) return <Cloud className="h-5 w-5 text-gray-500" />;
                if (lower.includes('clear') || lower.includes('sun')) return <Sun className="h-5 w-5 text-yellow-500" />;
                return <Cloud className="h-5 w-5 text-gray-500" />;
              };

              switch (part.state) {
                case 'input-streaming':
                  return (
                    <div key={callId} className="flex items-center space-x-2 text-muted-foreground">
                      <Cloud className="h-4 w-4 animate-pulse" />
                      <span>Getting weather request...</span>
                    </div>
                  );
                case 'input-available':
                  return (
                    <div key={callId} className="flex items-center space-x-2 text-muted-foreground">
                      <Cloud className="h-4 w-4" />
                      <span>
                        Getting weather for {input?.location || 'your current location'}...
                      </span>
                    </div>
                  );
                case 'output-available':
                  return (
                    <div key={callId} className="bg-muted/50 p-4 rounded-lg space-y-4">
                      {/* Current Weather */}
                      <div className="flex items-start space-x-3">
                        {getWeatherIcon(output.current.conditions)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{output.current.location}</h3>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-foreground">{output.current.temperature}°C</div>
                              <div className="text-sm text-muted-foreground">Feels like {output.current.feelsLike}°C</div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground capitalize mt-1">
                            {output.current.description}
                          </div>
                        </div>
                      </div>
                      
                      {/* Weather Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground">Humidity</span>
                          <span className="font-medium">{output.current.humidity}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Wind className="h-4 w-4 text-gray-500" />
                          <span className="text-muted-foreground">Wind</span>
                          <span className="font-medium">{output.current.windSpeed} km/h</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Gauge className="h-4 w-4 text-gray-600" />
                          <span className="text-muted-foreground">Pressure</span>
                          <span className="font-medium">{output.current.pressure} hPa</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-gray-500" />
                          <span className="text-muted-foreground">Visibility</span>
                          <span className="font-medium">{output.current.visibility} km</span>
                        </div>
                      </div>
                      
                      {/* Forecast */}
                      {output.forecast.length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">5-Day Forecast</h4>
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            {output.forecast.map((day, index) => (
                              <div key={index} className="text-center space-y-1">
                                <div className="font-medium text-muted-foreground">
                                  {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className="flex justify-center">
                                  {getWeatherIcon(day.conditions)}
                                </div>
                                <div className="space-y-1">
                                  <div className="font-medium">{day.temperature.high}°</div>
                                  <div className="text-muted-foreground">{day.temperature.low}°</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                case 'output-error':
                  return (
                    <div key={callId} className="flex items-center space-x-2 text-destructive">
                      <Cloud className="h-4 w-4" />
                      <span>Error: {part.errorText}</span>
                    </div>
                  );
              }
              break;
            }

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}