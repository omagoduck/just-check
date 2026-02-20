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

    // Calculate remaining percentage
    const alloted = allowance?.alloted_allowance ?? 0;
    const remaining = allowance?.remaining_allowance ?? 0;
    const remainingPercentage = alloted > 0
      ? Math.round((remaining / alloted) * 100)
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
