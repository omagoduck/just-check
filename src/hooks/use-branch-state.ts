import { useState, useMemo, useCallback } from 'react';
import type { StoredMessage } from '@/lib/conversation-history';
import type { UIMessage } from 'ai';

interface BranchState {
  userOverrides: Map<string | null, number>;
}

/** Pre-computed sibling info for a message */
export interface SiblingInfo {
  index: number;
  total: number;
  parentId: string | null;
}

function getAncestorChain(messages: StoredMessage[], leafId: string): StoredMessage[] {
  const byId = new Map(messages.map((m) => [m.id, m]));
  const chain: StoredMessage[] = [];
  let cursor = byId.get(leafId);
  while (cursor) {
    chain.unshift(cursor);
    cursor = cursor.previous_message_id ? byId.get(cursor.previous_message_id) : undefined;
  }
  return chain;
}

/**
 * Get the ID of the last message with actual content.
 * Skips empty assistant messages (from stopped streams that were never saved to DB)
 * to prevent previousMessageId from pointing to a non-existent message.
 */
export function getLastRealMessageId(messages: UIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'user' || (m.role === 'assistant' && m.parts && m.parts.length > 0)) {
      return m.id;
    }
  }
  return null;
}

export function useBranchState(allMessages: StoredMessage[]) {
  const [branchState, setBranchState] = useState<BranchState>({
    userOverrides: new Map(),
  });

  // O(n) - Build lookup map and group by parent
  const { nodesByParent, messageById, siblingInfo } = useMemo(() => {
    const byParent = new Map<string | null, StoredMessage[]>();
    const byId = new Map<string, StoredMessage>();

    // Single pass to build both structures
    allMessages.forEach((m) => {
      byId.set(m.id, m);
      const parentId = m.previous_message_id ?? null;
      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId)!.push(m);
    });

    // Sort each sibling group by creation time
    byParent.forEach((msgs) =>
      msgs.sort(
        (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      )
    );

    // Pre-compute sibling info for O(1) lookup during render
    const sibInfo = new Map<string, SiblingInfo>();
    byParent.forEach((siblings, parentId) => {
      siblings.forEach((msg, index) => {
        sibInfo.set(msg.id, {
          index,
          total: siblings.length,
          parentId,
        });
      });
    });

    return { nodesByParent: byParent, messageById: byId, siblingInfo: sibInfo };
  }, [allMessages]);

  const defaultSelectedSiblings = useMemo(() => {
    if (allMessages.length === 0) return new Map<string | null, number>();

    // Find leaf nodes (messages with no children) - O(n) using pre-computed map
    const childIds = new Set<string>();
    allMessages.forEach((m) => {
      if (m.previous_message_id) childIds.add(m.previous_message_id);
    });
    const leaves = allMessages.filter((m) => !childIds.has(m.id));
    if (leaves.length === 0) return new Map<string | null, number>();

    // Pick the most recently created leaf
    const latestLeaf = leaves.reduce((latest, m) =>
      new Date(m.created_at ?? 0).getTime() > new Date(latest.created_at ?? 0).getTime() ? m : latest
    );

    // Walk up to root using O(1) map lookup instead of O(n) find
    const path: StoredMessage[] = [];
    let current: StoredMessage | undefined = latestLeaf;
    while (current) {
      path.unshift(current);
      current = current.previous_message_id
        ? messageById.get(current.previous_message_id)
        : undefined;
    }

    // Record which sibling index is selected at each level - O(1) using pre-computed info
    const selectedSiblings = new Map<string | null, number>();
    path.forEach((msg) => {
      const info = siblingInfo.get(msg.id);
      if (info && info.total > 1) {
        selectedSiblings.set(info.parentId, info.index);
      }
    });

    return selectedSiblings;
  }, [nodesByParent, messageById, siblingInfo, allMessages]);

  const selectedSiblings = useMemo(() => {
    const merged = new Map(defaultSelectedSiblings);
    branchState.userOverrides.forEach((index, parentId) => {
      const siblings = nodesByParent.get(parentId);
      if (siblings && index >= 0 && index < siblings.length) {
        merged.set(parentId, index);
      }
    });
    return merged;
  }, [defaultSelectedSiblings, branchState.userOverrides, nodesByParent]);

  // Build the active path by walking down the tree using selectedSiblings.
  const activePath = useMemo(() => {
    const roots = nodesByParent.get(null);
    if (!roots || roots.length === 0) return [];

    const path: StoredMessage[] = [];
    let currentLevel = roots;

    while (currentLevel.length > 0) {
      const parentId = path.length > 0 ? path[path.length - 1].id : null;
      const idx = Math.min(
        selectedSiblings.get(parentId) ?? 0,
        currentLevel.length - 1
      );
      const selected = currentLevel[idx];
      path.push(selected);
      currentLevel = nodesByParent.get(selected.id) || [];
    }

    return path;
  }, [nodesByParent, selectedSiblings]);

  const switchBranch = useCallback(
    (parentId: string | null, direction: 'next' | 'prev') => {
      setBranchState((prev) => {
        const siblings = nodesByParent.get(parentId) ?? [];
        if (siblings.length <= 1) return prev;

        const currentIndex = prev.userOverrides.get(parentId)
          ?? selectedSiblings.get(parentId)
          ?? 0;
        const newIndex =
          direction === 'next'
            ? (currentIndex + 1) % siblings.length
            : (currentIndex - 1 + siblings.length) % siblings.length;

        const newUserOverrides = new Map(prev.userOverrides);
        newUserOverrides.set(parentId, newIndex);
        return { userOverrides: newUserOverrides };
      });
    },
    [nodesByParent, selectedSiblings]
  );

  const selectBranch = useCallback(
    (parentId: string | null, index: number) => {
      setBranchState((prev) => {
        const siblings = nodesByParent.get(parentId) ?? [];
        if (index < 0 || index >= siblings.length) return prev;
        const newUserOverrides = new Map(prev.userOverrides);
        newUserOverrides.set(parentId, index);
        return { userOverrides: newUserOverrides };
      });
    },
    [nodesByParent]
  );

  const clearOverride = useCallback(
    (parentId: string | null) => {
      setBranchState((prev) => {
        if (!prev.userOverrides.has(parentId)) return prev;
        const newUserOverrides = new Map(prev.userOverrides);
        newUserOverrides.delete(parentId);
        return { userOverrides: newUserOverrides };
      });
    },
    []
  );

  const getAncestors = useCallback(
    (messageId: string) => getAncestorChain(allMessages, messageId),
    [allMessages]
  );

  // Memoize the return value to prevent unnecessary reference changes.
  // Without this, the returned object is a new reference on every render,
  // causing handleBranchPrevious/handleBranchNext in useBranchSync to
  // recreate, which cascades through onBranchPrevious/onBranchNext in
  // page.tsx, forcing MessageRenderer/AIMessage to re-render even when
  // nothing actually changed.
  return useMemo(
    () => ({
      activePath,
      switchBranch,
      selectBranch,
      clearOverride,
      getAncestors,
      siblingInfo,
    }),
    [activePath, switchBranch, selectBranch, clearOverride, getAncestors, siblingInfo]
  );
}
