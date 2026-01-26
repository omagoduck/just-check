'use client';

import { memo } from "react";
import { UIMessage } from 'ai';
import { UserMessage } from './UserMessage';
import { AIMessage } from './AIMessage';

interface MessageRendererProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export const MessageRenderer = memo(function MessageRenderer({ message, isStreaming = false }: MessageRendererProps) {
  // Don't render empty messages (unless it's the last one and streaming)
  const hasContent = message.parts && message.parts.length > 0;
  if (!hasContent && !isStreaming) {
    return null;
  }

  switch (message.role) {
    case 'user':
      return <UserMessage message={message} />;
    case 'assistant':
      return <AIMessage message={message} isStreaming={isStreaming} />;
    default:
      return null;
  }
});