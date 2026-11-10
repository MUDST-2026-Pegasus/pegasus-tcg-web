import type { PublicListingDto } from "./catalog.types";
import { formatNumber, numberFormat, translate } from "@/lib/i18n";

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
  const salesText = (count: string) => translate("common", "listing.sales", "{count} sales", { count });
  const sales = salesCount > 0 ? salesText(salesFormatter.format(salesCount).toLowerCase()) : "";
  if (seller.ratingAvg == null || (seller.ratingCount ?? 0) === 0) {
    return sales || translate("common", "listing.newShop", "ร้านใหม่");
  }
  return `★ ${seller.ratingAvg.toFixed(1)} · ${sales || salesText("0")}`;
}

export function formatListingDelivery(delivery?: Delivery | null): string {
  if (!delivery || delivery.optionCount === 0) return translate("common", "listing.deliveryNotSet", "ยังไม่ตั้งค่าการจัดส่ง");
  if (delivery.freeShipping) return translate("common", "listing.freeShipping", "Free shipping");

  const tomorrow = () => translate("common", "listing.shipsTomorrow", "Ships tomorrow");
  const shipsIn = (days: string) => translate("common", "listing.shipsInDays", "Ships in {days} days", { days });
  const min = delivery.fastestEstDaysMin;
  const max = delivery.fastestEstDaysMax;
  if (min != null && max != null) {
    if (min === 1 && max === 1) return tomorrow();
    return shipsIn(`${min}${min === max ? "" : `–${max}`}`);
  }
  if (min != null) return min === 1 ? tomorrow() : shipsIn(String(min));
  if (max != null) return max === 1 ? tomorrow() : shipsIn(String(max));
  return translate("common", "listing.deliveryByShop", "จัดส่งตามเงื่อนไขร้าน");
}

// helper นอก component ใช้ translate (namespace common โหลดตั้งแต่เปิดเว็บ) — ประกาศ key ให้ tolgee CLI เห็น
// @tolgee-key {"key":"listing.sales","ns":"common","defaultValue":"{count} sales"}
// @tolgee-key {"key":"listing.newShop","ns":"common","defaultValue":"ร้านใหม่"}
// @tolgee-key {"key":"listing.deliveryNotSet","ns":"common","defaultValue":"ยังไม่ตั้งค่าการจัดส่ง"}
// @tolgee-key {"key":"listing.freeShipping","ns":"common","defaultValue":"Free shipping"}
// @tolgee-key {"key":"listing.shipsTomorrow","ns":"common","defaultValue":"Ships tomorrow"}
// @tolgee-key {"key":"listing.shipsInDays","ns":"common","defaultValue":"Ships in {days} days"}
// @tolgee-key {"key":"listing.deliveryByShop","ns":"common","defaultValue":"จัดส่งตามเงื่อนไขร้าน"}
