import { translate } from "@/lib/language";
import type { PublicListingDto } from "./catalog.types";

type Seller = PublicListingDto["seller"];
type Delivery = PublicListingDto["delivery"];

const salesFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatListingPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
}

export function formatSellerReputation(seller?: Seller | null): string {
  if (!seller) return "";
  const salesCount = seller.salesCount ?? 0;
  const sales = salesCount > 0 ? `${salesFormatter.format(salesCount).toLowerCase()} sales` : "";
  if (seller.ratingAvg == null || (seller.ratingCount ?? 0) === 0) {
    return sales || translate("ร้านใหม่", "New store");
  }
  return `★ ${seller.ratingAvg.toFixed(1)} · ${sales || "0 sales"}`;
}

export function formatListingDelivery(delivery?: Delivery | null): string {
  if (!delivery || delivery.optionCount === 0) return translate("ยังไม่ตั้งค่าการจัดส่ง", "Shipping has not been configured");
  if (delivery.freeShipping) return translate("จัดส่งฟรี", "Free shipping");

  const min = delivery.fastestEstDaysMin;
  const max = delivery.fastestEstDaysMax;
  if (min != null && max != null) {
    if (min === 1 && max === 1) return translate("จัดส่งพรุ่งนี้", "Ships tomorrow");
    return `Ships in ${min}${min === max ? "" : `–${max}`} days`;
  }
  if (min != null) return min === 1 ? translate("จัดส่งพรุ่งนี้", "Ships tomorrow") : `Ships in ${min} days`;
  if (max != null) return max === 1 ? translate("จัดส่งพรุ่งนี้", "Ships tomorrow") : `Ships in ${max} days`;
  return translate("จัดส่งตามเงื่อนไขร้าน", "Shipping follows the store's policy");
}
