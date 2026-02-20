/**
 * Subscription Data Interface
 * Represents the subscription information needed on the client side
 */
export interface SubscriptionData {
  /** Internal plan identifier (e.g., "free", "plus", "pro", "max") */
  planType: string;
  /** Subscription status: active, cancelled, trialing, past_due, etc. */
  status: string;
  /** Start of current billing period (ISO 8601 timestamp) */
  currentPeriodStart: string | null;
  /** End of current billing period (ISO 8601 timestamp) */
  currentPeriodEnd: string | null;
  /** Whether subscription will cancel at period end */
  cancelAtPeriodEnd: boolean;
  /** Trial start date (if on trial) */
  trialStart: string | null;
  /** Trial end date (if on trial) */
  trialEnd: string | null;
  /** Subscription price in smallest currency unit (cents) */
  amount: number;
  /** Currency code (USD, EUR, etc.) */
  currency: string;
  /** Billing cycle: monthly, yearly, etc. */
  billingCycle: string;
  /** DODO subscription ID (for support/reference) */
  subscriptionId: string | null;
}
