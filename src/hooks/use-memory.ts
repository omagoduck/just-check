import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MemoryOperationResult, MemoryUpdatePair, UserMemoryState } from '@/types/memory';
import { useOnboardedAuth } from './use-onboarded-auth';

const memoryQueryKey = ['memory'];

async function parseJSONResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Memory request failed');
  }

  return payload;
}

async function fetchMemory(): Promise<UserMemoryState> {
  const response = await fetch('/api/memory', {
    credentials: 'include',
  });

  return parseJSONResponse<UserMemoryState>(response);
}

async function addMemory(memories: string[]): Promise<MemoryOperationResult> {
  const response = await fetch('/api/memory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ memories }),
  });

  const payload = await parseJSONResponse<{ result: MemoryOperationResult }>(response);
  return payload.result;
}

async function updateMemory(updates: MemoryUpdatePair[]): Promise<MemoryOperationResult> {
  const response = await fetch('/api/memory', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ updates }),
  });

  const payload = await parseJSONResponse<{ result: MemoryOperationResult }>(response);
  return payload.result;
}

async function removeMemory(memories: string[]): Promise<MemoryOperationResult> {
  const response = await fetch('/api/memory', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ memories }),
  });

  const payload = await parseJSONResponse<{ result: MemoryOperationResult }>(response);
  return payload.result;
}

async function replaceMemory(memories: string[]): Promise<MemoryOperationResult> {
  const response = await fetch('/api/memory', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ memories }),
  });

  const payload = await parseJSONResponse<{ result: MemoryOperationResult }>(response);
  return payload.result;
}

export function useMemory() {
  const { isSignedInAndOnboarded } = useOnboardedAuth();

  return useQuery({
    queryKey: memoryQueryKey,
    queryFn: fetchMemory,
    enabled: isSignedInAndOnboarded,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

function useSyncedMemoryUpdate() {
  const queryClient = useQueryClient();

  return async (result: MemoryOperationResult) => {
    queryClient.setQueryData<UserMemoryState>(memoryQueryKey, {
      memories: result.memories,
      count: result.count,
    });

    await queryClient.invalidateQueries({ queryKey: memoryQueryKey });
  };
}

export function useAddMemory() {
  const syncMemory = useSyncedMemoryUpdate();

  return useMutation({
    mutationFn: addMemory,
    onSuccess: syncMemory,
  });
}

export function useUpdateMemory() {
  const syncMemory = useSyncedMemoryUpdate();

  return useMutation({
    mutationFn: updateMemory,
    onSuccess: syncMemory,
  });
}

export function useRemoveMemory() {
  const syncMemory = useSyncedMemoryUpdate();

  return useMutation({
    mutationFn: removeMemory,
    onSuccess: syncMemory,
  });
}

export function useReplaceMemory() {
  const syncMemory = useSyncedMemoryUpdate();

  return useMutation({
    mutationFn: replaceMemory,
    onSuccess: syncMemory,
  });
}
