'use client';

import type { UIMessage } from 'ai';
import type { GetWeatherInput, GetWeatherOutput } from '../get-weather';
import { Cloud, CloudRain, Sun, CloudSnow, Thermometer, Wind, Droplets, Eye, Gauge } from 'lucide-react';

interface GetWeatherRendererProps {
  part: UIMessage['parts'][number];
  isStreaming?: boolean;
}

export function GetWeatherRenderer({ part }: GetWeatherRendererProps) {
  if (part.type !== 'tool-getWeather') {
    return null;
  }

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
    default:
      return null;
  }
}

