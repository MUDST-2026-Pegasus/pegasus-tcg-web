import type { ListingStatus, SellerListingSummary } from "./products.types";

/**
 * ผู้ขายย้ายประกาศจากสถานะหนึ่งไปไหนได้บ้าง — ลอกจาก `ListingStatus.sellerTargets()`
 * SOLD_OUT กับ BLOCKED ไม่อยู่ในปลายทาง เพราะไม่มีใครขอได้ มันเกิดเอง
 * ถ้า backend แก้กติกา ตรงนี้ต้องแก้ตาม ไม่งั้นเมนูจะเสนอทางที่ถูกปฏิเสธ
 */
const SELLER_TARGETS: Record<ListingStatus, ListingStatus[]> = {
  DRAFT: ["ACTIVE", "DELISTED"],
  PAUSED: ["ACTIVE", "DELISTED"],
  ACTIVE: ["PAUSED", "DELISTED"],
  SOLD_OUT: ["PAUSED", "DELISTED"],
  DELISTED: [],
  BLOCKED: [],
};

export function statusTargets(listing: SellerListingSummary): ListingStatus[] {
  return SELLER_TARGETS[listing.status];
}

export function canMoveTo(
  listing: SellerListingSummary,
  target: ListingStatus,
): boolean {
  return SELLER_TARGETS[listing.status].includes(target);
}

/**
 * นิยาม "ใกล้หมด" ของหน้าจัดการสินค้า
 *
 * ใกล้หมด = ประกาศ ACTIVE ที่เหลือการ์ดพร้อมขาย (`quantityAvailable`) 1 ถึง 2 ใบ
 *
 * - เป็นเรื่องจำนวนคงเหลือ ไม่ใช่สถานะ — `ListingStatus` ไม่มีค่านี้ จึงไม่มีชิปตัวกรอง
 *   และ backend กรองด้วยจำนวนไม่ได้ ตารางจึงเตือนเป็นรายแถวแทน
 * - นับเฉพาะ ACTIVE เพราะเป็นสถานะเดียวที่ผู้ซื้อกำลังซื้ออยู่ พอเหลือ 0 ฐานข้อมูลเปลี่ยน
 *   เป็น SOLD_OUT ให้เอง (`refresh_listing_quantities`) ซึ่งมีชิปของตัวเองแล้ว
 * - นับ `quantityAvailable` ไม่ใช่ `quantityTotal` — ใบที่ติดจองขายซ้ำไม่ได้
 * - เกณฑ์ 2 ใบตรงกับการ์ด "สต็อกใกล้หมด" ในดีไซน์แดชบอร์ด ("เหลือน้อยกว่า 3 ใบ")
 *   ถ้า SLR-07 กำหนดเกณฑ์ที่ backend ให้เปลี่ยนมาใช้ค่านั้นแทนค่าคงที่นี้
 */
export const LOW_STOCK_THRESHOLD = 2;

export function isLowStock(listing: SellerListingSummary): boolean {
  return (
    listing.status === "ACTIVE" &&
    listing.quantityAvailable > 0 &&
    listing.quantityAvailable <= LOW_STOCK_THRESHOLD
  );
}

/**
 * ลบได้ไหม และถ้าไม่ได้ ทำไม — ตรงกับที่ `ListingService.delete` ปฏิเสธ
 * `null` = ลบได้
 */
export function deleteBlockedReason(
  listing: SellerListingSummary,
): string | null {
  if (listing.status === "BLOCKED") {
    return "ประกาศที่แอดมินระงับไว้ลบไม่ได้";
  }
  if (listing.quantityReserved > 0) {
    return `มีการ์ดติดจอง ${listing.quantityReserved} ใบในคำสั่งซื้อที่ยังไม่ปิด ลบได้หลังคำสั่งซื้อจบ`;
  }
  return null;
}

/** แก้ราคาได้ไหม — ตรงกับ `ListingStatus.open()` ประกาศที่ปิดแล้วคงราคาที่ปิดไว้ */
export function isPriceEditable(listing: SellerListingSummary): boolean {
  return listing.status !== "DELISTED" && listing.status !== "BLOCKED";
}

/**
 * เปิดขาย (→ ACTIVE) ได้ไหม และถ้าไม่ได้ ทำไม — ตรงกับที่ `ListingService.publish` ปฏิเสธ
 * ร่างที่ไม่มีการ์ดเปิดขายไม่ได้ ส่วน PAUSED ที่ไม่เหลือการ์ด backend ย้ายไป SOLD_OUT ให้แทน
 */
export function activateBlockedReason(
  listing: SellerListingSummary,
): string | null {
  if (!listing.card.variantActive) {
    return "การ์ดพิมพ์นี้ถูกปิดในแคตตาล็อกแล้ว";
  }
  if (listing.status === "DRAFT" && listing.quantityAvailable === 0) {
    return "ยังไม่มีการ์ดบนประกาศ เติมสต็อกก่อน";
  }
  return null;
}
