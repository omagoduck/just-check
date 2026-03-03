export const PRODUCT_IDS = {
  PLUS_MONTHLY: 'plus_monthly',
  PRO_MONTHLY: 'pro_monthly',
  MAX_MONTHLY: 'max_monthly',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

export const DODO_PRODUCT_IDS: Record<ProductId, string> = {
  [PRODUCT_IDS.PLUS_MONTHLY]: 'pdt_0NWpWdXK777ZVmVKjUc4J',
  [PRODUCT_IDS.PRO_MONTHLY]: 'pdt_0NX2rc1Ua1xjdVKhj3oXW',
  [PRODUCT_IDS.MAX_MONTHLY]: 'pdt_MAX_MONTHLY_DODO_ID',
};

export function getDodoProductId(productId: string): string | null {
  if (productId in DODO_PRODUCT_IDS) {
    return DODO_PRODUCT_IDS[productId as ProductId];
  }
  return null;
}
