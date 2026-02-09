/**
 * Dodo Payment Provider Webhook Handler
 * 
 * This file handles incoming webhooks from the Dodo payment provider.
 * Webhooks are HTTP callbacks that notify your application when events happen
 * in the payment provider's system (e.g., subscription created, payment succeeded, etc.).
 * 
 * @see https://www.dodo.com/developers/docs/webhooks for Dodo webhook documentation
 * 
 * =============================================================================
 * WEBHOOK FLOW OVERVIEW:
 * =============================================================================
 * 
 * 1. RECEIVE: Dodo sends a POST request to this endpoint when an event occurs
 * 2. VERIFY: Validate the webhook signature to ensure it's actually from Dodo
 * 3. LOG: Record the webhook in the database for audit and idempotency
 * 4. PROCESS: Handle the specific event type (subscription active, payment, etc.)
 * 5. UPDATE: Mark the webhook as processed in the database
 * 
 * =============================================================================
 * WHY THIS ARCHITECTURE:
 * =============================================================================
 * 
 * - SECURITY: Signature verification prevents fake webhooks from malicious actors
 * - IDEMPOTENCY: Processing each webhook only once prevents duplicate operations
 * - AUDIT TRAIL: All webhooks are logged for troubleshooting
 * - FAULT TOLERANCE: If processing fails, we log the error without crashing
 * 
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, SupabaseClient } from "@/lib/supabase-client";
import { Webhook } from "standardwebhooks";

// =============================================================================
// TIMESTAMP DEDUPLICATION
// ==============================================================================

/**
 * Checks if a Dodo event should be processed based on provider timestamp.
 * Dodo fires duplicate events with the same timestamp for the same action.
 * We track the last processed Dodo timestamp in subscription metadata.
 *
 * @param supabase - Supabase client
 * @param subscriptionId - Dodo subscription ID
 * @param dodoTimestamp - ISO 8601 timestamp from Dodo event
 * @returns Object with shouldProcess boolean and current stored timestamp
 */
async function shouldProcessDodoEvent(
  supabase: SupabaseClient,
  subscriptionId: string,
  dodoTimestamp: string
): Promise<{ shouldProcess: boolean; currentProviderTimestamp: string | null }> {
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('metadata')
    .eq('dodo_subscription_id', subscriptionId)
    .single();

  const currentProviderTimestamp = subscription?.metadata?.provider_updated_at || null;

  // If same timestamp exists, this is a duplicate from the same Dodo action
  if (currentProviderTimestamp === dodoTimestamp) {
    return { shouldProcess: false, currentProviderTimestamp };
  }

  return { shouldProcess: true, currentProviderTimestamp };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

// This secret is used to verify that incoming webhooks are actually from Dodo
// and not from someone pretending to be Dodo (security measure)
// It should be stored in your .env file as DODO_WEBHOOK_SECRET
const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET;

// =============================================================================
// PLAN ALLOWANCE MAPPING
// =============================================================================

// This object defines how many AI messages each subscription plan allows per month.
// The key is the plan name (lowercase) and the value is the message allowance. The allowance is a number, neither token nor money. Just number.
//
// Example:
// - "free" plan: 0 messages (or very limited)
// - "plus" plan: 400 messages per month
// - "pro" plan: 1600 messages per month
// - "max" plan: 8000 messages per month
const PLAN_ALLOWANCES: Record<string, number> = {
  free: 0,
  plus: 400,
  pro: 1600,
  max: 8000,
};

// Maps Dodo product IDs to internal plan types (monthly plans only)
// TODO: Replace placeholder product IDs with actual IDs from Dodo dashboard
const PLAN_PRODUCT_IDS: Record<string, string> = {
  plus_monthly: 'pdt_0NWpWdXK777ZVmVKjUc4J',
  pro_monthly: 'pdt_0NX2rc1Ua1xjdVKhj3oXW',
  max_monthly: 'pdt_max_monthly_product_id',
};

// Helper function to map Dodo product ID to internal plan type
function getPlanTypeFromProductId(productId: string): string | null {
  const reverseMap: Record<string, string> = {
    [PLAN_PRODUCT_IDS.plus_monthly]: 'plus',
    [PLAN_PRODUCT_IDS.pro_monthly]: 'pro',
    [PLAN_PRODUCT_IDS.max_monthly]: 'max',
  };
  return reverseMap[productId] || null;
}

// Shared helper to upsert subscription and allowance
async function upsertSubscriptionAndAllowance(
  supabase: SupabaseClient,
  clerkUserId: string,
  productId: string,
  subscriptionId: string,
  dodoEventTimestamp: string,
  data: {
    created_at: string;
    next_billing_date: string;
    payment_frequency_interval?: string;
    trial_period_days?: number;
    recurring_pre_tax_amount: number;
    currency: string;
    cancel_at_next_billing_date?: boolean;
    customer?: { customer_id?: string };
  }
) {
  const planType = getPlanTypeFromProductId(productId);
  if (!planType) {
    throw new Error(`Unknown product_id: ${productId}. Not mapped to a plan.`);
  }

  // Helper function to add days to a date (handles month/year rollovers automatically)
  function addDays(date: string, days: number): string {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
  }

  const subscriptionData = {
    clerk_user_id: clerkUserId,
    dodo_subscription_id: subscriptionId,
    status: 'active',
    plan_type: planType,
    billing_period: data.payment_frequency_interval?.toLowerCase(),
    current_period_start: data.created_at,
    current_period_end: data.next_billing_date,
    trial_start: data.trial_period_days && data.trial_period_days > 0 ? data.created_at : null,
    trial_end: data.trial_period_days && data.trial_period_days > 0
      ? addDays(data.created_at, data.trial_period_days)
      : null,
    payment_status: 'paid',
    amount: data.recurring_pre_tax_amount,
    currency: data.currency,
    dodo_customer_id: data.customer?.customer_id,
    metadata: {
      product_id: productId,
      cancel_at_next_billing_date: data.cancel_at_next_billing_date,
      provider_updated_at: dodoEventTimestamp,
    },
  };

  const { error: subError } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'dodo_subscription_id' });

  if (subError) {
    throw new Error(`Failed to upsert subscription: ${subError.message}`);
  }

  // Update/create periodic allowance
  const allowance = PLAN_ALLOWANCES[planType];
  const allowanceData = {
    clerk_user_id: clerkUserId,
    alloted_allowance: allowance,
    remaining_allowance: allowance, // Full reset on plan change
    period_start: data.created_at,
    period_end: data.next_billing_date,
    last_reset_at: new Date().toISOString(),
  };

  const { error: allowanceError } = await supabase
    .from('periodic_allowance')
    .upsert(allowanceData, { onConflict: 'clerk_user_id' });

  if (allowanceError) {
    throw new Error(`Failed to upsert allowance: ${allowanceError.message}`);
  }

  return { planType, allowance };
}

// =============================================================================
// MAIN WEBHOOK HANDLER
// =============================================================================

/**
 * POST /api/webhooks/dodo
 * 
 * This is the entry point for all Dodo payment webhooks.
 * Dodo will call this endpoint whenever a subscription event occurs.
 * 
 * Expected Headers from Dodo:
 * - webhook-id: Unique identifier for this webhook
 * - webhook-signature: Cryptographic signature to verify authenticity
 * - webhook-timestamp: When the webhook was sent (for replay protection)
 * 
 * Expected JSON Body:
 * {
 *   "id": "evt_123",           // Unique event ID
 *   "type": "subscription.active",  // The type of event
 *   "data": { ... }            // Event-specific data
 * }
 * 
 * @param request - The incoming HTTP request from Dodo
 * @returns A JSON response indicating success or failure
 */
export async function POST(request: NextRequest) {
  // ===========================================================================
  // STEP 1: SECURITY CHECK - Verify webhook signature
  // ===========================================================================
  // This is CRITICAL for security. Without this check, anyone could send
  // fake webhooks to your server and modify user subscriptions!
  // 
  // The webhook signature is a cryptographic hash that only Dodo can create
  // using the shared webhook secret. If the signature doesn't match,
  // we reject the request immediately.
  // ===========================================================================

  // Check if the webhook secret is configured (fail-safe for development)
  if (!DODO_WEBHOOK_SECRET) {
    console.error("DODO_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Extract the signature headers from Dodo's request
  // These headers are added by Dodo to authenticate the webhook
  const webhookId = request.headers.get("webhook-id");
  const webhookSignature = request.headers.get("webhook-signature");
  const webhookTimestamp = request.headers.get("webhook-timestamp");

  // Validate that all required headers are present
  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  // Get the raw request body as text
  // We need the exact raw text to verify the signature
  const rawBody = await request.text();

  try {
    // Create a webhook verifier using the standardwebhooks library
    const webhook = new Webhook(DODO_WEBHOOK_SECRET);

    // Verify the signature against the raw body and headers
    // This will throw an error if the signature is invalid
    await webhook.verify(rawBody, {
      "webhook-id": webhookId,
      "webhook-signature": webhookSignature,
      "webhook-timestamp": webhookTimestamp,
    });
  } catch (error) {
    // Signature verification failed - could be a fake webhook or tampered data
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ===========================================================================
  // STEP 2: PARSE PAYLOAD & EXTRACT EVENT INFO
  // ===========================================================================
  // Now that we've verified the webhook is authentic, parse the JSON body
  // The payload contains information about what happened at Dodo
  // ===========================================================================

  const payload = JSON.parse(rawBody);
  const eventType = payload.type;  // e.g., "subscription.active", "payment.success"

  // Initialize the Supabase admin client
  // Admin client bypasses RLS (Row Level Security) for server-side operations
  const supabase = getSupabaseAdminClient();

  // ===========================================================================
  // STEP 3: IDEMPOTENCY CHECK - Prevent duplicate processing
  // ===========================================================================
  // Webhooks might be sent multiple times due to network issues or retries.
  // We check if we've already processed this specific webhook delivery before.
  //
  // IMPORTANT: Dodo does NOT include event ID in the payload body.
  // The unique identifier for idempotency is the webhook-id HEADER.
  //
  // The webhook_event_log table tracks:
  // - provider: Which provider (Dodo in this case)
  // - provider_event_id: The unique webhook-id from the HEADER
  // - processed: Whether we've already handled this event
  // ===========================================================================

  const { data: existingWebhook } = await supabase
    .from("webhook_event_log")
    .select("id, processed")
    .eq("provider_event_id", webhookId)
    .eq("provider", "dodo")
    .single();

  // If we've already processed this webhook, just acknowledge it without doing anything
  // This is the "idempotent" behavior - processing the same event twice has no extra effect
  if (existingWebhook?.processed) {
    console.log(`Webhook ${webhookId} already processed, skipping`);
    return NextResponse.json({ received: true, status: "already_processed" }, { status: 200 });
  }

  // ===========================================================================
  // STEP 4: LOG THE INCOMING WEBHOOK
  // ===========================================================================
  // Before processing, we always log the webhook to the database.
  // This creates an audit trail for debugging and support.
  // Even if processing fails, we want to record that we received it.
  // ===========================================================================

  const { data: logEntry, error: logError } = await supabase
    .from("webhook_event_log")
    .insert({
      provider: "dodo",                           // Dodo payment provider
      event_type: eventType,                      // What type of event
      provider_event_id: webhookId,               // Dodo's unique webhook ID from header
      payload: payload,                           // Full payload for debugging
      processed: false,                           // Not processed yet
      received_at: new Date().toISOString(),      // When we received it
    })
    .select()
    .single();

  // If we can't even log the webhook, something is seriously wrong
  if (logError) {
    console.error("Failed to log webhook:", logError);
    return NextResponse.json({ error: "Logging failed" }, { status: 500 });
  }

  try {
    // This object tracks what actions we took during processing
    // It's stored in the log for debugging purposes
    let processingDetails: Record<string, unknown> = {};

    // ===========================================================================
    // STEP 5: PROCESS THE SPECIFIC EVENT TYPE
    // ===========================================================================
    // Now we handle the actual business logic based on what type of event occurred.
    // Each case handles a different scenario in the subscription lifecycle.
    // ===========================================================================

    switch (eventType) {

      case "subscription.active": {
        const data = payload.data;
        const dodoEventTimestamp = payload.timestamp;

        // Extract clerk_user_id from customer metadata
        const clerkUserId = data.customer?.metadata?.clerk_user_id;
        const productId = data.product_id;
        const subscriptionId = data.subscription_id;

        // Validate required fields
        if (!clerkUserId) {
          throw new Error('Missing clerk_user_id in customer metadata');
        }

        // DUPLICATE CHECK: Compare with stored provider_updated_at
        const { shouldProcess } = await shouldProcessDodoEvent(
          supabase,
          subscriptionId,
          dodoEventTimestamp
        );

        if (!shouldProcess) {
          console.log(`Skipping duplicate event ${eventType} for sub ${subscriptionId} (timestamp ${dodoEventTimestamp})`);
          return NextResponse.json({ received: true, status: "skipped_duplicate" }, { status: 200 });
        }

        const { planType, allowance } = await upsertSubscriptionAndAllowance(
          supabase,
          clerkUserId,
          productId,
          subscriptionId,
          dodoEventTimestamp,
          {
            created_at: data.created_at,
            next_billing_date: data.next_billing_date,
            payment_frequency_interval: data.payment_frequency_interval,
            trial_period_days: data.trial_period_days,
            recurring_pre_tax_amount: data.recurring_pre_tax_amount,
            currency: data.currency,
            cancel_at_next_billing_date: data.cancel_at_next_billing_date,
            customer: data.customer,
          }
        );

        processingDetails = {
          action: 'subscription_activated',
          clerk_user_id: clerkUserId,
          plan_type: planType,
          subscription_id: subscriptionId,
          allowance: allowance,
        };
        break;
      }

      case "subscription.renewed": {
        const data = payload.data;
        const dodoEventTimestamp = payload.timestamp;

        // Extract clerk_user_id from customer metadata
        const clerkUserId = data.customer?.metadata?.clerk_user_id;
        const productId = data.product_id;
        const subscriptionId = data.subscription_id;

        if (!clerkUserId) {
          throw new Error('Missing clerk_user_id in customer metadata');
        }

        // DUPLICATE CHECK: Compare with stored provider_updated_at
        const { shouldProcess } = await shouldProcessDodoEvent(
          supabase,
          subscriptionId,
          dodoEventTimestamp
        );

        if (!shouldProcess) {
          console.log(`Skipping duplicate event ${eventType} for sub ${subscriptionId} (timestamp ${dodoEventTimestamp})`);
          return NextResponse.json({ received: true, status: "skipped_duplicate" }, { status: 200 });
        }

        const { planType, allowance } = await upsertSubscriptionAndAllowance(
          supabase,
          clerkUserId,
          productId,
          subscriptionId,
          dodoEventTimestamp,
          {
            created_at: data.created_at,
            next_billing_date: data.next_billing_date,
            payment_frequency_interval: data.payment_frequency_interval,
            trial_period_days: data.trial_period_days,
            recurring_pre_tax_amount: data.recurring_pre_tax_amount,
            currency: data.currency,
            cancel_at_next_billing_date: data.cancel_at_next_billing_date,
            customer: data.customer,
          }
        );

        processingDetails = {
          action: 'subscription_renewed',
          clerk_user_id: clerkUserId,
          subscription_id: subscriptionId,
          previous_billing_date: data.previous_billing_date,
          plan_type: planType,
          allowance: allowance,
        };
        break;
      }

      case "subscription.plan_changed": {
        const data = payload.data;
        const dodoEventTimestamp = payload.timestamp;

        // Extract clerk_user_id from customer metadata
        const clerkUserId = data.customer?.metadata?.clerk_user_id;
        const productId = data.product_id;
        const subscriptionId = data.subscription_id;

        // Validate required fields
        if (!clerkUserId) {
          throw new Error('Missing clerk_user_id in customer metadata');
        }

        // DUPLICATE CHECK: Compare with stored provider_updated_at
        const { shouldProcess } = await shouldProcessDodoEvent(
          supabase,
          subscriptionId,
          dodoEventTimestamp
        );

        if (!shouldProcess) {
          console.log(`Skipping duplicate event ${eventType} for sub ${subscriptionId} (timestamp ${dodoEventTimestamp})`);
          return NextResponse.json({ received: true, status: "skipped_duplicate" }, { status: 200 });
        }

        const { planType, allowance } = await upsertSubscriptionAndAllowance(
          supabase,
          clerkUserId,
          productId,
          subscriptionId,
          dodoEventTimestamp,
          {
            created_at: data.created_at,
            next_billing_date: data.next_billing_date,
            payment_frequency_interval: data.payment_frequency_interval,
            trial_period_days: data.trial_period_days,
            recurring_pre_tax_amount: data.recurring_pre_tax_amount,
            currency: data.currency,
            cancel_at_next_billing_date: data.cancel_at_next_billing_date,
            customer: data.customer,
          }
        );

        processingDetails = {
          action: 'subscription_plan_changed',
          clerk_user_id: clerkUserId,
          plan_type: planType,
          subscription_id: subscriptionId,
          allowance: allowance,
        };
        break;
      }

      case "subscription.cancelled": {
        const data = payload.data;
        const dodoEventTimestamp = payload.timestamp;

        // Extract required fields
        const clerkUserId = data.customer?.metadata?.clerk_user_id;
        const subscriptionId = data.subscription_id;
        const cancelledAt = data.cancelled_at;

        if (!clerkUserId) {
          throw new Error('Missing clerk_user_id in customer metadata');
        }

        // DUPLICATE CHECK: Compare with stored provider_updated_at
        const { shouldProcess } = await shouldProcessDodoEvent(
          supabase,
          subscriptionId,
          dodoEventTimestamp
        );

        if (!shouldProcess) {
          console.log(`Skipping duplicate event ${eventType} for sub ${subscriptionId} (timestamp ${dodoEventTimestamp})`);
          return NextResponse.json({ received: true, status: "skipped_duplicate" }, { status: 200 });
        }

        // Update subscription status to cancelled
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            canceled_at: cancelledAt,
          })
          .eq('dodo_subscription_id', subscriptionId);

        if (subError) {
          throw new Error(`Failed to cancel subscription: ${subError.message}`);
        }

        // Immediately revoke access - set allowance to 0
        const { error: allowanceError } = await supabase
          .from('periodic_allowance')
          .update({
            alloted_allowance: 0,
            remaining_allowance: 0,
          })
          .eq('clerk_user_id', clerkUserId);

        if (allowanceError) {
          throw new Error(`Failed to reset allowance: ${allowanceError.message}`);
        }

        processingDetails = {
          action: 'subscription_cancelled',
          clerk_user_id: clerkUserId,
          subscription_id: subscriptionId,
          cancelled_at: cancelledAt,
        };
        break;
      }

      // Which events are NOT implemented to handle yet...
      // TODO: These should be added later with same deduplication (timestamp based) pattern, as used above, when needed.

      case "subscription.on_hold": {
        // Fired when a subscription is temporarily put on hold due to failed renewal.
        // Handle on_hold here.
        break;
      }

      case "subscription.updated": {
        // Fired when any field of a subscription is updated. It's kinda universal event to subscription.
        // Handle updated here.
        break;
      }

      // =======================================================================
      // DEFAULT: Unhandled event types
      // =======================================================================
      // If Dodo send event types we don't know or we don't handle, we log but don't error, cause we don't need all the event types
      default:
        console.log(`Unhandled event type: ${eventType}`);
        processingDetails = { action: "unhandled" };
    }

    // ===========================================================================
    // STEP 6: MARK WEBHOOK AS PROCESSED
    // ===========================================================================
    // Update the log entry to show we've successfully processed this webhook
    // This ensures idempotency on future webhook deliveries
    // ===========================================================================

    await supabase
      .from("webhook_event_log")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        http_status: 200,
        processing_details: processingDetails,
      })
      .eq("id", logEntry.id);

    // Return 200 OK to Dodo to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    // ===========================================================================
    // STEP 7: ERROR HANDLING
    // ===========================================================================
    // If anything goes wrong during processing, we:
    // 1. Log the error in the webhook_event_log
    // 2. Log to console for immediate visibility
    // 3. Return 500 to Dodo (they may retry the webhook)
    // ===========================================================================

    await supabase
      .from("webhook_event_log")
      .update({
        processed: false,
        http_status: 500,
        processing_details: {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
      })
      .eq("id", logEntry.id);

    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
