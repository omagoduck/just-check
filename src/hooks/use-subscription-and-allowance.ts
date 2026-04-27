'use client';

import { useUsage } from './use-usage';
import { useSubscription } from './use-subscription';

interface SubscriptionAndAllowanceStatus {
  /** Whether user is on the free plan. `undefined` while loading. */
  isFreeUser: boolean | undefined;
  /** Whether user has remaining allowance. `undefined` while loading. */
  hasAllowance: boolean | undefined;
  /** Percentage of allowance remaining (0-100+) */
  remainingPercentage: number;
  /** When the current daily allowance window ends (ISO string) */
  periodEnd: string | null;
  /** Whether allowance data is still loading */
  isLoading: boolean;
  /** The user's plan ID. `undefined` while loading. */
  planId: string | undefined;
}

export function useSubscriptionAndAllowanceStatus(): SubscriptionAndAllowanceStatus {
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();

  const isLoading = usageLoading || subscriptionLoading;
  const planId = isLoading ? undefined : (subscription?.planId ?? 'free_monthly');
  const isFreeUser = isLoading ? undefined : planId === 'free_monthly';
  const remainingPercentage = usage?.remainingPercentage ?? 0;
  const periodEnd = usage?.periodEnd ?? null;

  const hasAllowance = isLoading ? undefined : (!isFreeUser && usage?.hasAllowance === true);

  return {
    isFreeUser,
    hasAllowance,
    remainingPercentage,
    periodEnd,
    isLoading,
    planId,
  };
}
