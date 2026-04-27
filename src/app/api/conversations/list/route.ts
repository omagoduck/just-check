import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listConversationsWithFilters } from '@/lib/chat-history/conversations';
import { z } from 'zod';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: z.string().optional(),
  view: z.enum(['regular', 'pinned', 'archived']).default('regular'),
  folder_id: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const parsed = listQuerySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams)
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
    const { limit, cursor, view, folder_id } = parsed.data;

    const result = await listConversationsWithFilters({
      clerkUserId,
      limit,
      cursor: cursor ?? null,
      view,
      folderId: folder_id ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
