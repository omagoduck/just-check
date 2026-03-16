export interface ModelPricing {
  input: number;
  output: number;
}

/**
 * Calculates the cost of an AI completion with sub-cent precision.
 *
 * Pricing is given per 1M tokens (USD). We convert to a decimal cost value.
 * Formula:
 *   cost_usd = (inputTokens / 1,000,000) * inputPrice + (outputTokens / 1,000,000) * outputPrice
 *   cost = cost_usd * 100 = (inputTokens * inputPrice + outputTokens * outputPrice) / 10,000
 *
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param pricing - The model's pricing per 1M tokens (USD)
 * @returns Cost with sub-cent precision (no rounding)
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricing
): number {
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 10000;
}
