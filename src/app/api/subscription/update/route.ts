import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { subscriptionRatelimit } from '@/lib/ratelimit';
import { getDodoProductId } from '@/lib/subscription-utils';

// DODO Payments API configuration
const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const DODO_ENVIRONMENT = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode";

// Base URL for DODO API (test or live)
const DODO_API_URL =
  DODO_ENVIRONMENT === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

/**
 * POST /api/subscription/update
 * Updates user's subscription to a new plan with automatic proration
 *
 * Business Logic:
 * 1. Call Dodo's change-plan API with prorated_immediately mode
 * 2. Dodo automatically calculates the fair charge based on unused time
 * 3. Return subscription data from Dodo (no custom credit logic)
 *
 * @param request - NextRequest with { productId: string } in body
 * @returns JSON with success, subscription data, currency
 */
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION: Get authenticated user from Clerk
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await subscriptionRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    // 2. VALIDATE REQUEST: Get productId from request body
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const dodoProductId = getDodoProductId(productId);
    if (!dodoProductId) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // 3. FETCH CURRENT SUBSCRIPTION
    const { data: subscriptions, error: subError } = await supabase
      .rpc('get_user_subscription', { p_clerk_user_id: clerkUserId });

    // The RPC returns an array, not a single object. So subscription is [] (empty array) or [{...}]
    const subscription = Array.isArray(subscriptions) ? subscriptions[0] : subscriptions;

    if (subError || !subscription) {
      return NextResponse.json({ 
        error: 'No active subscription found',
        message: 'You need an active subscription to upgrade. Please subscribe first.'
      }, { status: 403 });
    }

    if (!subscription.dodo_subscription_id) {
      return NextResponse.json({ error: 'Subscription ID not found' }, { status: 400 });
    }

    if (!subscription.dodo_customer_id) {
      return NextResponse.json({ error: 'Customer ID not found' }, { status: 400 });
    }

    // 4. CHANGE PLAN: Call DODO API with prorated_immediately for automatic proration
    // prorated_immediately = Dodo automatically calculates fair charge based on unused time
    // on_payment_failure: prevent_change = only change if payment succeeds
    const response = await fetch(`${DODO_API_URL}/subscriptions/${subscription.dodo_subscription_id}/change-plan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: dodoProductId,
        quantity: 1,
        proration_billing_mode: 'prorated_immediately',
        on_payment_failure: 'prevent_change',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DODO update subscription error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update subscription', details: errorText },
        { status: response.status }
      );
    }

    let data: any;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse DODO response as JSON:', parseError);
      // Even if response parsing fails, the subscription change may have succeeded
      // Don't throw - just continue with empty data
      data = {};
    }

    // 5. RETURN SUCCESS: Return subscription data from Dodo
    return NextResponse.json({
      success: true,
      subscription: data?.subscription || null,
      currency: subscription.currency || 'USD',
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
