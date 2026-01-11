import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';

/**
 * GET /api/message-feedback/[messageId]
 * Fetches the current user's feedback for a specific message
 * Returns null if no feedback exists
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;

    // Validate UUID format
    try {
      // Simple UUID validation
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
        return NextResponse.json({ error: 'Invalid message ID format' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid message ID format' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Fetch feedback for the current user and message
    const { data, error } = await supabase
      .from('message_feedback')
      .select('*')
      .eq('message_id', messageId)
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      // Return null if no feedback found (PGRST116 is "not found" error from PostgREST)
      if (error.code === 'PGRST116') {
        return NextResponse.json(null);
      }
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching message feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/message-feedback/[messageId]
 * Creates or updates feedback for a specific message
 * Body: { type: 'like' | 'dislike', presets?: string[], comment?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;

    // Validate UUID format
    try {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
        return NextResponse.json({ error: 'Invalid message ID format' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid message ID format' }, { status: 400 });
    }

    const body = await req.json();
    const { type, presets = [], comment = null } = body;

    // Validate feedback type
    if (!type || (type !== 'like' && type !== 'dislike')) {
      return NextResponse.json(
        { error: 'Invalid feedback type. Must be "like" or "dislike"' },
        { status: 400 }
      );
    }

    // Validate presets is an array
    if (!Array.isArray(presets)) {
      return NextResponse.json(
        { error: 'Presets must be an array' },
        { status: 400 }
      );
    }

    // Validate comment is a string or null
    if (comment !== null && typeof comment !== 'string') {
      return NextResponse.json(
        { error: 'Comment must be a string or null' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Build feedback JSONB object
    const feedbackData = {
      type,
      presets,
      comment,
    };

    // Check if feedback already exists
    const { data: existing } = await supabase
      .from('message_feedback')
      .select('id')
      .eq('message_id', messageId)
      .eq('clerk_user_id', clerkUserId)
      .single();

    let result;

    if (existing) {
      // Update existing feedback
      const { data, error } = await supabase
        .from('message_feedback')
        .update({ feedback: feedbackData })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update feedback: ${error.message}`);
      }
      result = data;
    } else {
      // Create new feedback
      const { data, error } = await supabase
        .from('message_feedback')
        .insert({
          message_id: messageId,
          clerk_user_id: clerkUserId,
          feedback: feedbackData,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create feedback: ${error.message}`);
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving message feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/message-feedback/[messageId]
 * Removes the current user's feedback for a specific message (undo action)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;

    // Validate UUID format
    try {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
        return NextResponse.json({ error: 'Invalid message ID format' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid message ID format' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Delete feedback for the current user and message
    const { error } = await supabase
      .from('message_feedback')
      .delete()
      .eq('message_id', messageId)
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      throw new Error(`Failed to delete feedback: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
