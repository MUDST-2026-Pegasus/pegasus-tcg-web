import { api, type FileDownload, type PageResponse } from "@/lib/api";

import type {
  AdminOrderDetail,
  AdminOrderListParams,
  AdminOrderSummary,
  OrderBoard,
  SellerOrderStatus,
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

/**
 * CSV คำสั่งซื้อย่อยที่สร้างใน [from, to) ตามสถานะที่เลือก (ว่าง = ทุกสถานะ) [TCG-747/749]
 * เกิน 20,000 แถว backend ตอบ 400 `EXPORT_TOO_LARGE` · ไฟล์มีชื่อผู้ซื้อ ห้าม log
 */
export function downloadAdminOrdersCsv(params: {
  from: string;
  to: string;
  statuses: SellerOrderStatus[];
}): Promise<FileDownload> {
  return api.download("/admin/orders/export", {
    query: {
      from: params.from,
      to: params.to,
      status: params.statuses.length ? params.statuses.join(",") : undefined,
    },
    headers: { Accept: "text/csv, application/json" },
  });
}

export function downloadAdminOrderSummary(sellerOrderId: number): Promise<FileDownload> {
  return api.download(`/admin/orders/${sellerOrderId}/summary.pdf`);
}
