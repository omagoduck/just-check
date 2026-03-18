import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConversationFolder } from '@/lib/chat-history';

// ============================================================================
// FETCH (List)
// ============================================================================

async function fetchFolders(): Promise<{ folders: ConversationFolder[] }> {
  const response = await fetch('/api/folders');
  if (!response.ok) throw new Error('Failed to fetch folders');
  return response.json();
}

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
  });
}

// ============================================================================
// FETCH SINGLE
// ============================================================================

async function fetchFolder(folderId: string): Promise<{ folder: ConversationFolder }> {
  const response = await fetch(`/api/folders/${folderId}`);
  if (!response.ok) throw new Error('Failed to fetch folder');
  return response.json();
}

export function useFolder(folderId: string) {
  return useQuery({
    queryKey: ['folders', folderId],
    queryFn: () => fetchFolder(folderId),
    enabled: !!folderId,
  });
}

// ============================================================================
// CREATE
// ============================================================================

interface CreateFolderParams {
  name: string;
  color?: string;
}

async function createFolder(params: CreateFolderParams): Promise<{ folder: ConversationFolder }> {
  const response = await fetch('/api/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to create folder');
  }
  return response.json();
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

// ============================================================================
// UPDATE
// ============================================================================

interface UpdateFolderParams {
  folderId: string;
  name?: string;
  color?: string | null;
}

async function updateFolder({ folderId, ...params }: UpdateFolderParams): Promise<{ folder: ConversationFolder }> {
  const response = await fetch(`/api/folders/${folderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to update folder');
  }
  return response.json();
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

// ============================================================================
// DELETE
// ============================================================================

async function deleteFolder(folderId: string): Promise<void> {
  const response = await fetch(`/api/folders/${folderId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete folder');
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      // Also invalidate conversations since folder_id will be cleared
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// ============================================================================
// MOVE CONVERSATION TO FOLDER
// ============================================================================

interface MoveToFolderParams {
  conversationId: string;
  folderId: string | null;
}

async function moveToFolder({ conversationId, folderId }: MoveToFolderParams): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}/folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder_id: folderId }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to move conversation');
  }
}

export function useMoveToFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moveToFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}
