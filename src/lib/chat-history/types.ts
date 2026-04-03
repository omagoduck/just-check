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
  is_temporary?: boolean;
  pinned_at?: string | null;
  archived_at?: string | null;
  folder_id?: string | null;
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

// ============================================================================
// CONVERSATION VIEW TYPES
// ============================================================================

/**
 * View mode for filtering conversations
 */
export type ConversationView = 'regular' | 'pinned' | 'archived';

/**
 * Extended parameters for listing conversations with organization filters
 */
export interface ListConversationsWithFiltersParams extends ListConversationsParams {
  /** Filter by view mode */
  view?: ConversationView;
  /** Filter by folder ID */
  folderId?: string | null;
}

// ============================================================================
// FOLDER TYPES
// ============================================================================

/**
 * A conversation folder as stored in the database
 */
export interface ConversationFolder {
  id: string;
  clerk_user_id: string;
  name: string;
  color?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  /** Number of conversations in this folder (populated by query) */
  conversation_count?: number;
}

/**
 * Parameters for creating a folder
 */
export interface CreateFolderParams {
  clerkUserId: string;
  name: string;
  color?: string;
}

/**
 * Parameters for updating a folder
 */
export interface UpdateFolderParams {
  folderId: string;
  clerkUserId: string;
  name?: string;
  color?: string | null;
}

/**
 * Parameters for listing folders
 */
export interface ListFoldersParams {
  clerkUserId: string;
}

/**
 * Parameters for moving a conversation to a folder
 */
export interface MoveToFolderParams {
  conversationId: string;
  folderId: string | null;
  clerkUserId: string;
}

/**
 * Pin limit configuration
 */
export const PIN_LIMIT = 5;
