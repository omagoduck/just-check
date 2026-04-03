import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { conversationsRatelimit } from '@/lib/ratelimit';
import { endTemporaryConversation } from '@/lib/chat-history';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await conversationsRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { conversationId } = await params;
    await endTemporaryConversation(conversationId, clerkUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending temporary conversation:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Conversation not found' || message === 'Conversation is not temporary' ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? 'Conversation not found' : 'Internal server error' }, { status });
  }
}
