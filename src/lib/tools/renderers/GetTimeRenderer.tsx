'use client';

import type { UIMessage } from 'ai';
import type { GetTimeInput, GetTimeOutput } from '../get-time';
import { Clock } from 'lucide-react';

interface GetTimeRendererProps {
  part: UIMessage['parts'][number];
  isStreaming?: boolean;
}

export function GetTimeRenderer({ part }: GetTimeRendererProps) {
  if (part.type !== 'tool-getTime') {
    return null;
  }

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
    default:
      return null;
  }
}

