'use client';

import { useState } from 'react';
import { UIMessage } from 'ai';
import { Response } from '@/components/response';
import { Brain, ThumbsUp, ThumbsDown, Copy, Check, MoreVertical } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { renderToolPart } from '@/lib/tools/renderers';

interface AIMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export function AIMessage({ message, isStreaming = false }: AIMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textContent = message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n\n');
    
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  return (
    <div className="w-full mb-4 group">
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
      
      {/* Action buttons below the message */}
      <div className="flex gap-1 mt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-md hover:bg-muted/80 text-foreground">
              <ThumbsUp className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Like</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-md hover:bg-muted/80 text-foreground">
              <ThumbsDown className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Dislike</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-md hover:bg-muted/80 text-foreground"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Copy</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-md hover:bg-muted/80 text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>More options</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}