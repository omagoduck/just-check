import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { subscriptionRatelimit } from '@/lib/ratelimit';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const { success } = await subscriptionRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    const supabase = getSupabaseAdminClient();

    // Fetch subscription data for the user
    const { data: subscriptions, error: subError } = await supabase
      .rpc('get_user_subscription', { p_clerk_user_id: clerkUserId });

    if (subError) {
      throw subError;
    }

    // The RPC returns an array, not a single object. So subscription is [] (empty array) or [{...}]
    const subscription = Array.isArray(subscriptions) ? subscriptions[0] : subscriptions;

    if (!subscription) {
      return NextResponse.json({
        planId: 'free_monthly',
        status: 'inactive',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialStart: null,
        trialEnd: null,
        amount: 0,
        currency: 'USD',
        billingCycle: 'monthly',
        subscriptionId: null,
      });
    }

    return NextResponse.json({
      planId: subscription.plan_id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.metadata?.cancel_at_next_billing_date || false,
      trialStart: subscription.trial_start,
      trialEnd: subscription.trial_end,
      amount: subscription.amount || 0,
      currency: subscription.currency || 'USD',
      billingCycle: subscription.billing_period?.toLowerCase() || 'monthly',
      subscriptionId: subscription.dodo_subscription_id,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
