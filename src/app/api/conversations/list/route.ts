import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listConversations } from '@/lib/chat-history/conversations';

/**
 * GET /api/conversations/list
 *
 * Retrieves cursor-paginated list of conversations for the authenticated user.
 * Ordered by updated_at DESC, then id DESC for consistent ordering.
 *
 * Query Parameters:
 * - limit: Number of items per page (default: 10, max: 50)
 * - cursor: Base64-encoded cursor string for pagination (null for first page)
 *
 * Response:
 * {
 *   conversations: StoredConversation[],
 *   hasMore: boolean,
 *   nextCursor: string | null,
 *   totalCount: number
 * }
 *
 * Error Responses:
 * - 400: Invalid parameters
 * - 401: Unauthorized (missing auth)
 * - 500: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor');

    const limit = limitParam
      ? Math.min(parseInt(limitParam, 10), 50) // Cap at 50
      : 10;

    // Validate limit parameter
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }

    const result = await listConversations({
      clerkUserId,
      limit,
      cursor,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
