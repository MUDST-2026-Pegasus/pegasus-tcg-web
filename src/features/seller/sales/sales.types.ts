import type { CardCondition } from "@/features/catalog/catalog.types";
import type { PageResponse } from "@/lib/api";

/**
 * การลดราคาสินค้าของร้าน (TCG-682 · SAL-03 `/sellers/me/sales`) — ร้านออกเงินเอง
 * ตรงกับ `SellerSaleViews` / `SellerSaleRequest` ใน `pegasus-tcg-api` — แก้ DTO ฝั่งนั้นต้องตามมาแก้ที่นี่
 */

export type SellerSaleStatus = "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "SOLD_OUT" | "BUDGET_EXHAUSTED";
export type SellerSaleScope = "SHOP" | "CATEGORY" | "LISTINGS";
/** `FIXED_PRICE` = ราคาใหม่รายแถว (เฉพาะแบบเลือก listing) */
export type SellerSaleDiscountType = "PERCENT" | "FIXED_OFF" | "FIXED_PRICE";

/** แคมเปญ Pegasus ที่ครอบ listing นี้อยู่ด้วย (เตือนใน S2) */
export type SellerSalePlatformPrice = {
  saleId: number;
  name: string;
  slug: string | null;
  salePrice: number;
  startsAt: string;
  endsAt: string;
};

/** listing ของแบบเลือก listing (`items` ว่างสำหรับ SHOP / CATEGORY) */
export type SellerSaleItem = {
  listingId: number;
  productName: string;
  condition: CardCondition;
  listPrice: number;
  /** `null` = listing ไม่ได้ขายอยู่แล้ว */
  salePrice: number | null;
  platform: SellerSalePlatformPrice | null;
  /** ราคาที่ผู้ซื้อได้ระหว่างที่ทับกัน (เท่ากันให้ Pegasus) — `null` เมื่อไม่มีแคมเปญ Pegasus */
  winner: "THIS_SALE" | "PLATFORM" | null;
};

export type SellerSale = {
  id: number;
  name: string;
  slug: string | null;
  scopeType: SellerSaleScope;
  scopeIds: number[];
  discountType: SellerSaleDiscountType;
  /** % หรือบาทต่อชิ้น · `FIXED_PRICE` ไม่ใช้ */
  discountValue: number | null;
  maxDiscountPerUnit: number | null;
  conditions: CardCondition[];
  minUnitPrice: number | null;
  startsAt: string;
  endsAt: string;
  endedAt: string | null;
  status: SellerSaleStatus;
  pausedAt: string | null;
  /** Pegasus หยุด — ร้าน resume เองไม่ได้ (`SALE_PAUSED`) และ `pauseReason` บอกเหตุผล */
  pausedByPegasus: boolean;
  pauseReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** ชิ้นที่ขายด้วยราคานี้ (ทุกออเดอร์) — มากกว่า 0 = มีออเดอร์แล้ว */
  soldUnits: number;
  listingCount: number;
  items: SellerSaleItem[];
};

/** `GET /sellers/me/sales/{id}` — ตัวเดียวกับในรายการ */
export type SellerSaleDetail = SellerSale;

/** body ของ `POST/PUT /sellers/me/sales` */
export type SellerSaleInput = {
  name: string;
  startsAt: string;
  endsAt: string;
  scopeType: SellerSaleScope;
  scopeIds: number[];
  /** `null` / `FIXED_PRICE` เมื่อทุก item มีราคาของตัวเอง */
  discountType: SellerSaleDiscountType | null;
  /** SHOP / CATEGORY: % หรือบาท · LISTINGS ราคารายแถว: `null` */
  discountValue: number | null;
  /** item ที่ `salePrice = null` ใช้ส่วนลดทั้งแคมเปญ */
  items: { listingId: number; salePrice: number | null }[] | null;
};

export type SellerSalePage = {
  page: PageResponse<SellerSale>;
  statusCounts: Partial<Record<SellerSaleStatus, number>>;
};

/** `GET /sellers/me/sales/summary` */
export type SellerSaleSummary = {
  activeSales: number;
  listingsOnSale: number;
  /** ยอดที่ผู้ซื้อจ่ายด้วยราคาลดของร้าน (ออเดอร์จ่ายแล้ว 30 วัน) */
  saleSales30d: number;
  shopDiscount30d: number;
};

/** `GET /sellers/me/sales/platform-listings` (แบ่งหน้า) — listing ของร้านที่ขายด้วยราคาแคมเปญ Pegasus อยู่ตอนนี้ */
export type PlatformSaleListing = {
  listingId: number;
  productName: string;
  condition: CardCondition;
  listPrice: number;
  salePrice: number;
  saleId: number;
  saleName: string;
  saleSlug: string | null;
  endsAt: string;
  /** ขึ้นราคาไม่ได้ระหว่างแคมเปญ */
  priceLocked: boolean;
};

/** รายละเอียดของ 409 `SALE_OVERLAP` */
export type SaleOverlapDetails = { listingIds: number[]; saleName?: string };

/** รายละเอียดของ 409 `SALE_PRICE_LOCKED` */
export type SalePriceLockedDetails = {
  saleName?: string;
  ownerType?: "PLATFORM" | "SELLER";
  endsAt?: string;
  currentPrice?: number;
};
