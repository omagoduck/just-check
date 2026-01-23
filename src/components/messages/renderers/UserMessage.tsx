'use client';

import { memo } from 'react';
import { useState } from 'react';
import { UIMessage } from 'ai';
import { Copy, Check, Pencil } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UserMessageProps {
  message: UIMessage;
}

export const UserMessage = memo(function UserMessage({ message }: UserMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textContent = message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('');

    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex justify-end mb-4 group">
      <div className="max-w-[70%]">
        <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-sm">
          {message.parts.map((part, index) => {
            switch (part.type) {
              case 'text':
                return (
                  <div key={index} className="prose prose-sm max-w-none prose-invert">
                    <div className="whitespace-pre-wrap leading-relaxed wrap-anywhere">
                      {part.text}
                    </div>
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>

        {/* Action buttons below the message */}
        <div className="flex justify-end gap-1 mt-2">
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
              <p>Copy message</p>
            </TooltipContent>
          </Tooltip>

          {/* TODO: Add edit message functionality */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-md hover:bg-muted/80 text-foreground">
                <Pencil className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Edit message (Coming soon)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});