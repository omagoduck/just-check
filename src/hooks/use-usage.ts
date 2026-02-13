import { useQuery } from '@tanstack/react-query';

interface UsageData {
  plan: string;
  planType: string;
  periodStart: string | null;
  periodEnd: string | null;
  status: string;
  remainingPercentage: number;
}

async function fetchUsage(): Promise<UsageData> {
  const response = await fetch('/api/usage');
  if (!response.ok) {
    throw new Error('Failed to fetch usage data');
  }
  return response.json();
}

export function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: fetchUsage,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
