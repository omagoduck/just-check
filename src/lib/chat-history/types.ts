// ============================================================================
// CONVERSATION TYPES
// ============================================================================

/**
 * A conversation as stored in the database
 */
export interface StoredConversation {
  id: string;
  clerk_user_id: string;
  title?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Cursor for pagination
 * Contains the last item's timestamp and ID for consistent ordering
 */
export interface PaginationCursor {
  updated_at: string;
  id: string;
}

/**
 * Parameters for listing conversations with pagination
 */
export interface ListConversationsParams {
  /** Clerk user ID (from auth) */
  clerkUserId: string;
  /** Number of items per page (default: 10) */
  limit?: number;
  /** Cursor for fetching next page (null for first page) */
  cursor?: string | null;
}

/**
 * Result from listing conversations with pagination
 */
export interface ListConversationsResult {
  /** Array of conversations for the current page */
  conversations: StoredConversation[];
  /** Whether more items exist beyond this page */
  hasMore: boolean;
  /** Cursor for next page (null if no more pages) */
  nextCursor: string | null;
  /** Total count of conversations (optional, for UI display) */
  totalCount?: number;
}
