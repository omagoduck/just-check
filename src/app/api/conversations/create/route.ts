import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const conversationId = uuidv4();
    const body = await req.json();
    const { title } = body;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Limit title to 256 characters if provided
    const conversationTitle = title && typeof title === 'string' && title.trim().length > 0
      ? title.trim().slice(0, 256)
      : null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        user_id: profileData.id,
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
