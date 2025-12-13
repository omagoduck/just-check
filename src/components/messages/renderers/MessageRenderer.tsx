'use client';

import { UIMessage } from 'ai';
import { UserMessage } from './UserMessage';
import { AIMessage } from './AIMessage';

interface MessageRendererProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export function MessageRenderer({ message, isStreaming = false }: MessageRendererProps) {
  switch (message.role) {
    case 'user':
      return <UserMessage message={message} />;
    case 'assistant':
      return <AIMessage message={message} isStreaming={isStreaming} />;
    default:
      return null;
  }
}