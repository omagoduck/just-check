import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client.server';
import { getFolderLimitInfo } from '@/lib/chat-history';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve plan ID
    const supabase = getSupabaseAdminClient();
    const { data: subscriptions } = await supabase
      .rpc('get_user_subscription', { p_clerk_user_id: clerkUserId });
    const subscription = Array.isArray(subscriptions) ? subscriptions[0] : subscriptions;
    const planId = subscription?.plan_id ?? 'free';

    const result = await getFolderLimitInfo(clerkUserId, planId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting folder limit info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}