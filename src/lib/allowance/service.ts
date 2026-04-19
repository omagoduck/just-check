import { getSupabaseAdminClient } from '@/lib/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

const getSupabase = (): SupabaseClient => {
  return getSupabaseAdminClient();
};

export interface AllowanceStatus {
  periodStart: string | null;
  periodEnd: string | null;
  remainingAllowance: number;
  allotedAllowance: number;
  remainingPercentage: number;
}

export function getCurrentUtcDailyAllowanceWindow(now = new Date()) {
  const periodStart = new Date(now);
  periodStart.setUTCHours(0, 0, 0, 0);

  const periodEnd = new Date(periodStart);
  periodEnd.setUTCDate(periodEnd.getUTCDate() + 1);

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  };
}

async function getAllowanceStatusFromDatabase(clerkUserId: string): Promise<AllowanceStatus> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('periodic_allowance')
    .select('remaining_allowance, alloted_allowance, period_start, period_end')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        periodStart: null,
        periodEnd: null,
        remainingAllowance: 0,
        allotedAllowance: 0,
        remainingPercentage: 0,
      };
    }
    throw error;
  }

  const remaining = Number(data?.remaining_allowance ?? 0);
  const allotted = Number(data?.alloted_allowance ?? 0);
  const periodEnd = data?.period_end ? new Date(data.period_end) : null;

  if (allotted > 0 && periodEnd && new Date() > periodEnd) {
    const resetTime = new Date().toISOString();
    const { periodStart, periodEnd } = getCurrentUtcDailyAllowanceWindow();

    const { data: updateData, error: updateError } = await supabase
      .from('periodic_allowance')
      .update({
        remaining_allowance: allotted,
        period_start: periodStart,
        period_end: periodEnd,
        last_reset_at: resetTime,
      })
      .eq('clerk_user_id', clerkUserId)
      .select('remaining_allowance, alloted_allowance, period_start, period_end')
      .single();

    if (updateError) {
      throw updateError;
    }

    const updatedRemaining = Number(updateData?.remaining_allowance ?? allotted);
    const updatedAllotted = Number(updateData?.alloted_allowance ?? allotted);

    return {
      periodStart: updateData?.period_start ?? periodStart,
      periodEnd: updateData?.period_end ?? periodEnd,
      remainingAllowance: updatedRemaining,
      allotedAllowance: updatedAllotted,
      remainingPercentage: updatedAllotted > 0
        ? Math.max(0, Math.round((updatedRemaining / updatedAllotted) * 100))
        : 0,
    };
  }

  return {
    periodStart: data?.period_start ?? null,
    periodEnd: data?.period_end ?? null,
    remainingAllowance: remaining,
    allotedAllowance: allotted,
    remainingPercentage: allotted > 0
      ? Math.max(0, Math.round((remaining / allotted) * 100))
      : 0,
  };
}

/**
 * Retrieves the remaining allowance (in cents) for a user.
 * Implements a daily UTC allowance window based on period_start and period_end.
 * If the daily window expired, automatically resets allowance to full for the current UTC day.
 * Returns 0 if the user has no allowance record.
 * Throws on database errors.
 */
export async function getRemainingAllowance(clerkUserId: string): Promise<number> {
  const status = await getAllowanceStatusFromDatabase(clerkUserId);
  return status.remainingAllowance;
}

export async function getAllowanceStatus(clerkUserId: string): Promise<AllowanceStatus> {
  return getAllowanceStatusFromDatabase(clerkUserId);
}

/**
 * Atomically deducts the specified cost from the user's remaining allowance.
 * Uses a Postgres row-level lock via UPDATE to ensure safe concurrent modifications.
 * The allowance is clamped to a minimum of 0 (no negative balances).
 *
 * @param clerkUserId - The user's Clerk ID
 * @param cost - The amount to deduct (must be >= 0), with sub-cent precision
 * @returns The new remaining allowance after deduction
 * @throws If the database update fails
 */
export async function deductAllowance(clerkUserId: string, cost: number): Promise<number> {
  if (cost <= 0) {
    // No deduction needed; just return current
    return getRemainingAllowance(clerkUserId);
  }

  await getRemainingAllowance(clerkUserId);

  const supabase = getSupabase();

  // Use RPC to call the database function for atomic deduction
  const { data, error } = await supabase.rpc('deduct_allowance', {
    p_clerk_user_id: clerkUserId,
    p_cost: cost,
  });

  if (error) {
    throw error;
  }

  // If no row was updated (e.g., user has no allowance record), return 0.
  // The function returns NULL when no matching row exists.
  return data ?? 0;
}
