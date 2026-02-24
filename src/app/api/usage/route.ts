import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();

    // Fetch allowance data for the user
    const { data: allowance, error: allowanceError } = await supabase
      .from('periodic_allowance')
      .select('period_start, period_end, alloted_allowance, remaining_allowance')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (allowanceError && allowanceError.code !== 'PGRST116') {
      throw allowanceError;
    }

    // Calculate effective remaining percentage (accounts for sliding window expiration)
    const alloted = allowance?.alloted_allowance ?? 0;
    const remaining = allowance?.remaining_allowance ?? 0;
    const periodEnd = allowance?.period_end ? new Date(allowance.period_end) : null;

    // Determine effective remaining: if window expired (past period_end), user effectively has full allowance
    let effectiveRemaining = remaining;
    if (alloted > 0 && periodEnd && new Date() > periodEnd) {
      effectiveRemaining = alloted; // Expired window = full allowance
    }

    const remainingPercentage = alloted > 0
      ? Math.round((effectiveRemaining / alloted) * 100)
      : 0;

    return NextResponse.json({
      periodStart: allowance?.period_start ?? null,
      periodEnd: allowance?.period_end ?? null,
      remainingPercentage: Math.max(0, remainingPercentage), // Ensure non-negative
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
