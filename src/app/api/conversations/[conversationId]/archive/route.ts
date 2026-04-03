import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { conversationsRatelimit } from '@/lib/ratelimit';
import { archiveConversation, unarchiveConversation, ensureConversationNotTemporary } from '@/lib/chat-history';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
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

    const { conversationId } = await params;
    await ensureConversationNotTemporary(conversationId, clerkUserId);

    await archiveConversation(conversationId, clerkUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const isNotFound = message === 'Conversation not found' || message === 'Temporary conversations cannot be organized';
    const status = isNotFound
      ? 404
      : 500;
    return NextResponse.json(
      { error: status === 404 ? 'Conversation not found' : 'Internal server error' },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
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

    const { conversationId } = await params;
    await ensureConversationNotTemporary(conversationId, clerkUserId);

    await unarchiveConversation(conversationId, clerkUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unarchiving conversation:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const isNotFound = message === 'Conversation not found' || message === 'Temporary conversations cannot be organized';
    const status = isNotFound
      ? 404
      : 500;
    return NextResponse.json(
      { error: status === 404 ? 'Conversation not found' : 'Internal server error' },
      { status }
    );
  }
}
