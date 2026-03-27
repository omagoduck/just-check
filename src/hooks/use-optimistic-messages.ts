import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Syncs new messages from useChat into the TanStack Query cache so that
 * branch state (computed from the cache) stays in sync during streaming.
 */
export function useOptimisticMessages(
  messages: UIMessage[],
  chatId: string,
  queryClient: QueryClient
) {
  // Track last-seen content per message ID so we detect updates
  // (e.g. streaming resumes after a tool call and useChat mutates the same message)
  const processedMessages = useRef<Map<string, string>>(new Map());

  // Reset when switching conversations
  useEffect(() => {
    processedMessages.current = new Map();
  }, [chatId]);

  useEffect(() => {
    messages.forEach((message) => {
      const contentKey = JSON.stringify(message.parts);
      const prevContent = processedMessages.current.get(message.id);

      // Skip if we've already synced this exact content
      if (prevContent === contentKey) return;

      // Determine parent ID from previous message in linear array
      let previousMessageId: string | null = null;
      const idx = messages.findIndex((m) => m.id === message.id);
      if (idx > 0) {
        previousMessageId = messages[idx - 1].id;
      }

      // Ensure metadata includes previous_message_id
      const metadataWithParent = message.metadata
        ? { ...(message.metadata as Record<string, unknown>), previous_message_id: previousMessageId }
        : { previous_message_id: previousMessageId };

      const msgWithDate = message as typeof message & { createdAt?: string | Date };
      const updatedMessage = {
        ...message,
        metadata: metadataWithParent,
        createdAt: msgWithDate.createdAt || new Date(),
      };

      queryClient.setQueryData(['messages', chatId], (old: { messages: UIMessage[] } | undefined) => {
        if (!old) return old;
        const existingIdx = old.messages.findIndex((m) => m.id === message.id);
        if (existingIdx === -1) {
          return { ...old, messages: [...old.messages, updatedMessage as UIMessage] };
        }
        if (JSON.stringify(old.messages[existingIdx].parts) === contentKey) return old;
        const newMessages = [...old.messages];
        newMessages[existingIdx] = updatedMessage as UIMessage;
        return { ...old, messages: newMessages };
      });

      processedMessages.current.set(message.id, contentKey);
    });
  }, [messages, chatId, queryClient]);
}
