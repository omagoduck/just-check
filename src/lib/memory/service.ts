import { getSupabaseAdminClient } from '@/lib/supabase-client';
import type { MemoryAction, MemoryOperationResult, MemoryUpdatePair } from '@/types/memory';

function sanitizeMemoryString(memory: string): string {
  if (typeof memory !== 'string') return '';

  return memory.replace(/\r\n/g, '\n').replace(/\n+/g, ' ').trim();
}

function dedupeMemories(memories: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const memory of memories) {
    if (!seen.has(memory)) {
      seen.add(memory);
      result.push(memory);
    }
  }

  return result;
}

function normalizeMemoryBatch(memories: string[]): string[] {
  if (!Array.isArray(memories) || memories.length === 0) {
    throw new Error('At least one memory is required');
  }

  const normalized = memories.map(sanitizeMemoryString);
  if (normalized.some(memory => memory.length === 0)) {
    throw new Error('Memory cannot be empty');
  }

  return dedupeMemories(normalized);
}

function normalizeUpdateBatch(updates: MemoryUpdatePair[]): MemoryUpdatePair[] {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error('At least one update pair is required');
  }

  const normalized = updates.map(update => {
    const oldMemory = sanitizeMemoryString(update?.oldMemory ?? '');
    const updatedMemory = sanitizeMemoryString(update?.updatedMemory ?? '');

    if (!oldMemory || !updatedMemory) {
      throw new Error('Both oldMemory and updatedMemory are required');
    }

    return { oldMemory, updatedMemory };
  });

  const seen = new Set<string>();
  const deduped: MemoryUpdatePair[] = [];

  for (const update of normalized) {
    const key = `${update.oldMemory}\u0000${update.updatedMemory}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(update);
    }
  }

  return deduped;
}

async function getStoredUserMemories(clerkUserId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('user_memory')
    .select('memories')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return [];
    }
    throw new Error(`Failed to load user memory: ${error.message}`);
  }

  if (!Array.isArray(data?.memories)) {
    return [];
  }

  return dedupeMemories(data.memories.map(sanitizeMemoryString).filter(Boolean));
}

async function upsertUserMemories(clerkUserId: string, memories: string[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const normalizedMemories = dedupeMemories(memories.map(sanitizeMemoryString).filter(Boolean));

  const { error } = await supabase
    .from('user_memory')
    .upsert(
      {
        clerk_user_id: clerkUserId,
        memories: normalizedMemories,
      },
      { onConflict: 'clerk_user_id' }
    );

  if (error) {
    throw new Error(`Failed to save user memory: ${error.message}`);
  }
}

export async function getUserMemories(clerkUserId: string): Promise<string[]> {
  return getStoredUserMemories(clerkUserId);
}

function buildOperationResult(params: {
  action: MemoryAction;
  requestedCount: number;
  appliedCount: number;
  currentMemories: string[];
  nextMemories: string[];
  successMessage: string;
  noChangeMessage: string;
}): MemoryOperationResult {
  const {
    action,
    requestedCount,
    appliedCount,
    currentMemories,
    nextMemories,
    successMessage,
    noChangeMessage,
  } = params;

  const changed = appliedCount > 0;
  const finalMemories = changed ? nextMemories : currentMemories;

  return {
    success: true,
    action,
    changed,
    requestedCount,
    appliedCount,
    memories: finalMemories,
    count: finalMemories.length,
    message: changed ? successMessage : noChangeMessage,
  };
}

export async function replaceMemories(clerkUserId: string, memories: string[]): Promise<MemoryOperationResult> {
  const nextMemories = dedupeMemories(memories.map(sanitizeMemoryString).filter(Boolean));

  const currentMemories = await getUserMemories(clerkUserId);
  const requestedCount = nextMemories.length;
  const changed =
    currentMemories.length !== nextMemories.length ||
    currentMemories.some((memory, index) => memory !== nextMemories[index]);

  if (changed) {
    await upsertUserMemories(clerkUserId, nextMemories);
  }

  return {
    success: true,
    action: 'replace',
    changed,
    requestedCount,
    appliedCount: changed ? Math.max(currentMemories.length, nextMemories.length) : 0,
    memories: nextMemories,
    count: nextMemories.length,
    message: changed ? 'Memory list updated' : 'Memory list already up to date',
  };
}

export async function addMemories(clerkUserId: string, memories: string[]): Promise<MemoryOperationResult> {
  const requestedMemories = normalizeMemoryBatch(memories);
  const currentMemories = await getUserMemories(clerkUserId);
  const nextMemories = [...currentMemories];

  let appliedCount = 0;
  for (const memory of requestedMemories) {
    if (!nextMemories.includes(memory)) {
      nextMemories.push(memory);
      appliedCount += 1;
    }
  }

  const result = buildOperationResult({
    action: 'add',
    requestedCount: requestedMemories.length,
    appliedCount,
    currentMemories,
    nextMemories,
    successMessage: appliedCount === 1 ? 'Memory added' : 'Memories added',
    noChangeMessage: 'All memories already exist',
  });

  if (result.changed) {
    await upsertUserMemories(clerkUserId, result.memories);
  }

  return result;
}

export async function removeMemories(clerkUserId: string, memories: string[]): Promise<MemoryOperationResult> {
  const requestedMemories = normalizeMemoryBatch(memories);
  const currentMemories = await getUserMemories(clerkUserId);

  const targetSet = new Set(requestedMemories);
  const nextMemories = currentMemories.filter(memory => !targetSet.has(memory));
  const appliedCount = currentMemories.length - nextMemories.length;

  const result = buildOperationResult({
    action: 'remove',
    requestedCount: requestedMemories.length,
    appliedCount,
    currentMemories,
    nextMemories,
    successMessage: appliedCount === 1 ? 'Memory removed' : 'Memories removed',
    noChangeMessage: 'No matching memories found',
  });

  if (result.changed) {
    await upsertUserMemories(clerkUserId, result.memories);
  }

  return result;
}

export async function updateMemories(
  clerkUserId: string,
  updates: MemoryUpdatePair[]
): Promise<MemoryOperationResult> {
  const requestedUpdates = normalizeUpdateBatch(updates);

  const currentMemories = await getUserMemories(clerkUserId);
  const nextMemories = [...currentMemories];

  let appliedCount = 0;

  for (const update of requestedUpdates) {
    const index = nextMemories.findIndex(memory => memory === update.oldMemory);
    if (index === -1) {
      continue;
    }

    if (nextMemories[index] === update.updatedMemory) {
      continue;
    }

    nextMemories[index] = update.updatedMemory;
    appliedCount += 1;
  }

  const normalizedNextMemories = dedupeMemories(nextMemories);

  const result = buildOperationResult({
    action: 'update',
    requestedCount: requestedUpdates.length,
    appliedCount,
    currentMemories,
    nextMemories: normalizedNextMemories,
    successMessage: appliedCount === 1 ? 'Memory updated' : 'Memories updated',
    noChangeMessage: 'No matching memories found to update',
  });

  if (result.changed) {
    await upsertUserMemories(clerkUserId, result.memories);
  }

  return result;
}
