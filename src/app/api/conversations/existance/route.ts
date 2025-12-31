import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { auth } from '@clerk/nextjs/server';

/**
 * Validate if a conversation exists and belongs to the authenticated user.
 * Returns 404 for both not found and access denied to avoid exposing existence.
 * 
 * GET /api/conversations/validate?id={conversationId}
 * 
 * Response:
 * - 200: { valid: true }
 * - 400: { error: "Missing conversation ID" }
 * - 404: { error: "Conversation not found" } (for both not found AND access denied)
 * - 401: { error: "Unauthorized" }
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Get authenticated user from Clerk
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { valid: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Extract conversation ID from query params
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json(
        { valid: false, error: 'Missing conversation ID' },
        { status: 400 }
      );
    }

    // 3. Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }

    // 4. Get Supabase admin client
    const supabase = getSupabaseAdminClient();

    // 5. Query the conversation - only check if it exists and belongs to user
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('id', { count: 'exact' })
      .eq('id', conversationId)
      .eq('clerk_user_id', clerkUserId)
      .is('deleted_at', null)
      .single();

    // 6. If conversation doesn't exist or doesn't belong to user, return 404
    // This prevents leaking information about which conversations exist
    if (error || !conversation) {
      return NextResponse.json(
        { valid: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // 7. Return valid
    return NextResponse.json({ valid: true });

  } catch (error) {
    console.error('Error validating conversation:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
