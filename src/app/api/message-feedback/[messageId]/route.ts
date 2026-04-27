import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { messageFeedbackChangeRatelimit, messageFeedbackGetRatelimit } from '@/lib/ratelimit';
import { z } from 'zod';

const paramsSchema = z.object({
  messageId: z.string().uuid(),
});

const feedbackBodySchema = z.object({
  type: z.enum(['like', 'dislike']),
  presets: z.array(z.string()).default([]),
  comment: z.string().nullable().default(null),
});

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

    const { success } = await messageFeedbackGetRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many requests.' },
        { status: 429 }
      );
    }

    const { messageId } = paramsSchema.parse(await params);

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid message ID format', details: error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
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

    const { success } = await messageFeedbackChangeRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many requests.' },
        { status: 429 }
      );
    }

    const { messageId } = paramsSchema.parse(await params);

    const parsed = feedbackBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }

    const { type, presets, comment } = parsed.data;

    const supabase = getSupabaseAdminClient();

    // Build feedback JSONB object
    const feedbackData = { type, presets, comment };

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid message ID format', details: error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
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

    const { success } = await messageFeedbackChangeRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many requests.' },
        { status: 429 }
      );
    }

    const { messageId } = paramsSchema.parse(await params);

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid message ID format', details: error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
    console.error('Error deleting message feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
