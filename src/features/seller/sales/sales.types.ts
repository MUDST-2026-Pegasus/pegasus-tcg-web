import type { SaleType } from "@/components/sale";
import type { PageResponse } from "@/lib/api";

/**
 * การลดราคาสินค้าของร้าน (TCG-682 · SAL-03 `/sellers/me/sales`) — ร้านออกเงินเอง
 * ลอกตามสัญญา API ใน Jira SAL-03 (TCG-678) — ถ้า DTO ฝั่ง `pegasus-tcg-api` ต่างไป ต้องตามมาแก้ที่นี่
 */

export type SellerSaleStatus = "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "SOLD_OUT" | "BUDGET_EXHAUSTED";
export type SellerSaleScope = "SHOP" | "CATEGORY" | "LISTINGS";
/** `FIXED_PRICE` = ราคาใหม่รายแถว (เฉพาะแบบเลือก listing) */
export type SellerSaleDiscountType = "PERCENT" | "FIXED_OFF" | "FIXED_PRICE";

export type SellerSaleItem = { listingId: number; salePrice: number };

export type SellerSale = {
  id: number;
  name: string;
  saleType: Extract<SaleType, "SHOP_SALE">;
  discountType: SellerSaleDiscountType;
  /** % หรือบาทต่อชิ้น · `FIXED_PRICE` = 0 */
  discountValue: number;
  /** ช่วง % ของราคารายแถว เช่น 12–35 */
  minDiscountPercent: number | null;
  maxDiscountPercent: number | null;
  scopeType: SellerSaleScope;
  scopeIds: number[];
  /** ชื่อหมวดของขอบเขต CATEGORY (แสดงในตาราง) */
  scopeNames: string[];
  listingCount: number;
  soldUnits: number;
  orderCount: number;
  startsAt: string;
  endsAt: string;
  status: SellerSaleStatus;
  pausedAt: string | null;
  /** แอดมินหยุด — ร้าน resume เองไม่ได้ (`SALE_PAUSED`) */
  pausedByAdmin: boolean;
  pauseReason: string | null;
};

/** `GET /sellers/me/sales/{id}` — มีราคารายแถวสำหรับแบบเลือก listing */
export type SellerSaleDetail = SellerSale & { items: SellerSaleItem[] };

/** body ของ `POST/PUT /sellers/me/sales` */
export type SellerSaleInput = {
  name: string;
  startsAt: string;
  endsAt: string;
  scopeType: SellerSaleScope;
  scopeIds: number[];
  discountType: SellerSaleDiscountType;
  /** SHOP / CATEGORY: % หรือบาท · LISTINGS: `null` (ราคาอยู่ใน `items`) */
  discountValue: number | null;
  items: SellerSaleItem[] | null;
};

export type SellerSalePage = {
  page: PageResponse<SellerSale>;
  statusCounts: Partial<Record<SellerSaleStatus, number>>;
};

/** `GET /sellers/me/sales/summary` */
export type SellerSaleSummary = {
  activeSales: number;
  scheduledSales: number;
  listingsOnSale: number;
  totalListings: number;
  saleRevenue30d: number;
  saleUnits30d: number;
  shopDiscount30d: number;
};

/** `GET /sellers/me/sales/platform-listings` — listing ของร้านที่อยู่ในแคมเปญ Pegasus */
export type PlatformSaleListing = {
  listingId: number;
  productName: string;
  conditionLabel: string;
  saleId: number;
  saleName: string;
  saleType: SaleType;
  listPrice: number;
  salePrice: number;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  status: SellerSaleStatus;
  soldUnits: number;
  quota: number | null;
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
