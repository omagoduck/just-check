import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPinnedCount } from '@/lib/chat-history';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getPinnedCount(clerkUserId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting pinned count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
