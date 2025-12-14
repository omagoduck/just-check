'use client';

import { UIMessage } from 'ai';
import { Response } from '@/components/response';
import { Brain } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { renderToolPart } from '@/lib/tools/renderers';

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
            
            default:
              // Try to render using the tool renderer registry
              const toolRender = renderToolPart(part, isStreaming);
              if (toolRender !== null) {
                return toolRender;
              }
              return null;
          }
        })}
      </div>
    </div>
  );
}