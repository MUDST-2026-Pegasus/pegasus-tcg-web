import { api, type PageResponse } from "@/lib/api";
import type { SellerListingSummary } from "@/features/seller/products/products.types";

import type {
  PlatformSaleListing,
  SellerSale,
  SellerSaleDetail,
  SellerSaleInput,
  SellerSalePage,
  SellerSaleStatus,
  SellerSaleSummary,
} from "./sales.types";

/**
 * `/sellers/me/sales` (SAL-03) — ฟังก์ชันเปล่าหนึ่งตัวต่อหนึ่ง endpoint ไม่มี React
 * สร้าง/เปิดได้เฉพาะร้าน VERIFIED · ทุกการเปลี่ยนแปลง backend คิดราคาใหม่ให้เอง
 */

const ROOT = "/sellers/me/sales";

export function getSellerSales(status: SellerSaleStatus | undefined, page: number, size: number) {
  return api.get<SellerSalePage>(ROOT, { query: { status, page, size } });
}

export function getSellerSaleSummary() {
  return api.get<SellerSaleSummary>(`${ROOT}/summary`);
}

export function getSellerSale(id: number) {
  return api.get<SellerSaleDetail>(`${ROOT}/${id}`);
}

/** listing ทับการลดราคาอื่นของร้านช่วงเดียวกัน → 409 `SALE_OVERLAP` (details.listingIds) */
export function createSellerSale(input: SellerSaleInput) {
  return api.post<SellerSale>(ROOT, input);
}

export function updateSellerSale(id: number, input: SellerSaleInput) {
  return api.put<SellerSale>(`${ROOT}/${id}`, input);
}

export function deleteSellerSale(id: number) {
  return api.delete<void>(`${ROOT}/${id}`);
}

export function pauseSellerSale(id: number) {
  return api.post<SellerSale>(`${ROOT}/${id}/pause`);
}

/** แอดมินหยุดไว้ → 409 `SALE_PAUSED` */
export function resumeSellerSale(id: number) {
  return api.post<SellerSale>(`${ROOT}/${id}/resume`);
}

export function endSellerSale(id: number) {
  return api.post<SellerSale>(`${ROOT}/${id}/end`);
}

export function getPlatformListings() {
  return api.get<PlatformSaleListing[]>(`${ROOT}/platform-listings`);
}

/** listing ที่เปิดขายอยู่ทั้งหมดของร้าน — ใช้เลือกในตาราง S2 */
export async function getSaleableListings(): Promise<SellerListingSummary[]> {
  const items: SellerListingSummary[] = [];
  for (let page = 0; ; page++) {
    const result = await api.get<PageResponse<SellerListingSummary>>("/sellers/me/listings", {
      query: { status: "ACTIVE", page, size: 100 },
    });
    items.push(...result.items);
    if (page + 1 >= result.totalPages || result.items.length === 0) break;
  }
  return items;
}
