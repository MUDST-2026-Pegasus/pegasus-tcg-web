/**
 * ราคาที่มีผลของ listing (TCG-675 · SAL-04) — `pricing` ที่ backend แนบมากับ listing, ผลค้นหา,
 * หน้าร้าน และแถวในตะกร้า · FE แสดงตามนี้อย่างเดียว ห้ามคิดราคาลดเอง
 *
 * ลอกจาก Jira SAL-04 (TCG-679) — ถ้า DTO ฝั่ง `pegasus-tcg-api` เปลี่ยน ต้องตามมาแก้ที่นี่
 */

export type SaleType = "FLASH_SALE" | "CATEGORY_SALE" | "SHOP_SALE";

/** แคมเปญที่ให้ราคานี้ — ผู้ซื้อไม่เห็นว่าใครออกเงิน */
export type PricingSale = {
  id: number;
  /** `null` สำหรับการลดราคาของร้าน (ไม่มีหน้า /sale/{slug}) */
  slug: string | null;
  name: string;
  type: SaleType;
  endsAt: string;
  /** โควตาราคา Flash ที่เหลือของ listing นี้ — `null` = ไม่จำกัด */
  quotaLeft: number | null;
  /** ซื้อที่ราคานี้ได้กี่ชิ้นต่อคน — `null` = ไม่จำกัด */
  perBuyerLimit: number | null;
};

export type ListingPricing = {
  /** ราคาตั้งต้น (= `listing.price`) แสดงเป็นราคาขีดฆ่า */
  listPrice: number;
  /** ราคาที่ผู้ซื้อจ่าย — เท่ากับ `listPrice` เมื่อไม่มีการลด */
  salePrice: number;
  /** `null` เมื่อไม่มีการลด */
  discountPercent: number | null;
  sale: PricingSale | null;
};

/** ใครออกเงินส่วนลด — เห็นเฉพาะฝั่งผู้ขายและแอดมิน */
export type SaleFundedBy = "PLATFORM" | "SELLER";

/**
 * ราคาลดของแถวในออเดอร์ (SAL-05 · snapshot ตอน checkout) — ฝั่งผู้ขาย/แอดมินเห็นว่าใครออกเงิน
 * API เก่าไม่ส่งมา = ไม่มีราคาลด
 */
export type OrderItemSale = {
  /** ราคาตั้งต้นต่อชิ้น */
  listPrice?: number | null;
  /** ส่วนลดราคาสินค้ารวมของแถว แยกตามผู้ออกเงิน */
  saleDiscount?: { platform: number; seller: number } | null;
  /** ชื่อแคมเปญ/การลดราคา ณ ตอนสั่ง */
  saleName?: string | null;
};
