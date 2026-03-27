import { useMemo, useCallback } from 'react';
import type { UIMessage } from 'ai';
import type { UIMessagePart, MessageMetadata } from '@/lib/conversation-history';
import { useBranchState } from '@/hooks/use-branch-state';
import type { StoredMessage } from '@/lib/conversation-history';

/**
 * Manages branch state derived from the query cache.
 * Provides the active path, sibling info, and navigation handlers.
 */
export function useBranchSync(
  messagesData: { messages: UIMessage[] } | undefined,
  chatId: string
) {
  // Convert UIMessages from the API into StoredMessages for branch tree computation
  const allStoredMessages: StoredMessage[] = useMemo(() => {
    if (!messagesData?.messages) return [];
    return messagesData.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => {
        const meta = m.metadata as { previous_message_id?: string | null } | undefined;
        const msgWithDate = m as typeof m & { createdAt?: string | Date };
        return {
          id: m.id,
          conversation_id: chatId,
          previous_message_id: meta?.previous_message_id ?? null,
          sender_type: m.role as 'user' | 'assistant',
          content: m.parts,
          metadata: m.metadata,
          created_at: msgWithDate.createdAt ? new Date(msgWithDate.createdAt).toISOString() : undefined,
        };
      });
  }, [messagesData, chatId]);

  const branchState = useBranchState(allStoredMessages);

  const toUIMessage = useCallback(
    (m: { id: string; sender_type: string; content: UIMessagePart[]; metadata?: MessageMetadata; created_at?: string }) => ({
      id: m.id,
      role: m.sender_type as 'user' | 'assistant',
      parts: m.content,
      metadata: m.metadata,
      createdAt: m.created_at ? new Date(m.created_at) : undefined,
    } as UIMessage),
    []
  );

  const displayedMessages = useMemo(() => {
    return branchState.activePath.map(toUIMessage);
  }, [branchState.activePath, toUIMessage]);

  const handleBranchPrevious = useCallback(
    (parentId: string | null) => {
      branchState.switchBranch(parentId, 'prev');
    },
    [branchState]
  );

  const handleBranchNext = useCallback(
    (parentId: string | null) => {
      branchState.switchBranch(parentId, 'next');
    },
    [branchState]
  );

  return {
    displayedMessages,
    branchState,
    siblingInfo: branchState.siblingInfo,
    handleBranchPrevious,
    handleBranchNext,
    toUIMessage,
  };
}
