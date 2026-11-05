import type { SaleType } from "@/components/sale";
import type { CardCondition } from "@/features/catalog/catalog.types";
import type { PageResponse } from "@/lib/api";

import type { PromotionParty } from "./promotions.types";

/**
 * แคมเปญลดราคาฝั่งแอดมิน (TCG-675 · SAL-02 `/admin/sales`)
 * ลอกตามสัญญา API ใน Jira SAL-01/SAL-02 (TCG-676/677) — ถ้า DTO ฝั่ง `pegasus-tcg-api` ต่างไป ต้องตามมาแก้ที่นี่
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
  /** ร้านเจ้าของ — `null` สำหรับแคมเปญ Pegasus */
  seller: PromotionParty | null;
  saleType: SaleType;
  discountType: SaleDiscountType;
  /** % หรือบาทต่อชิ้น · `FIXED_PRICE` = 0 (ราคาอยู่รายแถว) */
  discountValue: number;
  /** เพดานบาทต่อชิ้น (PERCENT) — `null` = ไม่จำกัด */
  maxDiscountPerUnit: number | null;
  /** ช่วง % ของร้านที่ตั้งราคารายแถว เช่น 12–35 */
  minDiscountPercent: number | null;
  maxDiscountPercent: number | null;
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
  subsidyReserved: number;
  soldUnits: number;
  listingCount: number;
  /** ออเดอร์ที่ใช้ราคานี้ — มากกว่า 0 = ล็อกฟิลด์และลบไม่ได้ */
  orderCount: number;
  bannerImageUrl: string | null;
  featuredOnHome: boolean;
  homeSort: number | null;
  showOnSalePage: boolean;
  startsAt: string;
  endsAt: string;
  status: SaleStatus;
  pausedAt: string | null;
  pauseReason: string | null;
  /** หยุดโดยแอดมิน (การลดราคาของร้าน) — ร้าน resume เองไม่ได้ */
  pausedByAdmin: boolean;
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
  /** object key จาก `useFileUpload` — `null` = ไม่มี/คงรูปเดิม */
  bannerImageKey: string | null;
  featuredOnHome: boolean;
  homeSort: number | null;
  showOnSalePage: boolean;
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
  sellersOnSale: number;
  saleRevenue30d: number;
  /** `null` เมื่อเดือนก่อนยังไม่มียอด */
  saleRevenueChangePercent: number | null;
  saleSubsidy30d: number;
};

/** body ของ `POST /admin/sales/preview-scope` */
export type SaleScopePreviewInput = Pick<
  AdminSaleInput,
  "scopeType" | "scopeIds" | "conditions" | "minUnitPrice" | "excludedSellerIds"
>;

export type SaleScopePreview = {
  listingCount: number;
  sellerCount: number;
  /** ราคารวมก่อนลดของ listing ที่เข้าเงื่อนไข */
  totalListPrice: number;
};

/** ร้านในช่อง "ยกเว้นร้าน" */
export type SaleSellerOption = { id: number; username: string; displayName: string | null };
