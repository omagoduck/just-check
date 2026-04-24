import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { getDodoProductId } from '@/lib/subscription-utils.server';
import { subscriptionPreviewRatelimit } from '@/lib/ratelimit';

// DODO Payments API configuration
const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const DODO_ENVIRONMENT = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode";

// Base URL for DODO API (test or live)
const DODO_API_URL =
  DODO_ENVIRONMENT === "live_mode"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

/**
 * POST /api/subscription/preview
 * Previews the plan change before actually updating
 * Calls Dodo's preview endpoint to get immediate charge and new plan details
 *
 * Request Body:
 * - productId: string (the target product ID)
 *
 * Returns: {
 *   immediateCharge: number, // in cents
 *   currency: string,
 *   newPlan: object, // Dodo's new plan details
 *   message?: string // optional message
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const { success } = await subscriptionPreviewRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many requests.' },
        { status: 429 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 2. VALIDATE REQUEST
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const dodoProductId = getDodoProductId(productId);
    if (!dodoProductId) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // 3. FETCH CURRENT SUBSCRIPTION
    const { data: subscriptions, error: subError } = await supabase
      .rpc('get_user_subscription', { p_clerk_user_id: clerkUserId });

    // The RPC returns an array, not a single object. So subscription is [] (empty array) or [{...}]
    const subscription = Array.isArray(subscriptions) ? subscriptions[0] : subscriptions;

    if (subError || !subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    if (!subscription.dodo_subscription_id) {
      return NextResponse.json({ error: 'Subscription ID not found' }, { status: 400 });
    }

    // 4. CALL DODO PREVIEW API
    const response = await fetch(
      `${DODO_API_URL}/subscriptions/${subscription.dodo_subscription_id}/change-plan/preview`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DODO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: dodoProductId,
          quantity: 1,
          proration_billing_mode: 'prorated_immediately',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dodo preview error:', errorText);
      return NextResponse.json(
        { error: 'Failed to preview plan change', details: errorText },
        { status: response.status }
      );
    }

    let data: any;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse Dodo preview response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from payment provider' },
        { status: 500 }
      );
    }

    // 5. EXTRACT PREVIEW DATA
    const immediateCharge = data?.immediate_charge?.summary?.total_amount || 0;
    const newPlan = data?.new_plan || null;
    const currency = data?.immediate_charge?.summary?.currency || subscription.currency || 'USD';

    // 6. RETURN PREVIEW DATA
    return NextResponse.json({
      success: true,
      immediateCharge,
      currency,
      newPlan,
      message: data?.message || 'Preview calculated successfully',
    });

  } catch (error) {
    console.error('Error previewing subscription change:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
