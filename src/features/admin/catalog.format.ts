import type { ProductCardData } from "@/components/common";
import { getErrorMessage, hasErrorCode } from "@/lib/api";

import type { ProductSort, ProductSummary, ProductType } from "./catalog.types";

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
  SINGLE_CARD: "การ์ดเดี่ยว",
  BOOSTER_PACK: "ซองสุ่ม",
  BOOSTER_BOX: "กล่องสุ่ม",
  ELITE_TRAINER_BOX: "Elite Trainer Box",
  STARTER_DECK: "เด็คเริ่มต้น",
  BUNDLE: "ชุดรวม",
  ACCESSORY: "อุปกรณ์เสริม",
  OTHER: "อื่น ๆ",
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
  newest: "เพิ่มล่าสุด",
  name: "ชื่อ A-Z",
  cardNumber: "เลขในชุด",
  popular: "ยอดนิยม",
  price_asc: "ราคาต่ำ-สูง",
  price_desc: "ราคาสูง-ต่ำ",
};

const NUMBER = new Intl.NumberFormat("th-TH");
const BAHT = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 2,
});

/** 18940 → "18,940" */
export function formatCount(value: number): string {
  return NUMBER.format(value);
}

/** 1290 → "฿1,290" */
export function formatBaht(amount: number): string {
  return BAHT.format(amount);
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
        ? "ยังไม่มีคนขาย"
        : formatBaht(product.lowestPrice),
    image: product.primaryImageUrl ?? undefined,
    imageAlt: product.name,
  };
}

/** error จาก endpoint แคตตาล็อก → ข้อความภาษาไทย ตัวที่ไม่รู้จักใช้ข้อความจาก backend */
export function catalogErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "PRODUCT_NOT_FOUND")) {
    return "ไม่พบสินค้านี้ในแคตตาล็อก";
  }
  if (hasErrorCode(error, "VARIANT_NOT_FOUND")) {
    return "ไม่พบ variant นี้แล้ว ลองโหลดสินค้าใหม่";
  }
  if (hasErrorCode(error, "IMAGE_NOT_FOUND")) {
    return "รูปนี้ถูกลบไปแล้ว";
  }
  if (hasErrorCode(error, "CATEGORY_NOT_FOUND")) {
    return "ไม่พบหมวดหมู่ที่เลือก";
  }
  if (hasErrorCode(error, "CARD_SET_NOT_FOUND")) {
    return "ไม่พบชุดที่เลือก";
  }
  if (hasErrorCode(error, "GAME_NOT_FOUND")) {
    return "ไม่พบเกมนี้";
  }
  if (hasErrorCode(error, "SKU_ALREADY_USED")) {
    return "SKU นี้มี variant อื่นใช้อยู่แล้ว";
  }
  if (hasErrorCode(error, "VARIANT_ALREADY_EXISTS")) {
    return "สินค้านี้มี variant ภาษา / finish / edition / หมายเหตุการพิมพ์ นี้อยู่แล้ว";
  }
  if (hasErrorCode(error, "IMAGE_KEY_IN_USE")) {
    return "ไฟล์นี้ถูกแนบกับรูปอื่นไปแล้ว อัปโหลดใหม่อีกครั้งถ้าจะใช้ซ้ำ";
  }
  if (hasErrorCode(error, "FILE_NOT_FOUND")) {
    return "ไฟล์ยังอัปโหลดไม่เสร็จหรือหายไปแล้ว ลองอัปใหม่";
  }
  if (hasErrorCode(error, "ACCESS_DENIED")) {
    return "บัญชีนี้ไม่มีสิทธิ์แก้แคตตาล็อก";
  }
  return getErrorMessage(error, fallback);
}
