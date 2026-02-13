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

    // Fetch subscription and allowance data for the user
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('plan_type, current_period_start, current_period_end, status')
      .eq('clerk_user_id', clerkUserId)
      .single();

    // If no subscription exists, treat as free plan with 0 allowance
    if (subError && subError.code !== 'PGRST116') {
      throw subError;
    }

    const { data: allowance, error: allowanceError } = await supabase
      .from('periodic_allowance')
      .select('alloted_allowance, remaining_allowance')
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

    // Map plan type to display name
    const planType = subscription?.plan_type ?? 'free';
    const planDisplayName = planType.charAt(0).toUpperCase() + planType.slice(1);

    return NextResponse.json({
      plan: planDisplayName,
      planType,
      periodStart: subscription?.current_period_start ?? null,
      periodEnd: subscription?.current_period_end ?? null,
      status: subscription?.status ?? 'inactive',
      remainingPercentage: Math.max(0, remainingPercentage), // Ensure non-negative
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
