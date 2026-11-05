import type { SaleType } from "@/components/sale";
import type { CardCondition, PublicListingDto } from "@/features/catalog/catalog.types";
import type { PageResponse } from "@/lib/api";

/**
 * ฝั่งผู้ซื้อของการลดราคาโดยตรง (TCG-683 · SAL-04 `/sales`, `/sales/{slug}`, `/sales/featured`, `/search?onSale=true`)
 * ลอกตามสัญญา API ใน Jira SAL-04 (TCG-679) — ถ้า DTO ฝั่ง `pegasus-tcg-api` ต่างไป ต้องตามมาแก้ที่นี่
 * ผู้ซื้อไม่เห็นว่าใครออกเงินส่วนลด
 */

export type PublicSaleStatus = "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "SOLD_OUT" | "BUDGET_EXHAUSTED";

/** แคมเปญหนึ่งรายการ (แท็บหน้า SALE / hero / แบนเนอร์หน้าแรก) */
export type PublicSale = {
  id: number;
  /** `null` = การลดราคาของร้าน (ไม่มีหน้า /sale/{slug}) */
  slug: string | null;
  name: string;
  type: SaleType;
  discountType: "PERCENT" | "FIXED_OFF" | "FIXED_PRICE";
  discountValue: number;
  maxDiscountPerUnit: number | null;
  conditions: CardCondition[];
  minUnitPrice: number | null;
  perBuyerLimit: number | null;
  /** ชื่อขอบเขตสั้น ๆ เช่น "ทุกการ์ด Pokémon" / "ชุด OP-09" */
  scopeLabel: string | null;
  bannerImageUrl: string | null;
  startsAt: string;
  endsAt: string;
  status: PublicSaleStatus;
  listingCount: number;
  sellerCount: number;
};

/** `GET /sales/featured` — ไม่มีอะไรบนหน้าแรก backend ส่ง `null` */
export type FeaturedSales = {
  /** Flash Sale บนหน้าแรก (ครั้งละ 1) + 12 listing แรก · ก่อนเริ่ม ≤ 24 ชม. `status = SCHEDULED` */
  flash: { sale: PublicSale; listings: PublicListingDto[] } | null;
  /** แบนเนอร์ CATEGORY_SALE ที่ featured เรียงตาม home_sort */
  banners: PublicSale[];
};

/** `GET /sales/{slug}` */
export type SaleDetail = {
  sale: PublicSale;
  listings: PageResponse<PublicListingDto>;
};

export type SaleSort = "discount_desc" | "price_asc" | "ending_soon";

/** filter เดียวกับ search (SAL-04) */
export type SaleListingQuery = {
  categoryId?: number;
  condition?: CardCondition[];
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: SaleSort;
  /** `/sale` แท็บ "ร้านลดราคา" */
  owner?: "SELLER";
  page?: number;
  size?: number;
};
