import type { SaleType } from "@/components/sale";
import type { CardCondition } from "@/features/catalog/catalog.types";
import type { PageResponse } from "@/lib/api";

import type { PromotionParty } from "./promotions.types";

/**
 * แคมเปญลดราคาฝั่งแอดมิน (TCG-675 · SAL-02 `/admin/sales`)
 * ตรงกับ `AdminSaleViews` / `AdminSaleRequest` ใน `pegasus-tcg-api` — แก้ DTO ฝั่งนั้นต้องตามมาแก้ที่นี่
 */

export type { SaleType };
export type SaleOwnerType = "PLATFORM" | "SELLER";
/** คำนวณที่ server จากเวลา / หยุด / โควตา / งบ */
export type SaleStatus = "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "SOLD_OUT" | "BUDGET_EXHAUSTED";
/** `FIXED_PRICE` ใช้ได้เฉพาะร้านแบบเลือก listing */
export type SaleDiscountType = "PERCENT" | "FIXED_OFF" | "FIXED_PRICE";
export type SaleScopeType = "ALL" | "GAME" | "CATEGORY" | "CARD_SET" | "SHOP" | "LISTINGS";

export type AdminSale = {
  id: number;
  name: string;
  /** ลิงก์ /sale/{slug} — `null` สำหรับการลดราคาของร้าน */
  slug: string | null;
  ownerType: SaleOwnerType;
  /** ร้านเจ้าของ (id = seller profile) — `null` สำหรับแคมเปญ Pegasus */
  owner: PromotionParty | null;
  saleType: SaleType;
  discountType: SaleDiscountType;
  /** % หรือบาทต่อชิ้น · `FIXED_PRICE` ราคาอยู่รายแถว */
  discountValue: number | null;
  /** เพดานบาทต่อชิ้น (PERCENT) — `null` = ไม่จำกัด */
  maxDiscountPerUnit: number | null;
  scopeType: SaleScopeType;
  scopeIds: number[];
  /** ว่าง = ทุกสภาพ */
  conditions: CardCondition[];
  minUnitPrice: number | null;
  excludedSellerIds: number[];
  /** Flash: โควตาชิ้นต่อ listing */
  perListingQuota: number | null;
  /** Flash: จำกัดชิ้นต่อผู้ซื้อต่อ listing */
  perBuyerLimit: number | null;
  /** งบอุดหนุน — `null` = ไม่จำกัด (แคมเปญร้านเป็น `null` เสมอ) */
  budgetCap: number | null;
  /** ยอดอุดหนุนที่จอง/ใช้แล้ว */
  subsidyReserved: number | null;
  /** ชิ้นที่ขายด้วยราคานี้ (ทุกออเดอร์) — มากกว่า 0 = มีออเดอร์แล้ว: ล็อกฟิลด์และลบไม่ได้ */
  soldUnits: number;
  listingCount: number;
  bannerImageUrl: string | null;
  featuredOnHome: boolean;
  homeSort: number | null;
  startsAt: string;
  endsAt: string;
  status: SaleStatus;
  pausedAt: string | null;
  pauseReason: string | null;
  /** คนที่หยุด — `null` ถ้าไม่ได้หยุด */
  pausedBy: PromotionParty | null;
  createdBy: PromotionParty | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** body ของ `POST/PUT /admin/sales` */
export type AdminSaleInput = {
  name: string;
  slug: string;
  saleType: Exclude<SaleType, "SHOP_SALE">;
  discountType: Exclude<SaleDiscountType, "FIXED_PRICE">;
  discountValue: number | null;
  maxDiscountPerUnit: number | null;
  scopeType: Exclude<SaleScopeType, "SHOP" | "LISTINGS">;
  scopeIds: number[];
  conditions: CardCondition[];
  minUnitPrice: number | null;
  excludedSellerIds: number[];
  perListingQuota: number | null;
  perBuyerLimit: number | null;
  budgetCap: number | null;
  /** URL รูปแบนเนอร์ — `null` = ไม่มี */
  bannerImageUrl: string | null;
  featuredOnHome: boolean;
  homeSort: number | null;
  startsAt: string;
  endsAt: string;
};

export type AdminSaleQuery = {
  owner?: SaleOwnerType;
  type?: SaleType;
  status?: SaleStatus;
  q?: string;
  page: number;
  size: number;
};

export type AdminSalePage = {
  page: PageResponse<AdminSale>;
  statusCounts: Partial<Record<SaleStatus, number>>;
};

/** `GET /admin/sales/summary` */
export type AdminSaleSummary = {
  activePlatformSales: number;
  activeSellerSales: number;
  listingsOnSale: number;
  /** ยอดที่ผู้ซื้อจ่ายด้วยราคาลด (ออเดอร์จ่ายแล้ว 30 วัน) */
  saleSales30d: number;
  saleSubsidy30d: number;
};

/** body ของ `POST /admin/sales/preview-scope` */
export type SaleScopePreviewInput = Pick<
  AdminSaleInput,
  "scopeType" | "scopeIds" | "conditions" | "minUnitPrice" | "excludedSellerIds"
>;

export type SaleScopePreview = {
  listingCount: number;
  shopCount: number;
  /** ราคารวมก่อนลดของ listing ที่เข้าเงื่อนไข */
  listTotal: number;
};

/** ร้านในช่อง "ยกเว้นร้าน" */
export type SaleSellerOption = { id: number; username: string; displayName: string | null };
