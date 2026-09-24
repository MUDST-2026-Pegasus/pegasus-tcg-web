import { formatBaht } from "@/features/seller/shared/seller.format";
import { getErrorMessage, hasErrorCode } from "@/lib/api";

import type {
  CardCondition,
  ListingStatus,
  SellerListingSummary,
} from "./products.types";

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
  const grouped = Number(whole || "0").toLocaleString("en-US");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/** กำไรติดลบแสดงเป็น "−฿120" แทน "฿-120" */
export function formatSignedBaht(amount: number): string {
  return amount < 0 ? `−${formatBaht(-amount)}` : formatBaht(amount);
}

const bahtWithSatang = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** แสดงสตางค์เสมอ เช่น "฿1,028.00" — ใช้ตรงที่ดีไซน์ต้องการเทียบทศนิยม */
export function formatBahtWithSatang(amount: number): string {
  return `฿${bahtWithSatang.format(amount)}`;
}

/** ชื่อสถานะประกาศ — ใช้ทั้งชิปตัวกรอง badge ในตาราง และเมนูเปลี่ยนสถานะ */
export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  DRAFT: "ฉบับร่าง",
  ACTIVE: "พร้อมขาย",
  PAUSED: "พักการขาย",
  SOLD_OUT: "หมดสต็อก",
  DELISTED: "ปิดการขายแล้ว",
  BLOCKED: "ถูกระงับ",
};

/**
 * ข้อความ error ของการแก้ประกาศเป็นภาษาไทย — ข้อความจาก backend เป็นภาษาอังกฤษ
 * จึงแปลเองเฉพาะ code ที่รู้จัก ที่เหลือใช้ข้อความจาก backend
 */
export function listingErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "LISTING_HAS_RESERVATIONS")) {
    return "ยังมีการ์ดติดจองอยู่ในคำสั่งซื้อที่ยังไม่ปิด รอให้คำสั่งซื้อจบก่อน";
  }
  if (hasErrorCode(error, "LISTING_HAS_NO_STOCK")) {
    return "ยังไม่มีการ์ดบนประกาศนี้ เติมสต็อกก่อนเปิดขาย";
  }
  if (hasErrorCode(error, "LISTING_CLOSED")) {
    return "ประกาศนี้ปิดไปแล้ว แก้ไขไม่ได้";
  }
  if (hasErrorCode(error, "LISTING_STATUS_TRANSITION")) {
    return "ประกาศนี้เปลี่ยนเป็นสถานะนั้นไม่ได้ หรือเพิ่งถูกเปลี่ยนไปก่อนหน้า รายการจะอัปเดตให้เอง";
  }
  if (hasErrorCode(error, "LISTING_NOT_FOUND")) {
    return "ไม่พบประกาศนี้แล้ว อาจถูกลบไปก่อนหน้า";
  }
  if (hasErrorCode(error, "VARIANT_INACTIVE")) {
    return "การ์ดพิมพ์นี้ถูกปิดในแคตตาล็อกแล้ว เปิดขายใหม่ไม่ได้";
  }
  if (hasErrorCode(error, "SELLER_NOT_VERIFIED")) {
    return "ร้านยังไม่ผ่านการยืนยัน จึงแก้ประกาศไม่ได้";
  }
  return getErrorMessage(error, fallback);
}
