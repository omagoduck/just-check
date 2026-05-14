import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { conversationsRatelimit } from '@/lib/ratelimit';
import { listFolders, createFolder } from '@/lib/chat-history';
import { getSupabaseAdminClient } from '@/lib/supabase-client.server';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const folders = await listFolders({ clerkUserId });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error listing folders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit
    const { success } = await conversationsRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { name, color } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Folder name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Validate color — must be a recognized hex value or empty
    const validColors = ['', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
    if (color !== undefined && color !== null && !validColors.includes(color)) {
      return NextResponse.json(
        { error: 'Invalid color value' },
        { status: 400 }
      );
    }

    // Resolve user's plan ID
    const supabase = getSupabaseAdminClient();
    const { data: subscriptions } = await supabase
      .rpc('get_user_subscription', { p_clerk_user_id: clerkUserId });
    const subscription = Array.isArray(subscriptions) ? subscriptions[0] : subscriptions;
    const planId = subscription?.plan_id ?? 'free';

    const folder = await createFolder({
      clerkUserId,
      name: name.trim(),
      color,
      planId,  // Pass plan ID for limit enforcement
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const isLimitReached = message.includes('Folder limit reached');
    const isDuplicate = message.includes('already exists');
    const status = isLimitReached ? 400 : isDuplicate ? 409 : 500;
    const errorMessage = isLimitReached
      ? 'Folder limit reached. Upgrade your plan for more folders.'
      : isDuplicate
        ? message
        : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
