import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAllowanceStatus } from '@/lib/allowance';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowance = await getAllowanceStatus(clerkUserId);

    return NextResponse.json({
      periodStart: allowance.periodStart,
      periodEnd: allowance.periodEnd,
      hasAllowance: allowance.hasAllowance,
      remainingPercentage: allowance.remainingPercentage,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
