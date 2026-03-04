import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { subscriptionRatelimit } from '@/lib/ratelimit';

// DODO Payments API configuration
const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const DODO_ENVIRONMENT = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode";

// Base URL for DODO API (test or live)
const DODO_API_URL =
  DODO_ENVIRONMENT === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

/**
 * POST /api/subscription/cancel
 * Cancels the user's subscription at the next billing date
 *
 * This sets cancel_at_next_billing_date to true, meaning the subscription
 * will remain active until the end of the current billing period and then
 * automatically cancel.
 *
 * @returns JSON with success status and message
 */
export async function POST() {
  try {
    // 1. AUTHENTICATION: Get authenticated user from Clerk
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

    // 2. FETCH SUBSCRIPTION: Use database function to get the most relevant subscription
    const { data: subscription, error: subError } = await supabase
      .rpc('get_user_subscription', { p_clerk_user_id: clerkUserId });

    if (subError || !subscription || subscription.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // The RPC returns an array, get the first (and only) result
    const userSubscription = subscription[0];

    if (!userSubscription.dodo_subscription_id) {
      return NextResponse.json({ error: 'Subscription ID not found' }, { status: 400 });
    }

    // 3. CALL DODO API: PATCH subscription to set cancel_at_next_billing_date
    const response = await fetch(`${DODO_API_URL}/subscriptions/${userSubscription.dodo_subscription_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancel_at_next_billing_date: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DODO cancel subscription error:', errorText);
      return NextResponse.json(
        { error: 'Failed to cancel subscription', details: errorText },
        { status: response.status }
      );
    }

    let data: any;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse DODO response as JSON:', parseError);
      data = {};
    }

    // 4. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period',
      subscription: data || null,
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
