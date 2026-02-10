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
    modelID: string;
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

    // Build the token usage object (include only fields that are relevant)
    const tokenUsageObj = {
      totalTokens: params.tokenUsage.totalUsedTokens,
      inputTokens: params.tokenUsage.totalInputTokens,
      outputTokens: params.tokenUsage.totalOutputTokens,
      reasoningTokens: params.tokenUsage.totalReasoningTokens,
      cachedInputTokens: params.tokenUsage.totalCachedInputTokens,
    };

    // Build model info
    const modelInfoObj = {
      provider: params.modelInfo.provider,
      modelID: params.modelInfo.modelID,
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
