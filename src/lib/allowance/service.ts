import { getSupabaseAdminClient } from '@/lib/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

const getSupabase = (): SupabaseClient => {
  return getSupabaseAdminClient();
};

/**
 * Retrieves the remaining allowance (in cents) for a user.
 * Implements a 6-hour sliding window based on period_start and period_end.
 * If window expired, automatically resets allowance to full and starts a new window.
 * Returns 0 if the user has no allowance record.
 * Throws on database errors.
 */
export async function getRemainingAllowance(clerkUserId: string): Promise<number> {
  const supabase = getSupabase();

  // Fetch allowance row
  const { data, error } = await supabase
    .from('periodic_allowance')
    .select('remaining_allowance, alloted_allowance, period_start, period_end')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    // If the row doesn't exist, treat as 0
    if (error.code === 'PGRST116') {
      return 0;
    }
    throw error;
  }

  const remaining = data?.remaining_allowance ?? 0;
  const allotted = data?.alloted_allowance ?? 0;
  const periodEnd = data?.period_end ? new Date(data.period_end) : null;

  // #region Race condition fix note
  // """CRITICAL: Race condition in allowance window reset

  // Confidence: 95%

  // Problem: The getRemainingAllowance() function has a time-of-check-to-time-of-use (TOCTOU) race condition. Between reading the allowance data (line 19-23) and performing the reset update (line 44-54), another concurrent request could:

  // Also read the same expired window
  // Both requests attempt to reset the window
  // The second update could overwrite the first, potentially causing:
  // Double reset of allowance
  // Lost period_start/period_end timestamps
  // Inconsistent last_reset_at values
  // This is particularly problematic because getRemainingAllowance() is called before deductAllowance() in the chat flow, meaning every chat message could trigger this race.

  // Suggestion: Use an atomic database operation similar to the existing deduct_allowance PostgreSQL function. Create a new database function:

  // CREATE OR REPLACE FUNCTION get_or_reset_allowance(
  //   p_clerk_user_id TEXT
  // )
  // RETURNS TABLE(remaining INTEGER, allotted INTEGER, period_end TIMESTAMPTZ) AS $$
  // BEGIN
  //   -- First, try to update if expired (atomic)
  //   UPDATE periodic_allowance
  //   SET 
  //     remaining_allowance = alloted_allowance,
  //     period_start = NOW(),
  //     period_end = NOW() + INTERVAL '6 hours',
  //     last_reset_at = NOW()
  //   WHERE clerk_user_id = p_clerk_user_id
  //     AND alloted_allowance > 0
  //     AND period_end < NOW()
  //   RETURNING remaining_allowance, alloted_allowance, periodic_allowance.period_end;

  //   -- If no update happened, return current values
  //   IF NOT FOUND THEN
  //     RETURN QUERY
  //     SELECT remaining_allowance, alloted_allowance, periodic_allowance.period_end
  //     FROM periodic_allowance
  //     WHERE clerk_user_id = p_clerk_user_id;
  //   END IF;
  // END;
  // $$ LANGUAGE plpgsql;
  // """
  // - AI CI Reviewer
  //
  // Our note, right now we are still in dev stage. So we have time to solve it later. It's just a marker comment.
  //
  // TODO P3: Solve it.
  //
  // #endregion

  // If period_end is in the past (expired window or never-started window), reset now
  if (allotted > 0 && periodEnd && new Date() > periodEnd) {
    const resetTime = new Date();
    const resetTimeISO = resetTime.toISOString();
    const newPeriodEnd = new Date(resetTime);
    newPeriodEnd.setHours(newPeriodEnd.getHours() + 6);

    const { data: updateData } = await supabase
      .from('periodic_allowance')
      .update({
        remaining_allowance: allotted,
        period_start: resetTimeISO,
        period_end: newPeriodEnd.toISOString(),
        last_reset_at: resetTimeISO,
      })
      .eq('clerk_user_id', clerkUserId)
      .select('remaining_allowance')
      .single();

    return updateData?.remaining_allowance ?? allotted;
  }

  // Window is active (or no allotted allowance): return current remaining
  return remaining;
}

/**
 * Atomically deducts the specified amount of cents from the user's remaining allowance.
 * Uses a Postgres row-level lock via UPDATE to ensure safe concurrent modifications.
 * The allowance is clamped to a minimum of 0 (no negative balances).
 *
 * @param clerkUserId - The user's Clerk ID
 * @param costCents - The amount to deduct (must be >= 0)
 * @returns The new remaining allowance after deduction
 * @throws If the database update fails
 */
export async function deductAllowance(clerkUserId: string, costCents: number): Promise<number> {
  if (costCents <= 0) {
    // No deduction needed; just return current
    return getRemainingAllowance(clerkUserId);
  }

  const supabase = getSupabase();

  // Use RPC to call the database function for atomic deduction
  const { data, error } = await supabase.rpc('deduct_allowance', {
    p_clerk_user_id: clerkUserId,
    p_cost_cents: costCents,
  });

  if (error) {
    throw error;
  }

  // If no row was updated (e.g., user has no allowance record), return 0.
  // The function returns NULL when no matching row exists.
  return data ?? 0;
}
