import { api, type PageResponse } from "@/lib/api";

import type {
  CatalogProductDetail,
  CatalogSearchItem,
  CreateListingPayload,
  ListingDetailsPayload,
  MarketListing,
  NewUnitsPayload,
  VariantLookup,
} from "./listing-form.types";
import type { CardCondition, SellerListing } from "./products.types";

/**
 * หน้าลงขาย / แก้ประกาศ — ส่วนที่อ่านแคตตาล็อกกับตลาดเป็น public ทั้งหมด
 * (ส่ง `auth: false` ให้ token ที่หมดอายุไม่ทำให้ค้นการ์ดไม่ได้)
 * ส่วนที่เขียนอยู่ใต้ `/sellers/me/listings` ต้องเป็นร้าน VERIFIED ไม่งั้นได้ `SELLER_NOT_VERIFIED`
 * ราคากับสถานะใช้ `changeListingPrice` / `changeListingStatus` ใน `products.api.ts`
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `listing-form.queries.ts`
 */
const PUBLIC = { auth: false } as const;

/** ค้นจากชื่อ ชื่อภาษาท้องถิ่น และเลขการ์ด เรียงตามชื่อ */
export function searchCatalog(
  q: string,
  size: number,
): Promise<PageResponse<CatalogSearchItem>> {
  return api.get<PageResponse<CatalogSearchItem>>("/catalog/products", {
    ...PUBLIC,
    query: { q, page: 0, size },
  });
}

export function getCatalogProduct(
  productId: number,
): Promise<CatalogProductDetail> {
  return api.get<CatalogProductDetail>(`/catalog/products/${productId}`, PUBLIC);
}

/** SKU หรือบาร์โค้ด → พิมพ์ที่ตรงกัน ไม่เจอได้ `VARIANT_NOT_FOUND` */
export function findVariantByCode(code: string): Promise<VariantLookup> {
  return api.get<VariantLookup>(
    `/catalog/variants/by-code/${encodeURIComponent(code)}`,
    PUBLIC,
  );
}

/** หน้าละไม่เกิน 100 ตาม `Paging.MAX_SIZE` ฝั่ง backend */
export const MARKET_SAMPLE_SIZE = 100;

/** ประกาศที่เปิดขายของการ์ดพิมพ์นี้ในสภาพนี้ ถูกสุดก่อน */
export function getMarketListings(
  variantId: number,
  condition: CardCondition,
): Promise<PageResponse<MarketListing>> {
  return api.get<PageResponse<MarketListing>>("/listings", {
    ...PUBLIC,
    query: {
      variantId,
      condition,
      sort: "price",
      page: 0,
      size: MARKET_SAMPLE_SIZE,
    },
  });
}

/** ได้ประกาศ DRAFT ที่ยังไม่มีการ์ด — ใส่การ์ดด้วย `addListingUnits` แล้วค่อยเปิดขาย */
export function createListing(
  payload: CreateListingPayload,
): Promise<SellerListing> {
  return api.post<SellerListing>("/sellers/me/listings", payload);
}

/** การ์ดใหม่ลงประกาศนี้ตรง ๆ ใบละหนึ่งแถวในคลังและในสมุดบัญชีสต็อก */
export function addListingUnits(
  listingId: number,
  payload: NewUnitsPayload,
): Promise<unknown[]> {
  return api.post<unknown[]>(`/sellers/me/listings/${listingId}/units`, payload);
}

/** เขียนทับรายละเอียดกับรูปทั้งชุด — ไม่แตะราคา สภาพ หรือการ์ด */
export function updateListingDetails(
  listingId: number,
  payload: ListingDetailsPayload,
): Promise<SellerListing> {
  return api.put<SellerListing>(`/sellers/me/listings/${listingId}`, payload);
}
