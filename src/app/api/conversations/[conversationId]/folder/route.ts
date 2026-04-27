import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { conversationsRatelimit } from '@/lib/ratelimit';
import { moveConversationToFolder, ensureConversationNotTemporary } from '@/lib/chat-history';
import { z } from 'zod';

const paramsSchema = z.object({
  conversationId: z.string().uuid(),
});

// folder_id can be null (to remove from folder) or a UUID (to move to folder)
const moveBodySchema = z.object({
  folder_id: z.string().uuid().nullable(),
});

export async function POST(
  req: NextRequest,
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

    const { conversationId } = paramsSchema.parse(await params);

    const parsed = moveBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
    const { folder_id: folderId } = parsed.data;

    await ensureConversationNotTemporary(conversationId, clerkUserId);

    await moveConversationToFolder({
      conversationId,
      folderId,
      clerkUserId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
    console.error('Error moving conversation to folder:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const isNotFound = message === 'Folder not found'
      || message === 'Conversation not found'
      || message === 'Temporary conversations cannot be organized';
    const status = isNotFound ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? 'Conversation not found' : 'Internal server error' }, { status });
  }
}
