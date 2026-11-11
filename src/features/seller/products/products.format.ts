import { formatBaht } from "@/features/seller/shared/seller.format";
import { hasErrorCode } from "@/lib/api";

import type {
  CardCondition,
  ListingSort,
  ListingStatus,
  SellerListingSummary,
} from "./products.types";
import { translateError, translate, formatMoney } from "@/lib/i18n";

/**
 * ตัวช่วยเรื่องตัวเลขที่ใช้ร่วมกันในหน้าลงขายสินค้าและหน้าเติมสต็อก
 */

/** `CardCondition` → ชื่อเต็มที่ผู้ขายการ์ดคุ้นกัน */
export const CONDITION_LABEL: Record<CardCondition, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
  SEALED: "Sealed",
};

/** "EN / FOIL / UNLIMITED · Near Mint · LOT-04" — บรรทัดรองใต้ชื่อการ์ด */
export function listingMeta(listing: SellerListingSummary): string {
  return [
    listing.card.variantLabel,
    CONDITION_LABEL[listing.condition],
    listing.lotLabel,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** `:productId` ใน URL → รหัสประกาศ · พิมพ์มั่วหรือไม่ใช่ตัวเลขบวก → null */
export function parseListingId(param: string | undefined): number | null {
  const id = Number(param);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** "1290" / "1290.5" → ตัวเลข · ช่องว่างหรือพิมพ์ไม่ครบ (".") → null */
export function toNumber(value: string): number | null {
  if (value === "" || value === ".") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** ปัดเป็นสตางค์ กันเลขทศนิยมลอยอย่าง 64.50000000000001 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * เก็บเฉพาะตัวเลข (และจุดทศนิยมไม่เกิน 2 ตำแหน่งถ้าอนุญาต) จากสิ่งที่ผู้ใช้พิมพ์/วาง
 * ตัด 0 นำหน้าทิ้ง ("007" → "7") ให้ตรงกับที่ช่องแสดง
 */
export function sanitizeNumberInput(
  value: string,
  allowDecimal: boolean,
): string {
  const stripLeadingZeros = (digits: string) => digits.replace(/^0+(?=\d)/, "");

  if (!allowDecimal) return stripLeadingZeros(value.replace(/\D/g, ""));

  const [whole, ...fraction] = value.replace(/[^\d.]/g, "").split(".");
  return fraction.length > 0
    ? `${stripLeadingZeros(whole)}.${fraction.join("").slice(0, 2)}`
    : stripLeadingZeros(whole);
}

/** "1290" → "1,290" · "1290." → "1,290." (เก็บจุดที่กำลังพิมพ์ไว้) */
export function groupThousands(value: string): string {
  if (value === "") return value;

  const [whole, fraction] = value.split(".");
  // ไม่ขึ้นกับภาษา: จัดรูปตัวเลขในช่อง input ต้องคงที่ ("1,290") ไม่งั้น parse กลับไม่ได้
  const grouped = Number(whole || "0").toLocaleString("en-US");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/** กำไรติดลบแสดงเป็น "−THB 120.00" */
export function formatSignedBaht(amount: number): string {
  return amount < 0 ? `−${formatBaht(-amount)}` : formatBaht(amount);
}

/** "THB 1,028.00" */
export function formatBahtWithSatang(amount: number): string {
  return formatMoney(amount);
}

/** ชื่อสถานะประกาศ — ใช้ทั้งชิปตัวกรอง badge ในตาราง และเมนูเปลี่ยนสถานะ */
export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  get DRAFT() { return translate("seller", "products.status.DRAFT", "ฉบับร่าง"); },
  get ACTIVE() { return translate("seller", "products.status.ACTIVE", "พร้อมขาย"); },
  get PAUSED() { return translate("seller", "products.status.PAUSED", "พักการขาย"); },
  get SOLD_OUT() { return translate("seller", "products.status.SOLD_OUT", "หมดสต็อก"); },
  get DELISTED() { return translate("seller", "products.status.DELISTED", "ปิดการขายแล้ว"); },
  get BLOCKED() { return translate("seller", "products.status.BLOCKED", "ถูกระงับ"); },
};

/** สีของ badge สถานะ — ใช้ทั้งฝั่งผู้ขายและหน้าแคตตาล็อกของแอดมิน */
export const LISTING_STATUS_BADGE: Record<ListingStatus, string> = {
  ACTIVE: "bg-[#e3f4ec] text-[#12805c]",
  SOLD_OUT: "bg-[#fbe9e8] text-[#d0342c]",
  PAUSED: "bg-[#fdf0dd] text-[#b45309]",
  DRAFT: "bg-muted text-[#6b7280]",
  DELISTED: "bg-secondary text-zinc-500",
  BLOCKED: "bg-rose-100 text-rose-700",
};

/** ตัวเลือกการเรียงในแถบตัวกรอง — ตัวแรกคือค่าเริ่มต้นของ backend */
export const LISTING_SORTS: ListingSort[] = [
  "updated",
  "newest",
  "price_asc",
  "price_desc",
  "stock_asc",
  "stock_desc",
  "name",
];

export const LISTING_SORT_LABEL: Record<ListingSort, string> = {
  get updated() { return translate("seller", "products.sort.updated", "แก้ไขล่าสุด"); },
  get newest() { return translate("seller", "products.sort.newest", "สร้างล่าสุด"); },
  get price_asc() { return translate("seller", "products.sort.price_asc", "ราคาต่ำ → สูง"); },
  get price_desc() { return translate("seller", "products.sort.price_desc", "ราคาสูง → ต่ำ"); },
  // คงเหลือ = quantityAvailable ใบที่ขายได้ตอนนี้ — เรียงน้อยก่อนเพื่อหาของที่ต้องเติม
  get stock_asc() { return translate("seller", "products.sort.stock_asc", "คงเหลือน้อย → มาก"); },
  get stock_desc() { return translate("seller", "products.sort.stock_desc", "คงเหลือมาก → น้อย"); },
  get name() { return translate("seller", "products.sort.name", "ชื่อการ์ด A → Z"); },
};

/**
 * ข้อความ error ของการแก้ประกาศเป็นภาษาไทย — ข้อความจาก backend เป็นภาษาอังกฤษ
 * จึงแปลเองเฉพาะ code ที่รู้จัก ที่เหลือใช้ข้อความจาก backend
 */
export function listingErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "LISTING_HAS_RESERVATIONS")) {
    return translate("seller", "products.errors.reserved", "ยังมีการ์ดติดจองอยู่ในคำสั่งซื้อที่ยังไม่ปิด รอให้คำสั่งซื้อจบก่อน");
  }
  if (hasErrorCode(error, "LISTING_HAS_NO_STOCK")) {
    return translate("seller", "products.errors.noStock", "ยังไม่มีการ์ดบนประกาศนี้ เติมสต็อกก่อนเปิดขาย");
  }
  if (hasErrorCode(error, "LISTING_CLOSED")) {
    return translate("seller", "products.errors.closed", "ประกาศนี้ปิดไปแล้ว แก้ไขไม่ได้");
  }
  if (hasErrorCode(error, "LISTING_STATUS_TRANSITION")) {
    return translate("seller", "products.errors.transition", "ประกาศนี้เปลี่ยนเป็นสถานะนั้นไม่ได้ หรือเพิ่งถูกเปลี่ยนไปก่อนหน้า รายการจะอัปเดตให้เอง");
  }
  if (hasErrorCode(error, "LISTING_NOT_FOUND")) {
    return translate("seller", "products.errors.notFound", "ไม่พบประกาศนี้แล้ว อาจถูกลบไปก่อนหน้า");
  }
  if (hasErrorCode(error, "VARIANT_INACTIVE")) {
    return translate("seller", "products.errors.variantInactive", "การ์ดพิมพ์นี้ถูกปิดในแคตตาล็อกแล้ว เปิดขายใหม่ไม่ได้");
  }
  if (hasErrorCode(error, "SELLER_NOT_VERIFIED")) {
    return translate("seller", "products.errors.notVerified", "ร้านยังไม่ผ่านการยืนยัน จึงแก้ประกาศไม่ได้");
  }
  return translateError(error, fallback);
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-555]
// @tolgee-key {"key": "products.status.DRAFT", "ns": "seller", "defaultValue": "ฉบับร่าง"}
// @tolgee-key {"key": "products.status.ACTIVE", "ns": "seller", "defaultValue": "พร้อมขาย"}
// @tolgee-key {"key": "products.status.PAUSED", "ns": "seller", "defaultValue": "พักการขาย"}
// @tolgee-key {"key": "products.status.SOLD_OUT", "ns": "seller", "defaultValue": "หมดสต็อก"}
// @tolgee-key {"key": "products.status.DELISTED", "ns": "seller", "defaultValue": "ปิดการขายแล้ว"}
// @tolgee-key {"key": "products.status.BLOCKED", "ns": "seller", "defaultValue": "ถูกระงับ"}
// @tolgee-key {"key": "products.sort.updated", "ns": "seller", "defaultValue": "แก้ไขล่าสุด"}
// @tolgee-key {"key": "products.sort.newest", "ns": "seller", "defaultValue": "สร้างล่าสุด"}
// @tolgee-key {"key": "products.sort.price_asc", "ns": "seller", "defaultValue": "ราคาต่ำ → สูง"}
// @tolgee-key {"key": "products.sort.price_desc", "ns": "seller", "defaultValue": "ราคาสูง → ต่ำ"}
// @tolgee-key {"key": "products.sort.stock_asc", "ns": "seller", "defaultValue": "คงเหลือน้อย → มาก"}
// @tolgee-key {"key": "products.sort.stock_desc", "ns": "seller", "defaultValue": "คงเหลือมาก → น้อย"}
// @tolgee-key {"key": "products.sort.name", "ns": "seller", "defaultValue": "ชื่อการ์ด A → Z"}
// @tolgee-key {"key": "products.errors.reserved", "ns": "seller", "defaultValue": "ยังมีการ์ดติดจองอยู่ในคำสั่งซื้อที่ยังไม่ปิด รอให้คำสั่งซื้อจบก่อน"}
// @tolgee-key {"key": "products.errors.noStock", "ns": "seller", "defaultValue": "ยังไม่มีการ์ดบนประกาศนี้ เติมสต็อกก่อนเปิดขาย"}
// @tolgee-key {"key": "products.errors.closed", "ns": "seller", "defaultValue": "ประกาศนี้ปิดไปแล้ว แก้ไขไม่ได้"}
// @tolgee-key {"key": "products.errors.transition", "ns": "seller", "defaultValue": "ประกาศนี้เปลี่ยนเป็นสถานะนั้นไม่ได้ หรือเพิ่งถูกเปลี่ยนไปก่อนหน้า รายการจะอัปเดตให้เอง"}
// @tolgee-key {"key": "products.errors.notFound", "ns": "seller", "defaultValue": "ไม่พบประกาศนี้แล้ว อาจถูกลบไปก่อนหน้า"}
// @tolgee-key {"key": "products.errors.variantInactive", "ns": "seller", "defaultValue": "การ์ดพิมพ์นี้ถูกปิดในแคตตาล็อกแล้ว เปิดขายใหม่ไม่ได้"}
// @tolgee-key {"key": "products.errors.notVerified", "ns": "seller", "defaultValue": "ร้านยังไม่ผ่านการยืนยัน จึงแก้ประกาศไม่ได้"}
