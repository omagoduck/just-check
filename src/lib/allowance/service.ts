import { getSupabaseAdminClient } from '@/lib/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

const getSupabase = (): SupabaseClient => {
  return getSupabaseAdminClient();
};

/**
 * Retrieves the remaining allowance (in cents) for a user.
 * Returns 0 if the user has no allowance record.
 * Throws on database errors.
 */
export async function getRemainingAllowance(clerkUserId: string): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('periodic_allowance')
    .select('remaining_allowance')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    // If the row doesn't exist, treat as 0
    if (error.code === 'PGRST116') {
      return 0;
    }
    throw error;
  }

  return data?.remaining_allowance ?? 0;
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
