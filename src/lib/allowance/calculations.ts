export interface ModelPricing {
  input: number;
  output: number;
}

/**
 * Calculates the cost of an AI completion in cents.
 *
 * Pricing is given per 1M tokens (USD). We need to convert to cents.
 * Formula:
 *   cost_usd = (inputTokens / 1,000,000) * inputPrice + (outputTokens / 1,000,000) * outputPrice
 *   cost_cents = cost_usd * 100 = (inputTokens * inputPrice + outputTokens * outputPrice) / 10,000
 *
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param pricing - The model's pricing per 1M tokens (USD)
 * @returns Cost in cents, rounded to the nearest integer
 */
export function calculateCostCents(
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricing
): number {
  const rawCents = (inputTokens * pricing.input + outputTokens * pricing.output) / 10000;
  return Math.round(rawCents);
}
