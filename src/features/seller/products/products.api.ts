import { api, type PageResponse } from "@/lib/api";

import type {
  ListingPricePayload,
  ListingQuery,
  ListingStatus,
  SellerListing,
  SellerListingSummary,
} from "./products.types";

/**
 * `/sellers/me/listings` — ประกาศขายของผู้ขายที่ login อยู่ (`SellerListingController.java`)
 * อ่านได้เมื่อมี seller profile ส่วนการเขียนทุกแบบต้อง VERIFIED ไม่งั้นได้ `SELLER_NOT_VERIFIED`
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `products.queries.ts`
 */

/** แก้ไขล่าสุดก่อนเสมอ — backend ยังไม่รับ `sort` หรือคำค้น */
export function getMyListings(
  query: ListingQuery,
): Promise<PageResponse<SellerListingSummary>> {
  return api.get<PageResponse<SellerListingSummary>>("/sellers/me/listings", {
    query: { status: query.status, page: query.page, size: query.size },
  });
}

export function getMyListing(id: number): Promise<SellerListing> {
  return api.get<SellerListing>(`/sellers/me/listings/${id}`);
}

/** ประกาศที่ปิดแล้ว (DELISTED / BLOCKED) เปลี่ยนราคาไม่ได้ — `LISTING_CLOSED` */
export function changeListingPrice(
  id: number,
  payload: ListingPricePayload,
): Promise<SellerListing> {
  return api.patch<SellerListing>(`/sellers/me/listings/${id}/price`, payload);
}

/**
 * ผู้ขายขอได้แค่ ACTIVE (เปิดขาย/ขายต่อ), PAUSED (พักไว้) และ DELISTED (ปิดถาวร)
 * ย้ายไม่ได้ตามกติกาได้ `LISTING_STATUS_TRANSITION` · ร่างที่ไม่มีการ์ดได้ `LISTING_HAS_NO_STOCK`
 */
export function changeListingStatus(
  id: number,
  status: ListingStatus,
): Promise<SellerListing> {
  return api.patch<SellerListing>(`/sellers/me/listings/${id}/status`, {
    status,
  });
}

/** ปฏิเสธถ้ายังมีการ์ดติดจอง (`LISTING_HAS_RESERVATIONS`) · การ์ดที่วางขายอยู่กลับเข้าคลัง */
export function deleteListing(id: number): Promise<void> {
  return api.delete<void>(`/sellers/me/listings/${id}`);
}
