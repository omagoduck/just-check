/**
 * Subscription-related constants and utilities
 * Includes product IDs, DODO integration, and display name mappings
 */

// ============ Product IDs ============
export const PRODUCT_IDS = {
  GO_MONTHLY: 'go_monthly',
  PLUS_MONTHLY: 'plus_monthly',
  PRO_MONTHLY: 'pro_monthly',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

export const DODO_PRODUCT_IDS: Record<ProductId, string> = {
  [PRODUCT_IDS.GO_MONTHLY]: 'pdt_0NaLUT3efOeN5ZFe8uOEy',
  [PRODUCT_IDS.PLUS_MONTHLY]: 'pdt_0NaLUXSIIoUb7EVgGTGKd',
  [PRODUCT_IDS.PRO_MONTHLY]: 'pdt_0NaPF2KF5ViAIUsoZDhWk',
};

export function getDodoProductId(productId: string): string | null {
  if (productId in DODO_PRODUCT_IDS) {
    return DODO_PRODUCT_IDS[productId as ProductId];
  }
  return null;
}

// ============ Display Name Utilities ============
/**
 * Mapping from internal plan IDs to user-friendly display names
 */
export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free_monthly: 'Free',
  go_monthly: 'Go',
  plus_monthly: 'Plus',
  pro_monthly: 'Pro',
};

/**
 * Get the user-friendly display name for a subscription plan ID
 * @param planId - The internal plan ID (e.g., 'go_monthly')
 * @returns The display name (e.g., 'Go')
 */
export function getPlanDisplayName(planId: string): string {
  return PLAN_DISPLAY_NAMES[planId] || planId.replace(/_/g, ' ');
}
