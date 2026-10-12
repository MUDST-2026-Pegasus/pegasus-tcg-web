import type { CardCondition, ProductType } from "./catalog.types";

/** ป้ายที่คนอ่าน สำหรับค่าที่ backend ส่งมาเป็นรหัส — ไม่มี React ในไฟล์นี้ */

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  SINGLE_CARD: "Single Card",
  BOOSTER_PACK: "Booster Pack",
  BOOSTER_BOX: "Booster Box",
  ELITE_TRAINER_BOX: "Elite Trainer Box",
  STARTER_DECK: "Starter Deck",
  BUNDLE: "Bundle",
  ACCESSORY: "Accessory",
  OTHER: "Other",
};

export const CONDITION_LABELS: Record<CardCondition, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
  SEALED: "Sealed",
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
    ? "Out of stock"
    : priceFormatter.format(price);
}
