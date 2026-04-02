import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  addMemories,
  getUserMemories,
  removeMemories,
  replaceMemories,
  updateMemories,
} from '@/lib/memory';
import { userMemoryChangeRatelimit, userMemoryGetRatelimit } from '@/lib/ratelimit';
import type { MemoryUpdatePair } from '@/types/memory';

function normalizeMemoriesInput(memories: unknown): string[] {
  if (!Array.isArray(memories)) {
    throw new Error('memories must be an array of strings');
  }

  return memories.map((memory) => {
    if (typeof memory !== 'string') {
      throw new Error('Each memory must be a string');
    }

    return memory;
  });
}

function normalizeUpdatesInput(updates: unknown): MemoryUpdatePair[] {
  if (!Array.isArray(updates)) {
    throw new Error('updates must be an array');
  }

  return updates.map((update) => {
    const candidate = update as { oldMemory?: unknown; updatedMemory?: unknown } | null;

    if (
      typeof update !== 'object' ||
      candidate === null ||
      typeof candidate.oldMemory !== 'string' ||
      typeof candidate.updatedMemory !== 'string'
    ) {
      throw new Error('Each update must include oldMemory and updatedMemory');
    }

    return {
      oldMemory: candidate.oldMemory,
      updatedMemory: candidate.updatedMemory,
    };
  });
}

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await userMemoryGetRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Too many requests.' }, { status: 429 });
    }

    const memories = await getUserMemories(clerkUserId);

    return NextResponse.json({
      memories,
      count: memories.length,
    });
  } catch (error) {
    console.error('Error fetching user memory:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await userMemoryChangeRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Too many requests.' }, { status: 429 });
    }

    const body = await req.json();
    const result = await addMemories(clerkUserId, normalizeMemoriesInput(body?.memories));

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error adding user memory:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await userMemoryChangeRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Too many requests.' }, { status: 429 });
    }

    const body = await req.json();
    const result = await updateMemories(clerkUserId, normalizeUpdatesInput(body?.updates));

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error updating user memory:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await userMemoryChangeRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Too many requests.' }, { status: 429 });
    }

    const body = await req.json();
    const result = await removeMemories(clerkUserId, normalizeMemoriesInput(body?.memories));

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error removing user memory:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await userMemoryChangeRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Too many requests.' }, { status: 429 });
    }

    const body = await req.json();
    const result = await replaceMemories(clerkUserId, normalizeMemoriesInput(body?.memories ?? []));

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error replacing user memory:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 400 }
    );
  }
}
