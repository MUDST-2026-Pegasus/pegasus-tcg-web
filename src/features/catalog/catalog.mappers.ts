import { translate } from "@/lib/language";
import type { CardCondition, ProductMarketDto, ProductType, PublicListingDto } from "./catalog.types";

/** ป้ายที่คนอ่าน สำหรับค่าที่ backend ส่งมาเป็นรหัส — ไม่มี React ในไฟล์นี้ */

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  get SINGLE_CARD() { return translate("การ์ดเดี่ยว", "Single Card"); },
  get BOOSTER_PACK() { return translate("ซองสุ่ม", "Booster Pack"); },
  get BOOSTER_BOX() { return translate("กล่องสุ่ม", "Booster Box"); },
  get ELITE_TRAINER_BOX() { return translate("กล่อง Elite Trainer", "Elite Trainer Box"); },
  get STARTER_DECK() { return translate("เด็คเริ่มต้น", "Starter Deck"); },
  get BUNDLE() { return translate("ชุดรวม", "Bundle"); },
  get ACCESSORY() { return translate("อุปกรณ์เสริม", "Accessory"); },
  get OTHER() { return translate("อื่นๆ", "Other"); },
};

export const CONDITION_LABELS: Record<CardCondition, string> = {
  get NM() { return translate("สภาพเกือบใหม่", "Near Mint"); },
  get LP() { return translate("ผ่านการเล่นเล็กน้อย", "Lightly Played"); },
  get MP() { return translate("ผ่านการเล่นปานกลาง", "Moderately Played"); },
  get HP() { return translate("ผ่านการเล่นมาก", "Heavily Played"); },
  get DMG() { return translate("เสียหาย", "Damaged"); },
  get SEALED() { return translate("ยังไม่แกะซีล", "Sealed"); },
};

export function productHref(slug: string): string {
  return `/products/${encodeURIComponent(slug)}`;
}

const priceFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

/** null หรือไม่มีค่า = ไม่มีใครขาย */
export function formatPrice(price: number | null | undefined): string {
  return price === null || price === undefined
    ? translate("สินค้าหมด", "Out of stock")
    : priceFormatter.format(price);
}
export function marketForListing(market: ProductMarketDto[] | undefined, listing: PublicListingDto | undefined) {
  if (!listing) return undefined;
  return market?.find((row) => row.catalogVariantId === listing.card.variantId && row.condition === listing.condition);
}
