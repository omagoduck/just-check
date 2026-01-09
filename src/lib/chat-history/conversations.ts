/**
 * Conversation Database Service
 *
 * Contains database operations for conversation listing.
 */

import { getSupabaseAdminClient } from '@/lib/supabase-client';
import type {
  ListConversationsParams,
  ListConversationsResult,
  StoredConversation,
  PaginationCursor,
} from './types';

const DEFAULT_LIMIT = 10;

/**
 * Lists conversations for a user with cursor-based pagination
 *
 * @param params - Parameters including clerkUserId, limit, and cursor
 * @returns Paginated result with conversations, hasMore flag, and nextCursor
 * @throws Error if database query fails
 */
export async function listConversations(
  params: ListConversationsParams
): Promise<ListConversationsResult> {
  const { clerkUserId, limit = DEFAULT_LIMIT, cursor } = params;

  const supabase = getSupabaseAdminClient();

  let query = supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .eq('clerk_user_id', clerkUserId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1); // Fetch one extra to determine if there's more

  // Apply cursor filter if provided
  if (cursor) {
    try {
      const cursorData = JSON.parse(cursor) as PaginationCursor;
      query = query.or(
        `updated_at.lt.${cursorData.updated_at},updated_at.eq.${cursorData.updated_at}.and(id.lt.${cursorData.id})`
      );
    } catch (error) {
      console.error('Invalid cursor format:', error);
      throw new Error('Invalid cursor format');
    }
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }

  const allConversations = (data || []) as StoredConversation[];
  
  // Check if we fetched more than the limit to determine hasMore
  const hasMore = allConversations.length > limit;
  const conversations = hasMore ? allConversations.slice(0, limit) : allConversations;
  
  // Generate next cursor from the last item if there are more
  let nextCursor: string | null = null;
  if (hasMore && conversations.length > 0) {
    const lastConversation = conversations[conversations.length - 1];
    nextCursor = JSON.stringify({
      updated_at: lastConversation.updated_at,
      id: lastConversation.id,
    } as PaginationCursor);
  }

  return {
    conversations,
    hasMore,
    nextCursor,
    totalCount: count || 0,
  };
}
