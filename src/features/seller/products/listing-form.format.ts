import { hasErrorCode } from "@/lib/api";
import type { PageResponse } from "@/lib/api";

import type {
  CatalogProductDetail,
  CatalogProductType,
  CatalogSearchItem,
  CatalogVariant,
  MarketListing,
  MarketSnapshot,
  SelectedCard,
  VariantLookup,
} from "./listing-form.types";
import { listingErrorMessage, roundMoney } from "./products.format";
import type { CardCondition, SellerListing } from "./products.types";
import { translate } from "@/lib/i18n";

/**
 * ตัวช่วยของหน้าลงขาย / แก้ประกาศ — ไม่มี React ไม่มี state
 */

export type ConditionOption = {
  value: CardCondition;
  /** "Near Mint (NM)" */
  label: string;
  description: string;
  /** ป้ายบนการ์ดตัวอย่างที่ผู้ซื้อเห็น */
  badgeLabel: string;
};

/** ทุกค่าใน `model/CardCondition.java` เรียงจากดีไปแย่ ปิดท้ายด้วยของซีล */
export const CONDITION_OPTIONS: ConditionOption[] = [
  {
    value: "NM",
    label: "Near Mint (NM)",
    get description() { return translate("seller", "listingForm.condition.NM", "ตำหนิเล็กน้อยมองแทบไม่เห็น"); },
    badgeLabel: "NEAR MINT",
  },
  {
    value: "LP",
    label: "Lightly Played (LP)",
    get description() { return translate("seller", "listingForm.condition.LP", "มีรอยขอบหรือรอยขีดเล็กน้อย"); },
    badgeLabel: "LIGHTLY PLAYED",
  },
  {
    value: "MP",
    label: "Moderately Played (MP)",
    get description() { return translate("seller", "listingForm.condition.MP", "รอยใช้งานเห็นชัด ขอบขาว มีรอยถลอก"); },
    badgeLabel: "MODERATELY PLAYED",
  },
  {
    value: "HP",
    label: "Heavily Played (HP)",
    get description() { return translate("seller", "listingForm.condition.HP", "ใช้งานหนัก มีรอยยับหรือรอยพับเล็กน้อย"); },
    badgeLabel: "HEAVILY PLAYED",
  },
  {
    value: "DMG",
    label: "Damaged (DMG)",
    get description() { return translate("seller", "listingForm.condition.DMG", "มีรอยพับ ฉีก หรือเปื้อนชัดเจน"); },
    badgeLabel: "DAMAGED",
  },
  {
    value: "SEALED",
    label: "Sealed",
    get description() { return translate("seller", "listingForm.condition.SEALED", "ยังไม่แกะซีล — กล่อง ซอง หรือเด็คที่ขายทั้งชิ้น"); },
    badgeLabel: "SEALED",
  },
];

export const CARD_CONDITIONS = CONDITION_OPTIONS.map((option) => option.value);

/** ของที่ขายทั้งชิ้น (ไม่ใช่การ์ดเดี่ยว) เริ่มที่ SEALED ให้ */
export function defaultConditionFor(
  productType: CatalogProductType | null,
): CardCondition | null {
  if (productType === null || productType === "SINGLE_CARD") return null;
  return productType === "ACCESSORY" ? null : "SEALED";
}

/**
 * "EN / FOIL / FIRST_EDITION / Alt Art" — สร้างแบบเดียวกับ `CatalogVariant.label()`
 * ฝั่ง backend (`variant.label()` ไม่ได้ส่งมากับ JSON) เพื่อให้ตรงกับที่ตารางสินค้าโชว์
 */
export function variantLabelOf(variant: CatalogVariant): string {
  return [
    variant.languageCode,
    variant.finish === "NOT_APPLICABLE" ? null : variant.finish,
    variant.edition === "NOT_APPLICABLE" ? null : variant.edition,
    variant.printingNote?.trim() || null,
  ]
    .filter(Boolean)
    .join(" / ");
}

function cardTags(cardNumber: string | null, rarityCode: string | null) {
  return [cardNumber, rarityCode].filter((tag): tag is string => Boolean(tag));
}

/** เลือกจากผลค้นแคตตาล็อก → รูปของพิมพ์นั้นถ้ามี ไม่งั้นรูปหลักของการ์ด */
export function selectedFromCatalog(
  detail: CatalogProductDetail,
  variant: CatalogVariant,
  fallbackImageUrl: string | null,
): SelectedCard {
  const variantImage = detail.images.find(
    (image) => image.catalogVariantId === variant.id,
  );
  const primary = detail.images.find((image) => image.primary);
  return {
    variantId: variant.id,
    sku: variant.sku,
    variantLabel: variantLabelOf(variant),
    productId: detail.product.id,
    productName: detail.product.name,
    imageUrl: variantImage?.url ?? primary?.url ?? fallbackImageUrl,
    tags: cardTags(detail.product.cardNumber, detail.product.rarityCode),
    productType: detail.product.productType,
  };
}

/** เจอจากรหัส — lookup ไม่ได้บอกเลขการ์ด/รูป ผู้เรียกเติมจาก `getCatalogProduct` ถ้ามี */
export function selectedFromLookup(
  lookup: VariantLookup,
  detail?: CatalogProductDetail,
): SelectedCard {
  if (detail) {
    return selectedFromCatalog(detail, lookup.variant, null);
  }
  return {
    variantId: lookup.variant.id,
    sku: lookup.variant.sku,
    variantLabel: lookup.variantLabel,
    productId: lookup.productId,
    productName: lookup.productName,
    imageUrl: null,
    tags: [],
    productType: null,
  };
}

export function selectedFromListing(listing: SellerListing): SelectedCard {
  return {
    variantId: listing.card.variantId,
    sku: listing.card.sku,
    variantLabel: listing.card.variantLabel,
    productId: listing.card.productId,
    productName: listing.card.productName,
    imageUrl: listing.card.officialImageUrl,
    tags: [],
    productType: null,
  };
}

/** แถวในผลค้น: "Charizard ex · 006/197 · SR" */
export function searchItemMeta(item: CatalogSearchItem): string {
  return [item.nameLocal, item.cardNumber, item.rarityCode]
    .filter(Boolean)
    .join(" · ");
}

/**
 * ราคาของประกาศที่เปิดขายอยู่ → ช่วงราคา ใช้ค่ากลางแบบเดียวกับ `percentile_cont(0.5)`
 * ที่งานกลางคืนใช้ ถ้ามีเกิน 100 ใบ ค่ากลางคิดจาก 100 ใบที่ถูกที่สุด (ประมาณ)
 */
export function marketSnapshotFrom(
  page: PageResponse<MarketListing>,
): MarketSnapshot | null {
  const prices = page.items.map((item) => item.price).sort((a, b) => a - b);
  if (prices.length === 0) {
    return null;
  }
  const middle = (prices.length - 1) / 2;
  const median =
    (prices[Math.floor(middle)] + prices[Math.ceil(middle)]) / 2;
  return {
    listingCount: page.totalItems,
    low: prices[0],
    median: roundMoney(median),
    high: prices[prices.length - 1],
  };
}

/**
 * ราคาที่งานตอนตี 3 จะตั้งให้ถ้าตลาดเป็นแบบตอนนี้ — สูตรเดียวกับ `AutoPriceCalculator`:
 * ค่ากลาง × (1 + ส่วนต่าง / 100) ปัดเป็นสตางค์ แล้วไม่ให้ต่ำกว่า floor / สูงกว่า ceiling
 */
export function autoPricePreview(input: {
  median: number;
  offsetPercent: number;
  floor: number | null;
  ceiling: number | null;
}): { price: number; heldAt: "floor" | "ceiling" | null } {
  let price = roundMoney(input.median * (1 + input.offsetPercent / 100));
  let heldAt: "floor" | "ceiling" | null = null;
  if (input.floor !== null && price < input.floor) {
    price = input.floor;
    heldAt = "floor";
  }
  if (input.ceiling !== null && price > input.ceiling) {
    price = input.ceiling;
    heldAt = "ceiling";
  }
  return { price, heldAt };
}

/**
 * งานราคาอัตโนมัติไม่ขยับราคาถ้าค่ากลางมาจากประกาศน้อยกว่านี้
 * (`pricing.median_min_sample` ค่าเริ่มต้น — แอดมินเปลี่ยนได้)
 */
export const AUTO_PRICE_MIN_SAMPLE = 3;

/**
 * ค่าคอมมิชชั่นที่ใช้ประมาณกำไร — `commission.default_rate` ค่าเริ่มต้นของแพลตฟอร์ม
 * ผู้ขายยังอ่านค่าจริง (รวมกฎรายหมวด) จาก backend ไม่ได้ จึงเป็นตัวเลขประมาณ
 */
export const ESTIMATED_COMMISSION_PERCENT = 5;

/** "-5" / "12.5" — รับเครื่องหมายลบนำหน้าและทศนิยมไม่เกิน 2 ตำแหน่ง */
export function sanitizeSignedDecimal(value: string): string {
  const negative = value.trimStart().startsWith("-");
  const [whole, ...fraction] = value.replace(/[^\d.]/g, "").split(".");
  const digits =
    fraction.length > 0
      ? `${whole}.${fraction.join("").slice(0, 2)}`
      : whole;
  return negative ? `-${digits}` : digits;
}

/** error ของการลงขาย/แก้ประกาศ — เพิ่มกรณีของฟอร์มนี้ต่อจาก `listingErrorMessage` */
export function listingFormErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (hasErrorCode(error, "LISTING_PHOTO_IN_USE")) {
    return translate("seller", "listingForm.errors.photoInUse", "มีรูปที่ถูกใช้ในประกาศของร้านอื่นอยู่แล้ว เอารูปนั้นออกแล้วอัปรูปของคุณเอง");
  }
  if (hasErrorCode(error, "FILE_NOT_FOUND")) {
    return translate("seller", "listingForm.errors.fileNotFound", "มีรูปที่อัปโหลดไม่เสร็จหรือหายไปแล้ว เอาออกแล้วอัปใหม่");
  }
  if (hasErrorCode(error, "VARIANT_NOT_FOUND")) {
    return translate("seller", "listingForm.errors.variantNotFound", "ไม่พบการ์ดพิมพ์นี้ในแคตตาล็อกแล้ว เลือกการ์ดใหม่");
  }
  return listingErrorMessage(error, fallback);
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-555]
// @tolgee-key {"key": "listingForm.condition.NM", "ns": "seller", "defaultValue": "ตำหนิเล็กน้อยมองแทบไม่เห็น"}
// @tolgee-key {"key": "listingForm.condition.LP", "ns": "seller", "defaultValue": "มีรอยขอบหรือรอยขีดเล็กน้อย"}
// @tolgee-key {"key": "listingForm.condition.MP", "ns": "seller", "defaultValue": "รอยใช้งานเห็นชัด ขอบขาว มีรอยถลอก"}
// @tolgee-key {"key": "listingForm.condition.HP", "ns": "seller", "defaultValue": "ใช้งานหนัก มีรอยยับหรือรอยพับเล็กน้อย"}
// @tolgee-key {"key": "listingForm.condition.DMG", "ns": "seller", "defaultValue": "มีรอยพับ ฉีก หรือเปื้อนชัดเจน"}
// @tolgee-key {"key": "listingForm.condition.SEALED", "ns": "seller", "defaultValue": "ยังไม่แกะซีล — กล่อง ซอง หรือเด็คที่ขายทั้งชิ้น"}
// @tolgee-key {"key": "listingForm.errors.photoInUse", "ns": "seller", "defaultValue": "มีรูปที่ถูกใช้ในประกาศของร้านอื่นอยู่แล้ว เอารูปนั้นออกแล้วอัปรูปของคุณเอง"}
// @tolgee-key {"key": "listingForm.errors.fileNotFound", "ns": "seller", "defaultValue": "มีรูปที่อัปโหลดไม่เสร็จหรือหายไปแล้ว เอาออกแล้วอัปใหม่"}
// @tolgee-key {"key": "listingForm.errors.variantNotFound", "ns": "seller", "defaultValue": "ไม่พบการ์ดพิมพ์นี้ในแคตตาล็อกแล้ว เลือกการ์ดใหม่"}
