import type { SaleType } from "@/components/sale";
import type { CardCondition, PublicListingDto } from "@/features/catalog/catalog.types";
import type { PageResponse } from "@/lib/api";

/**
 * ฝั่งผู้ซื้อของการลดราคาโดยตรง (TCG-683 · SAL-04 `/sales`, `/sales/{slug}`, `/sales/featured`, `/search?onSale=true`)
 * ตรงกับ `BuyerSaleViews` ใน `pegasus-tcg-api` — แก้ DTO ฝั่งนั้นต้องตามมาแก้ที่นี่
 * ผู้ซื้อไม่เห็นว่าใครออกเงินส่วนลด
 */

export type PublicSaleStatus = "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "SOLD_OUT" | "BUDGET_EXHAUSTED";

/** หัวแคมเปญ (`SaleHeader`) — แท็บหน้า SALE / hero / แบนเนอร์หน้าแรก */
export type PublicSale = {
  id: number;
  /** `null` = การลดราคาของร้าน (ไม่มีหน้า /sale/{slug}) */
  slug: string | null;
  name: string;
  type: SaleType;
  /** Flash ที่ใกล้เริ่มเป็น `SCHEDULED` · จบแล้ว `ENDED` */
  status: PublicSaleStatus;
  discountType: "PERCENT" | "FIXED_OFF" | "FIXED_PRICE";
  discountValue: number | null;
  maxDiscountPerUnit: number | null;
  perListingQuota: number | null;
  perBuyerLimit: number | null;
  bannerImageUrl: string | null;
  startsAt: string;
  endsAt: string;
  /** ร้านที่ลดเอง — `null` = แคมเปญ Pegasus */
  shop: { username: string; displayName: string | null } | null;
  /** listing ที่ขายด้วยราคานี้ตอนนี้ */
  listingCount: number;
};

/** การ์ด Flash ที่ขายครบโควตาแล้ว — `listing.pricing` คือราคาตอนนี้ · `flashPrice` คือราคาตอน Flash */
export type SoldOutFlashCard = {
  listing: PublicListingDto;
  flashPrice: number;
  discountPercent: number;
};

/** `GET /sales/featured` */
export type FeaturedSales = {
  /** Flash Sale บนหน้าแรก + การ์ดสูงสุด 12 ใบ (ที่ยังขาย + ที่หมดโควตา) — `null` เมื่อไม่มี */
  flashSale: { sale: PublicSale; listings: PublicListingDto[]; soldOut: SoldOutFlashCard[] } | null;
  /** แบนเนอร์แคมเปญ Pegasus ที่ featured */
  categorySales: PublicSale[];
};

/** `GET /sales/{slug}` — แคมเปญจบแล้วไม่มี listing */
export type SaleDetail = {
  sale: PublicSale;
  listings: PageResponse<PublicListingDto>;
};

export type SaleSort = "discount_desc" | "price_asc" | "ending_soon";

/** filter เดียวกับ `GET /listings` (ตลาด) */
export type SaleListingQuery = {
  gameId?: number;
  condition?: CardCondition;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: SaleSort;
  page?: number;
  size?: number;
};
