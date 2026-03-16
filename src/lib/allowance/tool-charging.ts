import { deductAllowance } from './service';
import { getSupabaseAdminClient } from '@/lib/supabase-client';

export interface ToolChargeAndLogParams {
  toolName: string;
  args: any;
  result: any;
  cost: number;
  clerkUserId: string;
  messageId?: string;
  metadata?: Record<string, any>;
}

/**
 * Deducts the cost from the user's allowance and logs the tool usage.
 * Best-effort: errors are logged but not thrown to avoid breaking tool execution.
 *
 * This is the single source of truth for charging logic - use this everywhere
 * instead of inlining deduction + logging code.
 */
export async function chargeAndLogToolAllowance({
  toolName,
  args,
  result,
  cost,
  clerkUserId,
  messageId,
  metadata,
}: ToolChargeAndLogParams): Promise<void> {
  if (cost <= 0) return;

  // Deduct allowance (atomic)
  try {
    await deductAllowance(clerkUserId, cost);
  } catch (err) {
    console.error(`Failed to deduct allowance for tool ${toolName}:`, err);
    // Continue to log usage even if deduction fails
  }

  // Log to tool_usage_log (best-effort)
  try {
    const supabase = getSupabaseAdminClient();

    await supabase
      .from('tool_usage_log')
      .insert({
        clerk_user_id: clerkUserId,
        message_id: messageId || null,
        tool_name: toolName,
        args: args,
        result: result,
        estimated_cost_cents: cost,
        metadata: metadata || {},
      });
  } catch (logErr) {
    console.error('Failed to log tool usage:', logErr);
    // Do not throw
  }
}
