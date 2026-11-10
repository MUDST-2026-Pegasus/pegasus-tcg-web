/**
 * component กลางของการลดราคาโดยตรง (TCG-675) — ใช้ร่วมกันทั้ง Admin (SAL-06), Seller (SAL-07) และ Buyer (SAL-08)
 * ตาม Figma "SAL · Components"
 */

export { PriceTag } from "./PriceTag";
export { SaleBadge, type SaleBadgeType } from "./SaleBadge";
export { SaleProductCard, type SaleProductCardProps } from "./SaleProductCard";
export {
  countdownParts,
  discountBadgeLabel,
  effectivePrice,
  formatCountdown,
  formatSaleBaht,
  isFlash,
  isOnSale,
  priceTagState,
  type PriceTagState,
  quotaProgress,
  savingPerUnit,
} from "./sale.format";
export type { ListingPricing, OrderItemSale, PricingSale, SaleFundedBy, SaleType } from "./sale.types";
export { useCountdown } from "./use-countdown";
