import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import type { InfiniteData } from '@tanstack/react-query';
import type { ListConversationsResult } from '@/lib/chat-history';

// ============================================================================
// FETCH (List)
// ============================================================================

async function fetchConversations({ pageParam }: { pageParam: string | null }): Promise<ListConversationsResult> {
  const url = pageParam
    ? `/api/conversations/list?limit=20&cursor=${encodeURIComponent(pageParam)}`
    : '/api/conversations/list?limit=20';

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
// FETCH ARCHIVED
// ============================================================================

async function fetchArchivedConversations({ pageParam }: { pageParam: string | null }): Promise<ListConversationsResult> {
  const url = pageParam
    ? `/api/conversations/list?view=archived&limit=20&cursor=${encodeURIComponent(pageParam)}`
    : '/api/conversations/list?view=archived&limit=20';

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch archived conversations');
  return response.json();
}

export function useArchivedConversations() {
  return useInfiniteQuery({
    queryKey: ['conversations', 'archived'],
    queryFn: fetchArchivedConversations,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
  });
}

// ============================================================================
// FETCH BY FOLDER
// ============================================================================

async function fetchConversationsInFolder(
  folderId: string,
  { pageParam }: { pageParam: string | null }
): Promise<ListConversationsResult> {
  const url = pageParam
    ? `/api/conversations/list?folder_id=${folderId}&limit=20&cursor=${encodeURIComponent(pageParam)}`
    : `/api/conversations/list?folder_id=${folderId}&limit=20`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch folder conversations');
  return response.json();
}

export function useConversationsInFolder(folderId: string) {
  return useInfiniteQuery({
    queryKey: ['conversations', 'folder', folderId],
    queryFn: (context) => fetchConversationsInFolder(folderId, context),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    enabled: !!folderId,
  });
}

// ============================================================================
// CREATE
// ============================================================================

interface CreateConversationResponse {
  id: string;
}

interface CreateConversationParams {
  title?: string;
}

async function createConversation(params?: CreateConversationParams): Promise<CreateConversationResponse> {
  const response = await fetch('/api/conversations/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: params?.title }),
  });
  if (!response.ok) throw new Error('Failed to create conversation');
  return response.json();
}

export function useCreateConversation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: CreateConversationParams) => createConversation(params),
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

// ============================================================================
// PIN
// ============================================================================

async function pinConversation(conversationId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}/pin`, {
    method: 'POST',
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to pin conversation');
  }
}

async function unpinConversation(conversationId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}/pin`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to unpin conversation');
}

export function usePinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, pinned }: { conversationId: string; pinned: boolean }) =>
      pinned ? pinConversation(conversationId) : unpinConversation(conversationId),
    onMutate: async ({ conversationId, pinned }) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const previousData = queryClient.getQueryData<InfiniteData<ListConversationsResult>>(['conversations']);
      const now = new Date().toISOString();

      queryClient.setQueryData<InfiniteData<ListConversationsResult>>(
        ['conversations'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              conversations: page.conversations.map((c) =>
                c.id === conversationId
                  ? { ...c, pinned_at: pinned ? now : null, updated_at: now }
                  : c
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['conversations'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['pinnedCount'] });
    },
  });
}

// ============================================================================
// ARCHIVE
// ============================================================================

async function archiveConversation(conversationId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}/archive`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to archive conversation');
}

async function unarchiveConversation(conversationId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}/archive`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to unarchive conversation');
}

export function useArchiveConversation() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, archived }: { conversationId: string; archived: boolean }) =>
      archived ? archiveConversation(conversationId) : unarchiveConversation(conversationId),
    onMutate: async ({ conversationId, archived }) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const previousData = queryClient.getQueryData<InfiniteData<ListConversationsResult>>(['conversations']);

      // When archiving, remove from main list. When unarchiving, the item will appear on refetch.
      if (archived) {
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
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['conversations'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'archived'] });
      queryClient.invalidateQueries({ queryKey: ['pinnedCount'] });
    },
    onSuccess: (_, { conversationId, archived }) => {
      // Navigate home if archived conversation was active
      if (archived && pathname === `/chats/${conversationId}`) {
        router.push('/');
      }
    },
  });
}

// ============================================================================
// PINNED COUNT
// ============================================================================

interface PinnedCountResult {
  count: number;
  limit: number;
  canPin: boolean;
}

async function fetchPinnedCount(): Promise<PinnedCountResult> {
  const response = await fetch('/api/conversations/pinned-count');
  if (!response.ok) throw new Error('Failed to fetch pinned count');
  return response.json();
}

export function usePinnedCount() {
  return useQuery({
    queryKey: ['pinnedCount'],
    queryFn: fetchPinnedCount,
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// ARCHIVE ALL
// ============================================================================

interface ArchiveAllResult {
  success: boolean;
  count: number;
}

async function archiveAllConversations(): Promise<ArchiveAllResult> {
  const response = await fetch('/api/conversations/archive-all', {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to archive all conversations');
  return response.json();
}

export function useArchiveAllConversations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveAllConversations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'archived'] });
      queryClient.invalidateQueries({ queryKey: ['pinnedCount'] });
    },
  });
}

// ============================================================================
// DELETE ALL
// ============================================================================

interface DeleteAllResult {
  success: boolean;
  count: number;
}

async function deleteAllConversations(): Promise<DeleteAllResult> {
  const response = await fetch('/api/conversations/delete-all', {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to delete all conversations');
  return response.json();
}

export function useDeleteAllConversations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllConversations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

