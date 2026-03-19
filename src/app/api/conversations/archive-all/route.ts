import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { conversationsRatelimit } from '@/lib/ratelimit';
import { archiveAllConversations } from '@/lib/chat-history';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await conversationsRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const result = await archiveAllConversations(clerkUserId);

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error archiving all conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
