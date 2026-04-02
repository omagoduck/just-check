export type MemoryAction = 'add' | 'update' | 'remove' | 'replace' | 'view';

export interface MemoryUpdatePair {
  oldMemory: string;
  updatedMemory: string;
}

export interface UserMemoryState {
  memories: string[];
  count: number;
}

export interface MemoryOperationResult extends UserMemoryState {
  success: boolean;
  action: MemoryAction;
  changed: boolean;
  requestedCount: number;
  appliedCount: number;
  message: string;
}
