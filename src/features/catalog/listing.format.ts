import type { PublicListingDto } from "./catalog.types";
import { formatNumber, numberFormat } from "@/lib/i18n";

type Seller = PublicListingDto["seller"];
type Delivery = PublicListingDto["delivery"];

const salesFormatter = numberFormat({
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatListingPrice(amount: number): string {
  return formatNumber(amount, { maximumFractionDigits: 0 });
}

export function formatSellerReputation(seller?: Seller | null): string {
  if (!seller) return "";
  const salesCount = seller.salesCount ?? 0;
  const sales = salesCount > 0 ? `${salesFormatter.format(salesCount).toLowerCase()} sales` : "";
  if (seller.ratingAvg == null || (seller.ratingCount ?? 0) === 0) {
    return sales || "ร้านใหม่";
  }
  return `★ ${seller.ratingAvg.toFixed(1)} · ${sales || "0 sales"}`;
}

export function formatListingDelivery(delivery?: Delivery | null): string {
  if (!delivery || delivery.optionCount === 0) return "ยังไม่ตั้งค่าการจัดส่ง";
  if (delivery.freeShipping) return "Free shipping";

  const min = delivery.fastestEstDaysMin;
  const max = delivery.fastestEstDaysMax;
  if (min != null && max != null) {
    if (min === 1 && max === 1) return "Ships tomorrow";
    return `Ships in ${min}${min === max ? "" : `–${max}`} days`;
  }
  if (min != null) return min === 1 ? "Ships tomorrow" : `Ships in ${min} days`;
  if (max != null) return max === 1 ? "Ships tomorrow" : `Ships in ${max} days`;
  return "จัดส่งตามเงื่อนไขร้าน";
}
