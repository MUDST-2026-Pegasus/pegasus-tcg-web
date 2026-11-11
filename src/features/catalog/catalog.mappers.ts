import type { CardCondition, ProductMarketDto, ProductType, PublicListingDto } from "./catalog.types";
import { numberFormat, translate } from "@/lib/i18n";

/** ป้ายที่คนอ่าน สำหรับค่าที่ backend ส่งมาเป็นรหัส — ไม่มี React ในไฟล์นี้ */

// getter: อ่านภาษาปัจจุบันทุกครั้งที่ใช้ [TCG-560]
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  get SINGLE_CARD() {
    return translate("buyer", "productType.singleCard", "การ์ดใบเดี่ยว");
  },
  get BOOSTER_PACK() {
    return translate("buyer", "productType.boosterPack", "ซองสุ่ม");
  },
  get BOOSTER_BOX() {
    return translate("buyer", "productType.boosterBox", "กล่องสุ่ม");
  },
  get ELITE_TRAINER_BOX() {
    return translate("buyer", "productType.eliteTrainerBox", "Elite Trainer Box");
  },
  get STARTER_DECK() {
    return translate("buyer", "productType.starterDeck", "เด็คพร้อมเล่น");
  },
  get BUNDLE() {
    return translate("buyer", "productType.bundle", "ชุดรวม");
  },
  get ACCESSORY() {
    return translate("buyer", "productType.accessory", "อุปกรณ์เสริม");
  },
  get OTHER() {
    return translate("buyer", "productType.other", "อื่น ๆ");
  },
};

export const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
  // NM–DMG เป็นชื่อเกรดสากล ใช้อังกฤษทั้งสองภาษา [GLOSSARY]
  get SEALED() {
    return translate("buyer", "condition.sealed", "ซีล");
  },
};

export function productHref(slug: string): string {
  return `/products/${encodeURIComponent(slug)}`;
}

const priceFormatter = numberFormat({
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

/** null หรือไม่มีค่า = ไม่มีใครขาย */
export function formatPrice(price: number | null | undefined): string {
  return price === null || price === undefined
    ? translate("common", "listing.outOfStock", "สินค้าหมด")
    : priceFormatter.format(price);
}
export function marketForListing(market: ProductMarketDto[] | undefined, listing: PublicListingDto | undefined) {
  if (!listing) return undefined;
  return market?.find((row) => row.catalogVariantId === listing.card.variantId && row.condition === listing.condition);
}

// @tolgee-key {"key":"listing.outOfStock","ns":"common","defaultValue":"สินค้าหมด"}
