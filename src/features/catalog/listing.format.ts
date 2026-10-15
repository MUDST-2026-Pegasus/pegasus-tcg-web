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

export function formatSellerReputation(seller: Seller): string {
  const sales = seller.salesCount > 0 ? `${salesFormatter.format(seller.salesCount).toLowerCase()} sales` : "";
  if (seller.ratingAvg === null || seller.ratingCount === 0) {
    return sales || "ร้านใหม่";
  }
  return `★ ${seller.ratingAvg.toFixed(1)} · ${sales || "0 sales"}`;
}

export function formatListingDelivery(delivery: Delivery): string {
  if (delivery.optionCount === 0) return "ยังไม่ตั้งค่าการจัดส่ง";
  if (delivery.freeShipping) return "Free shipping";

  const min = delivery.fastestEstDaysMin;
  const max = delivery.fastestEstDaysMax;
  if (min !== null && max !== null) {
    if (min === 1 && max === 1) return "Ships tomorrow";
    return `Ships in ${min}${min === max ? "" : `–${max}`} days`;
  }
  if (min !== null) return min === 1 ? "Ships tomorrow" : `Ships in ${min} days`;
  if (max !== null) return max === 1 ? "Ships tomorrow" : `Ships in ${max} days`;
  return "จัดส่งตามเงื่อนไขร้าน";
}
