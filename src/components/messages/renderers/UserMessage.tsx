'use client';

import { memo, useState } from 'react';
import { UIMessage } from 'ai';
import { Copy, Check, Pencil, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsTouchDevice } from '@/hooks/use-touch-device';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/utils/clipboard';

interface UserMessageProps {
  message: UIMessage;
}

export const UserMessage = memo(function UserMessage({ message }: UserMessageProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const isTouchDevice = useIsTouchDevice();

  const textParts = message.parts.filter(part => part.type === 'text');
  const imageParts = message.parts.filter(
    (part): part is Extract<UIMessage['parts'][number], { type: 'file' }> =>
      part.type === 'file' && part.mediaType?.startsWith('image/')
  );

  const handleCopy = async () => {
    const textContent = textParts.map(part => part.text).join('');

    try {
      await copyToClipboard(textContent);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopyFailed(true);
      setCopied(false);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  return (
    <div className="flex justify-end mb-4 group">
      <div className="max-w-[70%]">
        {/* Image attachments displayed above and outside the bubble — V1 UI */}
        {imageParts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 justify-end">
            {imageParts.map((part, index) => (
              <div
                key={`image-${index}`}
                className="relative rounded-lg overflow-hidden border border-border/50 shadow-sm"
              >
                <img
                  src={part.url}
                  alt={part.filename || 'Uploaded image'}
                  className="w-24 h-24 object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-sm w-fit max-w-full ml-auto">
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
        <div className={cn('flex justify-end gap-1 mt-2', isTouchDevice && 'opacity-100')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopy}
                className={cn(
                  'transition-opacity duration-200 p-2 rounded-md hover:bg-muted/80 text-foreground/70 hover:text-foreground',
                  isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : copyFailed ? (
                  <X className="h-4 w-4 text-red-500" />
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
              <button className={cn(
                'transition-opacity duration-200 p-2 rounded-md hover:bg-muted/80 text-foreground/70 hover:text-foreground',
                isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}>
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