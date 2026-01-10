import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import type { InfiniteData } from '@tanstack/react-query';
import type { StoredConversation, ListConversationsResult } from '@/lib/chat-history';

// ============================================================================
// FETCH (List)
// ============================================================================

async function fetchConversations({ pageParam }: { pageParam: string | null }): Promise<ListConversationsResult> {
  const url = pageParam
    ? `/api/conversations/list?limit=10&cursor=${encodeURIComponent(pageParam)}`
    : '/api/conversations/list?limit=10';

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
}

export function useConversations() {
  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
  });
}

// ============================================================================
// CREATE
// ============================================================================

interface CreateConversationResponse {
  id: string;
}

async function createConversation(): Promise<CreateConversationResponse> {
  const response = await fetch('/api/conversations/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Failed to create conversation');
  return response.json();
}

export function useCreateConversation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversation,
    onSuccess: (data) => {
      // Invalidate conversations list to include new conversation
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Navigate to new conversation
      router.push(`/chats/${data.id}`);
    },
  });
}

// ============================================================================
// DELETE
// ============================================================================

async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete conversation');
}

export function useDeleteConversation() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversation,
    onMutate: async (conversationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['conversations'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<InfiniteData<ListConversationsResult>>(['conversations']);

      // Optimistically update: remove from cache
      queryClient.setQueryData<InfiniteData<ListConversationsResult>>(
        ['conversations'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              conversations: page.conversations.filter((c) => c.id !== conversationId),
            })),
          };
        }
      );

      // Return context with previous data for rollback
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['conversations'], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onSuccess: (_, conversationId) => {
      // Navigate home if deleted conversation was active
      if (pathname === `/chats/${conversationId}`) {
        router.push('/');
      }
    },
  })
}

// ============================================================================
// RENAME
// ============================================================================

interface RenameConversationParams {
  conversationId: string;
  newTitle: string;
}

async function renameConversation({ conversationId, newTitle }: RenameConversationParams): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle }),
  });
  if (!response.ok) throw new Error('Failed to rename conversation');
}

export function useRenameConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renameConversation,
    onMutate: async ({ conversationId, newTitle }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['conversations'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<InfiniteData<ListConversationsResult>>(['conversations']);

      // Optimistically update: rename in cache
      queryClient.setQueryData<InfiniteData<ListConversationsResult>>(
        ['conversations'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              conversations: page.conversations.map((c) =>
                c.id === conversationId ? { ...c, title: newTitle } : c
              ),
            })),
          };
        }
      );

      // Return context with previous data for rollback
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['conversations'], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

