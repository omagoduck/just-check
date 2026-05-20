import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase-client.server';

let cachedResult: { value: boolean; expiresAt: number } | null = null;

const CACHE_TTL_MS = 30_000;

export async function isFreeTierEnabled(): Promise<boolean> {
  if (cachedResult && Date.now() < cachedResult.expiresAt) {
    return cachedResult.value;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'free_tier_enabled')
      .single();

    if (error || !data) {
      return false;
    }

    const enabled = Boolean((data.value as Record<string, unknown>)?.enabled);
    cachedResult = { value: enabled, expiresAt: Date.now() + CACHE_TTL_MS };
    return enabled;
  } catch {
    return false;
  }
}
