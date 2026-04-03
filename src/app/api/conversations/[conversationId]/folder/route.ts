import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { conversationsRatelimit } from '@/lib/ratelimit';
import { moveConversationToFolder, ensureConversationNotTemporary } from '@/lib/chat-history';

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
    const body = await req.json();
    const { folder_id } = body;

    // folder_id can be null (to remove from folder) or a string (to move to folder)
    if (folder_id !== null && typeof folder_id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid folder_id. Must be a string or null.' },
        { status: 400 }
      );
    }

    await ensureConversationNotTemporary(conversationId, clerkUserId);

    await moveConversationToFolder({
      conversationId,
      folderId: folder_id,
      clerkUserId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving conversation to folder:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const isNotFound = message === 'Folder not found'
      || message === 'Conversation not found'
      || message === 'Temporary conversations cannot be organized';
    const status = isNotFound
      ? 404
      : 500;
    return NextResponse.json({ error: status === 404 ? 'Conversation not found' : 'Internal server error' }, { status });
  }
}
