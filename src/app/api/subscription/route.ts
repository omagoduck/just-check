import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();

    // Fetch subscription data for the user
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    // If no subscription exists, return null/empty data
    if (subError && subError.code !== 'PGRST116') {
      throw subError;
    }

    if (!subscription) {
      return NextResponse.json({
        planType: 'free',
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
      planType: subscription.plan_type,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_next_billing_date || false,
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
