import type { ManageMemoryInput, ManageMemoryOutput } from '../memory';
import {
  addMemories,
  getUserMemories,
  removeMemories,
  updateMemories,
} from '@/lib/memory';

function normalizeMemoryText(memory: string): string {
  if (typeof memory !== 'string') {
    return '';
  }

  return memory.replace(/\r\n/g, '\n').replace(/\n+/g, ' ').trim();
}

function getMemoryNumberMap(memories: string[]): Map<string, number> {
  return new Map(memories.map((memory, index) => [memory, index + 1]));
}

function serializeMemoryBulletList(memories: string[]): string {
  if (!Array.isArray(memories) || memories.length === 0) {
    return '';
  }

  return memories.map((memory) => `- ${memory}`).join('\n');
}

function ensureUniqueMemories(memories: string[]): string[] {
  const uniqueMemories = Array.from(new Set(memories));

  if (uniqueMemories.length !== memories.length) {
    throw new Error('Duplicate memories are not allowed');
  }

  return uniqueMemories;
}

async function addMemoriesStrict(
  clerkUserId: string,
  memories: string[]
): Promise<ManageMemoryOutput> {
  const currentMemories = await getUserMemories(clerkUserId);
  const normalizedMemories = ensureUniqueMemories(memories.map(normalizeMemoryText));

  if (normalizedMemories.some(memory => !memory)) {
    throw new Error('Memory cannot be empty');
  }

  const existingMemories = normalizedMemories.filter(memory => currentMemories.includes(memory));
  if (existingMemories.length > 0) {
    throw new Error(`Memory already exists: ${existingMemories[0]}`);
  }

  const result = await addMemories(clerkUserId, normalizedMemories);
  if (result.appliedCount !== normalizedMemories.length) {
    throw new Error('Failed to add all requested memories');
  }

  return {};
}

async function removeMemoriesByTextStrict(
  clerkUserId: string,
  memories: string[]
): Promise<ManageMemoryOutput> {
  const currentMemories = await getUserMemories(clerkUserId);
  const normalizedMemories = ensureUniqueMemories(memories.map(normalizeMemoryText));

  if (normalizedMemories.some(memory => !memory)) {
    throw new Error('Memory cannot be empty');
  }

  const memoryNumberMap = getMemoryNumberMap(currentMemories);
  const missingMemory = normalizedMemories.find(memory => !memoryNumberMap.has(memory));
  if (missingMemory) {
    throw new Error(`No exact memory match found: ${missingMemory}`);
  }

  const result = await removeMemories(clerkUserId, normalizedMemories);
  if (result.appliedCount !== normalizedMemories.length) {
    throw new Error('Failed to remove all requested memories');
  }

  return {};
}

async function updateMemoriesByTextStrict(
  clerkUserId: string,
  updates: NonNullable<ManageMemoryInput['updates']>
): Promise<ManageMemoryOutput> {
  const currentMemories = await getUserMemories(clerkUserId);
  const memoryNumberMap = getMemoryNumberMap(currentMemories);
  const normalizedUpdates = updates.map((update) => ({
    oldMemory: normalizeMemoryText(update.oldMemory),
    updatedMemory: normalizeMemoryText(update.updatedMemory),
  }));

  if (normalizedUpdates.some(update => !update.oldMemory || !update.updatedMemory)) {
    throw new Error('Both oldMemory and updatedMemory are required');
  }

  const uniqueOldMemories = new Set(normalizedUpdates.map(update => update.oldMemory));
  if (uniqueOldMemories.size !== normalizedUpdates.length) {
    throw new Error('Duplicate oldMemory values are not allowed');
  }

  const previousMemories = normalizedUpdates.map(update => {
    if (!memoryNumberMap.has(update.oldMemory)) {
      throw new Error(`No exact memory match found to update: ${update.oldMemory}`);
    }

    return update.oldMemory;
  });

  previousMemories.forEach((previousMemory, index) => {
    if (previousMemory === normalizedUpdates[index].updatedMemory) {
      throw new Error(`Memory is already set to that value: ${previousMemory}`);
    }
  });

  const plannedMemories = [...currentMemories];
  previousMemories.forEach((previousMemory, index) => {
    const memoryNumber = memoryNumberMap.get(previousMemory);
    if (!memoryNumber) {
      throw new Error(`No exact memory match found to update: ${previousMemory}`);
    }

    plannedMemories[memoryNumber - 1] = normalizedUpdates[index].updatedMemory;
  });

  if (new Set(plannedMemories).size !== plannedMemories.length) {
    throw new Error('Updated memories would create duplicates');
  }

  const result = await updateMemories(clerkUserId, normalizedUpdates);
  if (result.appliedCount !== normalizedUpdates.length) {
    throw new Error('Failed to update all requested memories');
  }

  return {};
}

export async function executeManageMemory(
  input: ManageMemoryInput,
  clerkUserId?: string
): Promise<ManageMemoryOutput> {
  if (!clerkUserId) {
    throw new Error('Unauthorized memory access');
  }

  try {
    switch (input.action) {
      case 'add':
        return await addMemoriesStrict(clerkUserId, input.memories ?? []);

      case 'update':
        return await updateMemoriesByTextStrict(clerkUserId, input.updates ?? []);

      case 'remove':
        return await removeMemoriesByTextStrict(clerkUserId, input.memories ?? []);

      case 'view': {
        const memories = serializeMemoryBulletList(await getUserMemories(clerkUserId));
        return {
          memories,
        };
      }

      default:
        throw new Error('Invalid memory action');
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `The operation failed completely. Please try again. Reason: ${reason}`
    );
  }
}
