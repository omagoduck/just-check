'use client';

import { UIMessage } from 'ai';
import { Response } from '@/components/response';
import { GetTimeInput, GetTimeOutput } from '@/lib/tools/tools';
import { Clock, Brain } from 'lucide-react';
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

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}