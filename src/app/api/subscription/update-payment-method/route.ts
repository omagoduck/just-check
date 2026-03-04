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
 * POST /api/subscription/update-payment-method
 * Updates the payment method for a subscription.
 *
 * For on_hold subscriptions: This reactivates the subscription after successful payment.
 * For active subscriptions: This updates the payment method for future renewals.
 *
 * @returns JSON with payment_link (and optionally payment_id, client_secret)
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

    // 3. CALL DODO API: Update payment method
    const response = await fetch(`${DODO_API_URL}/subscriptions/${userSubscription.dodo_subscription_id}/update-payment-method`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'new', // Allow user to enter a new payment method
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DODO update payment method error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update payment method', details: errorText },
        { status: response.status }
      );
    }

    let data: any;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse DODO response as JSON:', parseError);
      return NextResponse.json({ error: 'Invalid response from payment provider' }, { status: 500 });
    }

    // 4. RETURN SUCCESS: Return payment link for redirect
    if (!data.payment_link) {
      return NextResponse.json({ error: 'No payment link returned' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payment_link: data.payment_link,
      payment_id: data.payment_id || null,
      client_secret: data.client_secret || null,
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
