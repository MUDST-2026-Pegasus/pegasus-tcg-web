import type { CardCondition, ProductMarketDto, ProductType, PublicListingDto } from "./catalog.types";
import { numberFormat, translate } from "@/lib/i18n";

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

// ชื่อหมวดใน DB มีแค่ภาษาไทย — แปลตาม code ที่คงที่ หมวดใหม่ที่ยังไม่มีในนี้ใช้ชื่อจาก DB [TCG-560]
const CATEGORY_LABELS: Record<string, string> = {
  get SINGLES() {
    return translate("buyer", "category.singles", "การ์ดใบเดี่ยว");
  },
  get BOOSTER_PACKS() {
    return translate("buyer", "category.boosterPacks", "ซองสุ่ม");
  },
  get BOOSTER_BOXES() {
    return translate("buyer", "category.boosterBoxes", "กล่องสุ่ม");
  },
  get SEALED() {
    return translate("buyer", "category.sealed", "สินค้าซีล");
  },
  get STARTER_DECKS() {
    return translate("buyer", "category.starterDecks", "เด็คพร้อมเล่น");
  },
  get ELITE_TRAINER_BOXES() {
    return translate("buyer", "category.eliteTrainerBoxes", "Elite Trainer Box");
  },
  get ACCESSORY() {
    return translate("buyer", "category.accessory", "อุปกรณ์เสริม");
  },
  get SLEEVES() {
    return translate("buyer", "category.sleeves", "ซองใส่การ์ด");
  },
  get BINDERS() {
    return translate("buyer", "category.binders", "แฟ้มสะสมการ์ด");
  },
  get DECK_BOXES() {
    return translate("buyer", "category.deckBoxes", "กล่องใส่เด็ค");
  },
  get PLAYMATS() {
    return translate("buyer", "category.playmats", "แผ่นรองเล่น");
  },
  get CARD_PROTECTION() {
    return translate("buyer", "category.cardProtection", "ท็อปโหลดเดอร์และเคส");
  },
  get OTHER() {
    return translate("buyer", "category.other", "อื่น ๆ");
  },
};

export function categoryLabel(category: { code: string; name: string }): string {
  return Object.hasOwn(CATEGORY_LABELS, category.code) ? CATEGORY_LABELS[category.code] : category.name;
}

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
