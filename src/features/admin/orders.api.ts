import { api, type PageResponse } from "@/lib/api";

import type {
  AdminOrderDetail,
  AdminOrderListParams,
  AdminOrderSummary,
  OrderBoard,
} from "./orders.types";

/**
 * `/admin/orders` — ภาพรวมคำสั่งซื้อทั้งแพลตฟอร์ม (`AdminOrderController.java`)
 * อ่านอย่างเดียว ทุก endpoint บังคับ role ADMIN ที่ backend
 *
 * detail มีที่อยู่ผู้ซื้อ (PII) ห้าม log
 */

/** 5 คอลัมน์พร้อมจำนวนเต็ม และใบแรก ๆ ของแต่ละคอลัมน์ */
export function getOrderBoard(perColumn: number): Promise<OrderBoard> {
  return api.get<OrderBoard>("/admin/orders/board", {
    query: { perColumn },
  });
}

/** `status` ส่งแบบคั่นด้วย comma backend รับได้ทั้งแบบนี้และแบบซ้ำพารามิเตอร์ */
export function getAdminOrders(
  params: AdminOrderListParams,
): Promise<PageResponse<AdminOrderSummary>> {
  return api.get<PageResponse<AdminOrderSummary>>("/admin/orders", {
    query: {
      status: params.statuses.length ? params.statuses.join(",") : undefined,
      q: params.q?.trim() || undefined,
      sort: params.sort,
      page: params.page,
      size: params.size,
    },
  });
}

export function getAdminOrder(sellerOrderId: number): Promise<AdminOrderDetail> {
  return api.get<AdminOrderDetail>(`/admin/orders/${sellerOrderId}`);
}
