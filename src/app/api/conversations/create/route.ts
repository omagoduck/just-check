import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { getRemainingAllowance } from '@/lib/allowance';
import { v4 as uuidv4 } from 'uuid';
import { conversationsRatelimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await conversationsRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    // Check allowance before creating conversation
    const remainingAllowance = await getRemainingAllowance(clerkUserId);
    if (remainingAllowance <= 0) {
      return NextResponse.json({ error: 'Insufficient allowance' }, { status: 402 });
    }

    const supabase = getSupabaseAdminClient();
    const conversationId = uuidv4();
    const body = await req.json();
    const { title } = body;

    // Limit title to 256 characters if provided
    const conversationTitle = title && typeof title === 'string' && title.trim().length > 0
      ? title.trim().slice(0, 256)
      : null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        clerk_user_id: clerkUserId,
        title: conversationTitle,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
