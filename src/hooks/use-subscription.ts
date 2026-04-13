import { useQuery } from '@tanstack/react-query';
import type { SubscriptionData } from '@/types/subscription';

async function fetchSubscription(): Promise<SubscriptionData> {
  const response = await fetch('/api/subscription');
  if (!response.ok) {
    throw new Error('Failed to fetch subscription data');
  }
  return response.json();
}

export function useSubscription(enabled: boolean = true) {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
