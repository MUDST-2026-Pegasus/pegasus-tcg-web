import { api, type PageResponse } from "@/lib/api";

import type {
  CancelOrderPayload,
  SellerOrderCounts,
  SellerOrderDetail,
  SellerOrderQuery,
  SellerOrderSummary,
  ShipOrderPayload,
} from "./orders.types";

// ---------- `/sellers/me/orders` (`SellerOrderController.java`) ----------
// component ไม่เรียกตรง ๆ ให้ผ่าน hook ใน `orders.queries.ts`
// ทุกอันเห็นเฉพาะออเดอร์ของร้านที่ login — id ของร้านอื่นได้ 404 `ORDER_NOT_FOUND`

/** หลายสถานะส่งเป็น comma เดียว — backend รับทั้งแบบซ้ำ param และคั่น comma */
export function getSellerOrders(
  query: SellerOrderQuery,
): Promise<PageResponse<SellerOrderSummary>> {
  return api.get<PageResponse<SellerOrderSummary>>("/sellers/me/orders", {
    query: {
      status: query.statuses.length > 0 ? query.statuses.join(",") : undefined,
      q: query.q,
      sort: query.sort,
      page: query.page,
      size: query.size,
    },
  });
}

export function getSellerOrderCounts(): Promise<SellerOrderCounts> {
  return api.get<SellerOrderCounts>("/sellers/me/orders/counts");
}

export function getSellerOrder(id: number): Promise<SellerOrderDetail> {
  return api.get<SellerOrderDetail>(`/sellers/me/orders/${id}`);
}

/** PAID → PREPARING — ไม่บังคับ ส่งจาก PAID ได้เลย แต่บอกผู้ซื้อว่ามีคนรับเรื่องแล้ว */
export function acceptSellerOrder(id: number): Promise<SellerOrderDetail> {
  return api.post<SellerOrderDetail>(`/sellers/me/orders/${id}/accept`);
}

export function shipSellerOrder(
  id: number,
  payload: ShipOrderPayload,
): Promise<SellerOrderDetail> {
  return api.post<SellerOrderDetail>(`/sellers/me/orders/${id}/ship`, payload);
}

/** คืนการ์ดเข้าสต็อกและคืนเงินผู้ซื้อ (ถ้าจ่ายแล้ว) — ผู้ซื้อเห็นเหตุผล */
export function cancelSellerOrder(
  id: number,
  payload: CancelOrderPayload,
): Promise<SellerOrderDetail> {
  return api.post<SellerOrderDetail>(`/sellers/me/orders/${id}/cancel`, payload);
}
