'use client';

import { useUsage } from './use-usage';
import { useSubscription } from './use-subscription';

interface SubscriptionAndAllowanceStatus {
  /** Whether user is on the free plan */
  isFreeUser: boolean;
  /** Whether user has remaining allowance */
  hasAllowance: boolean;
  /** Percentage of allowance remaining (0-100+) */
  remainingPercentage: number;
  /** When the current daily allowance window ends (ISO string) */
  periodEnd: string | null;
  /** Whether allowance data is still loading */
  isLoading: boolean;
  /** The user's plan ID */
  planId: string;
}

export function useSubscriptionAndAllowanceStatus(): SubscriptionAndAllowanceStatus {
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();

  const isLoading = usageLoading || subscriptionLoading;
  const planId = subscription?.planId ?? 'free_monthly';
  const isFreeUser = planId === 'free_monthly';
  const remainingPercentage = usage?.remainingPercentage ?? 0;
  const periodEnd = usage?.periodEnd ?? null;

  // Free users never have allowance (PLAN_ALLOWANCES['free_monthly'] = 0).
  // Paid users are gated by the raw allowance value.
  const hasAllowance = !isFreeUser && usage?.hasAllowance === true;

  return {
    isFreeUser,
    hasAllowance,
    remainingPercentage,
    periodEnd,
    isLoading,
    planId,
  };
}
