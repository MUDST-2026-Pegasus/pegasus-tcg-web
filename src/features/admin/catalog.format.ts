import type { ProductCardData } from "@/components/common";
import { hasErrorCode } from "@/lib/api";

import type {
  CardEdition,
  CardFinish,
  ProductSort,
  ProductSummary,
  ProductType,
} from "./catalog.types";

/**
 * ตัวช่วยแปลงข้อมูลแคตตาล็อกจาก backend → ข้อความที่โชว์บนจอ
 * ไม่มี React ไม่มี state
 */

/** เรียงตามลำดับที่ backend ประกาศไว้ใน `ProductType.java` */
export const PRODUCT_TYPES: ProductType[] = [
  "SINGLE_CARD",
  "BOOSTER_PACK",
  "BOOSTER_BOX",
  "ELITE_TRAINER_BOX",
  "STARTER_DECK",
  "BUNDLE",
  "ACCESSORY",
  "OTHER",
];

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  get SINGLE_CARD() {
    return translate("admin", "catalog.productType.singleCard", "การ์ดเดี่ยว");
  },
  get BOOSTER_PACK() {
    return translate("admin", "catalog.productType.boosterPack", "ซองสุ่ม");
  },
  get BOOSTER_BOX() {
    return translate("admin", "catalog.productType.boosterBox", "กล่องสุ่ม");
  },
  ELITE_TRAINER_BOX: "Elite Trainer Box",
  get STARTER_DECK() {
    return translate("admin", "catalog.productType.starterDeck", "เด็คเริ่มต้น");
  },
  get BUNDLE() {
    return translate("admin", "catalog.productType.bundle", "ชุดรวม");
  },
  get ACCESSORY() {
    return translate("admin", "catalog.productType.accessory", "อุปกรณ์เสริม");
  },
  get OTHER() {
    return translate("admin", "catalog.productType.other", "อื่น ๆ");
  },
};

export const PRODUCT_SORTS: ProductSort[] = [
  "newest",
  "name",
  "cardNumber",
  "popular",
  "price_asc",
  "price_desc",
];

export const PRODUCT_SORT_LABEL: Record<ProductSort, string> = {
  get newest() {
    return translate("admin", "catalog.sort.newest", "เพิ่มล่าสุด");
  },
  get name() {
    return translate("admin", "catalog.sort.name", "ชื่อ A-Z");
  },
  get cardNumber() {
    return translate("admin", "catalog.sort.cardnumber", "เลขในชุด");
  },
  get popular() {
    return translate("admin", "catalog.sort.popular", "ยอดนิยม");
  },
  get price_asc() {
    return translate("admin", "catalog.sort.priceAsc", "ราคาต่ำ-สูง");
  },
  get price_desc() {
    return translate("admin", "catalog.sort.priceDesc", "ราคาสูง-ต่ำ");
  },
};

export const CARD_FINISHES: CardFinish[] = [
  "NORMAL",
  "HOLO",
  "REVERSE_HOLO",
  "FOIL",
  "ETCHED",
  "TEXTURED",
  "NOT_APPLICABLE",
];

export { CARD_FINISH_LABEL } from "@/lib/card-labels";
import { CARD_FINISH_LABEL, CARD_EDITION_LABEL } from "@/lib/card-labels";
import { numberFormat, translate, translateError, formatMoney } from "@/lib/i18n";

export const CARD_EDITIONS: CardEdition[] = [
  "NOT_APPLICABLE",
  "FIRST_EDITION",
  "UNLIMITED",
  "PROMO",
];

export { CARD_EDITION_LABEL } from "@/lib/card-labels";

/**
 * "EN / Foil / 1st Edition / Alt Art" — อ่านแบบเดียวกับ `CatalogVariant.label()`
 * ฝั่ง backend (ที่โชว์บนบรรทัดคำสั่งซื้อ) ส่วนที่เป็น NOT_APPLICABLE ไม่แสดง
 */
export function variantLabel(variant: {
  languageCode: string;
  finish: CardFinish;
  edition: CardEdition;
  printingNote: string | null;
}): string {
  return [
    variant.languageCode,
    variant.finish === "NOT_APPLICABLE"
      ? null
      : CARD_FINISH_LABEL[variant.finish],
    variant.edition === "NOT_APPLICABLE"
      ? null
      : CARD_EDITION_LABEL[variant.edition],
    variant.printingNote,
  ]
    .filter(Boolean)
    .join(" / ");
}

const NUMBER = numberFormat();

/** 18940 → "18,940" */
export function formatCount(value: number): string {
  return NUMBER.format(value);
}

/** 1290 → "THB 1,290.00" */
export function formatBaht(amount: number): string {
  return formatMoney(amount);
}

/** "Charizard ex · 006/197" — เลขการ์ดช่วยแยกใบชื่อซ้ำคนละชุด */
export function productTitle(product: {
  name: string;
  cardNumber: string | null;
}): string {
  return product.cardNumber
    ? `${product.name} · ${product.cardNumber}`
    : product.name;
}

/**
 * ผลค้นหาหนึ่งใบ → ข้อมูลที่ `ProductCard` วาด
 * ราคาคือราคาถูกสุดที่มีคนขายตอนนี้ ไม่ใช่ราคาตั้งของแคตตาล็อก (แคตตาล็อกไม่มีราคา)
 */
export function toProductCard(product: ProductSummary): ProductCardData {
  return {
    id: String(product.id),
    type: PRODUCT_TYPE_LABEL[product.productType],
    title: productTitle(product),
    price:
      product.lowestPrice === null
        ? translate("admin", "catalog.products.noSeller", "ยังไม่มีคนขาย")
        : formatBaht(product.lowestPrice),
    image: product.primaryImageUrl ?? undefined,
    imageAlt: product.name,
  };
}

/** error จาก endpoint แคตตาล็อก → ข้อความภาษาไทย ตัวที่ไม่รู้จักใช้ข้อความจาก backend */
export function catalogErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "PRODUCT_NOT_FOUND")) {
    return translate("admin", "catalog.errors.productNotFound", "ไม่พบสินค้านี้ในแคตตาล็อก");
  }
  if (hasErrorCode(error, "PRODUCT_IN_USE")) {
    return translate("admin", "catalog.errors.productInUse", "สินค้านี้มีประกาศขาย คำสั่งซื้อ หรือคอลเลกชันอ้างถึงอยู่ ลบไม่ได้ — ปิดใช้งานแทน");
  }
  if (hasErrorCode(error, "VARIANT_NOT_FOUND")) {
    return translate("admin", "catalog.errors.variantNotFound", "ไม่พบ variant นี้แล้ว ลองโหลดสินค้าใหม่");
  }
  if (hasErrorCode(error, "IMAGE_NOT_FOUND")) {
    return translate("admin", "catalog.errors.imageNotFound", "รูปนี้ถูกลบไปแล้ว");
  }
  if (hasErrorCode(error, "CATEGORY_NOT_FOUND")) {
    return translate("admin", "catalog.errors.categoryNotFound", "ไม่พบหมวดหมู่ที่เลือก");
  }
  if (hasErrorCode(error, "CARD_SET_NOT_FOUND")) {
    return translate("admin", "catalog.errors.cardSetNotFound", "ไม่พบชุดที่เลือก");
  }
  if (hasErrorCode(error, "GAME_NOT_FOUND")) {
    return translate("admin", "catalog.errors.gameNotFound", "ไม่พบเกมนี้");
  }
  if (hasErrorCode(error, "SKU_ALREADY_USED")) {
    return translate("admin", "catalog.errors.skuAlreadyUsed", "SKU นี้มี variant อื่นใช้อยู่แล้ว");
  }
  if (hasErrorCode(error, "VARIANT_ALREADY_EXISTS")) {
    return translate("admin", "catalog.errors.variantAlreadyExists", "สินค้านี้มี variant ภาษา / finish / edition / หมายเหตุการพิมพ์ นี้อยู่แล้ว");
  }
  if (hasErrorCode(error, "IMAGE_KEY_IN_USE")) {
    return translate("admin", "catalog.errors.imageKeyInUse", "ไฟล์นี้ถูกแนบกับรูปอื่นไปแล้ว อัปโหลดใหม่อีกครั้งถ้าจะใช้ซ้ำ");
  }
  if (hasErrorCode(error, "FILE_NOT_FOUND")) {
    return translate("admin", "catalog.errors.fileNotFound", "ไฟล์ยังอัปโหลดไม่เสร็จหรือหายไปแล้ว ลองอัปใหม่");
  }
  if (hasErrorCode(error, "ACCESS_DENIED")) {
    return translate("admin", "catalog.errors.accessDenied", "บัญชีนี้ไม่มีสิทธิ์แก้แคตตาล็อก");
  }
  return translateError(error, fallback);
}

// @tolgee-key {"key": "catalog.errors.productNotFound", "ns": "admin", "defaultValue": "ไม่พบสินค้านี้ในแคตตาล็อก"}
// @tolgee-key {"key": "catalog.errors.productInUse", "ns": "admin", "defaultValue": "สินค้านี้มีประกาศขาย คำสั่งซื้อ หรือคอลเลกชันอ้างถึงอยู่ ลบไม่ได้ — ปิดใช้งานแทน"}
// @tolgee-key {"key": "catalog.errors.variantNotFound", "ns": "admin", "defaultValue": "ไม่พบ variant นี้แล้ว ลองโหลดสินค้าใหม่"}
// @tolgee-key {"key": "catalog.errors.imageNotFound", "ns": "admin", "defaultValue": "รูปนี้ถูกลบไปแล้ว"}
// @tolgee-key {"key": "catalog.errors.categoryNotFound", "ns": "admin", "defaultValue": "ไม่พบหมวดหมู่ที่เลือก"}
// @tolgee-key {"key": "catalog.errors.cardSetNotFound", "ns": "admin", "defaultValue": "ไม่พบชุดที่เลือก"}
// @tolgee-key {"key": "catalog.errors.gameNotFound", "ns": "admin", "defaultValue": "ไม่พบเกมนี้"}
// @tolgee-key {"key": "catalog.errors.skuAlreadyUsed", "ns": "admin", "defaultValue": "SKU นี้มี variant อื่นใช้อยู่แล้ว"}
// @tolgee-key {"key": "catalog.errors.variantAlreadyExists", "ns": "admin", "defaultValue": "สินค้านี้มี variant ภาษา / finish / edition / หมายเหตุการพิมพ์ นี้อยู่แล้ว"}
// @tolgee-key {"key": "catalog.errors.imageKeyInUse", "ns": "admin", "defaultValue": "ไฟล์นี้ถูกแนบกับรูปอื่นไปแล้ว อัปโหลดใหม่อีกครั้งถ้าจะใช้ซ้ำ"}
// @tolgee-key {"key": "catalog.errors.fileNotFound", "ns": "admin", "defaultValue": "ไฟล์ยังอัปโหลดไม่เสร็จหรือหายไปแล้ว ลองอัปใหม่"}
// @tolgee-key {"key": "catalog.errors.accessDenied", "ns": "admin", "defaultValue": "บัญชีนี้ไม่มีสิทธิ์แก้แคตตาล็อก"}
// @tolgee-key {"key": "catalog.products.noSeller", "ns": "admin", "defaultValue": "ยังไม่มีคนขาย"}
// @tolgee-key {"key": "catalog.productType.singleCard", "ns": "admin", "defaultValue": "การ์ดเดี่ยว"}
// @tolgee-key {"key": "catalog.productType.boosterPack", "ns": "admin", "defaultValue": "ซองสุ่ม"}
// @tolgee-key {"key": "catalog.productType.boosterBox", "ns": "admin", "defaultValue": "กล่องสุ่ม"}
// @tolgee-key {"key": "catalog.productType.starterDeck", "ns": "admin", "defaultValue": "เด็คเริ่มต้น"}
// @tolgee-key {"key": "catalog.productType.bundle", "ns": "admin", "defaultValue": "ชุดรวม"}
// @tolgee-key {"key": "catalog.productType.accessory", "ns": "admin", "defaultValue": "อุปกรณ์เสริม"}
// @tolgee-key {"key": "catalog.productType.other", "ns": "admin", "defaultValue": "อื่น ๆ"}
// @tolgee-key {"key": "catalog.sort.newest", "ns": "admin", "defaultValue": "เพิ่มล่าสุด"}
// @tolgee-key {"key": "catalog.sort.name", "ns": "admin", "defaultValue": "ชื่อ A-Z"}
// @tolgee-key {"key": "catalog.sort.cardnumber", "ns": "admin", "defaultValue": "เลขในชุด"}
// @tolgee-key {"key": "catalog.sort.popular", "ns": "admin", "defaultValue": "ยอดนิยม"}
// @tolgee-key {"key": "catalog.sort.priceAsc", "ns": "admin", "defaultValue": "ราคาต่ำ-สูง"}
// @tolgee-key {"key": "catalog.sort.priceDesc", "ns": "admin", "defaultValue": "ราคาสูง-ต่ำ"}
