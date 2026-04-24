import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DODO_API_KEY, DODO_API_URL } from '@/lib/dodo-utils.server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { subscriptionRatelimit } from '@/lib/ratelimit';

/**
 * POST /api/subscription/cancel
 * Cancels or uncancels the user's subscription based on the cancelAtNextBillingDate parameter
 *
 * When cancelAtNextBillingDate is true, the subscription will remain active until 
 * the end of the current billing period and then automatically cancel.
 *
 * When cancelAtNextBillingDate is false, the subscription will be reactivated 
 * and continue to renew automatically.
 *
 * @param cancelAtNextBillingDate - boolean indicating whether to cancel (true) or uncancel (false)
 * @returns JSON with success status and message
 */
export async function POST(request: Request) {
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

    // Parse request body to get cancelAtNextBillingDate parameter
    let cancelAtNextBillingDate: boolean;
    try {
      const body = await request.json();
      cancelAtNextBillingDate = body.cancelAtNextBillingDate;
      
      if (typeof cancelAtNextBillingDate !== 'boolean') {
        return NextResponse.json({ 
          error: 'Invalid request body',
          message: 'cancelAtNextBillingDate must be a boolean value'
        }, { status: 400 });
      }
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid request body',
        message: 'Request body must be valid JSON with cancelAtNextBillingDate boolean field'
      }, { status: 400 });
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

    // Check current state and validate the requested action
    const isCurrentlyScheduledForCancellation = userSubscription.metadata?.cancel_at_next_billing_date === true;
    
    if (cancelAtNextBillingDate && isCurrentlyScheduledForCancellation) {
      return NextResponse.json({ 
        error: 'Subscription already scheduled for cancellation',
        message: 'Your subscription is already scheduled to cancel at the end of the current billing period.'
      }, { status: 400 });
    }
    
    if (!cancelAtNextBillingDate && !isCurrentlyScheduledForCancellation) {
      return NextResponse.json({ 
        error: 'Subscription is not scheduled for cancellation',
        message: 'Your subscription is not scheduled for cancellation.'
      }, { status: 400 });
    }

    // 3. CALL DODO API: PATCH subscription to set cancel_at_next_billing_date
    const response = await fetch(`${DODO_API_URL}/subscriptions/${userSubscription.dodo_subscription_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancel_at_next_billing_date: cancelAtNextBillingDate,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DODO subscription update error:', errorText);
      return NextResponse.json(
        { error: `Failed to ${cancelAtNextBillingDate ? 'cancel' : 'uncancel'} subscription`, details: errorText },
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
    const successMessage = cancelAtNextBillingDate 
      ? 'Subscription will be cancelled at the end of the current billing period'
      : 'Subscription has been reactivated and will continue to renew automatically';
      
    return NextResponse.json({
      success: true,
      message: successMessage,
      subscription: data || null,
    });

  } catch (error) {
    console.error('Error updating subscription cancellation status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
