import { getSupabaseAdminClient } from '@/lib/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getModelPricing, type ModelPricing } from './pricing';
import { calculateCostCents } from './calculations';
import type { TotalUsage } from '@/lib/conversation-history/types';

/**
 * Data needed to log a message's token usage
 */
export interface TokenUsageLogParams {
  messageId: string;
  tokenUsage: TotalUsage;
  modelInfo: {
    provider: string;
    UIModelId: string;
    internalModelId: string;
  };
  totalCostCents: number;
  pricingUsed: ModelPricing;
}

/**
 * Logs token usage for a completed assistant message to the database.
 * This is a best-effort operation - failures are logged but do not throw.
 *
 * @param params - The token usage data to log
 */
export async function logMessageTokenUsage(params: TokenUsageLogParams): Promise<void> {
  try {
    const supabase: SupabaseClient = getSupabaseAdminClient();

    // Build the cost breakdown detail
    const estimatedCostDetail = {
      inputCostCents: Math.round((params.tokenUsage.totalInputTokens * params.pricingUsed.input) / 10000),
      outputCostCents: Math.round((params.tokenUsage.totalOutputTokens * params.pricingUsed.output) / 10000),
      totalCostCents: params.totalCostCents,
      pricingPerMillion: params.pricingUsed,
    };

    // Build the token usage object (AI SDK v6 structure)
    const tokenUsageObj = {
      totalTokens: params.tokenUsage.totalUsedTokens,
      inputTokens: params.tokenUsage.totalInputTokens,
      outputTokens: params.tokenUsage.totalOutputTokens,
      // v6 detailed breakdowns (optional, will be omitted if undefined)
      inputTokenDetails: params.tokenUsage.inputTokenDetails,
      outputTokenDetails: params.tokenUsage.outputTokenDetails,
    };

    // Build model info
    const modelInfoObj = {
      provider: params.modelInfo.provider,
      UIModelId: params.modelInfo.UIModelId,
      internalModelId: params.modelInfo.internalModelId,
    };

    const { error } = await supabase
      .from('message_token_usage_log')
      .insert({
        message_id: params.messageId,
        token_usage: tokenUsageObj,
        model_info: modelInfoObj,
        estimated_cost_detail: estimatedCostDetail,
        estimated_total_cost: params.totalCostCents,
      });

    if (error) {
      console.error('Failed to insert token usage log:', error);
    }
  } catch (err) {
    console.error('Unexpected error logging token usage:', err);
  }
}
