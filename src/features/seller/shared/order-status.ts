import type { SellerOrderStatus } from "./seller.types";

/**
 * ชื่อและสีของสถานะคำสั่งซื้อจากมุมของร้าน — ใช้ทั้งการ์ดคำสั่งซื้อล่าสุดในแดชบอร์ด
 * และหน้าจัดการคำสั่งซื้อ ให้สถานะเดียวกันหน้าตาเหมือนกันทุกที่
 */

export const SELLER_ORDER_STATUS_LABEL: Record<SellerOrderStatus, string> = {
  PENDING_PAYMENT: "รอชำระ",
  PAID: "รอแพ็ค",
  PREPARING: "กำลังแพ็ค",
  SHIPPED: "จัดส่งแล้ว",
  DELIVERED: "ถึงผู้ซื้อแล้ว",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
  RETURN_REQUESTED: "ขอคืนสินค้า",
  RETURNED: "คืนสินค้าแล้ว",
  REFUNDED: "คืนเงินแล้ว",
};

/** "urgent" = ร้านต้องลงมือ (แพ็ค / ตอบคำขอคืน), "pending" = รอฝั่งผู้ซื้อ */
export type OrderTone = "urgent" | "pending" | "shipping" | "success" | "muted";

export const SELLER_ORDER_STATUS_TONE: Record<SellerOrderStatus, OrderTone> = {
  PENDING_PAYMENT: "pending",
  PAID: "urgent",
  PREPARING: "urgent",
  SHIPPED: "shipping",
  DELIVERED: "shipping",
  COMPLETED: "success",
  CANCELLED: "muted",
  RETURN_REQUESTED: "urgent",
  RETURNED: "muted",
  REFUNDED: "muted",
};

export const ORDER_TONE_BADGE: Record<OrderTone, string> = {
  urgent: "bg-[#fbe9e8] text-[#d0342c]",
  pending: "bg-[#fdf0dd] text-[#b45309]",
  shipping: "bg-[#ede9fe] text-[#6d28d9]",
  success: "bg-[#e3f4ec] text-[#12805c]",
  muted: "bg-[#eef1f2] text-[#6b7280]",
};

/** ที่ร้านต้องแพ็คและส่ง — ส่งจาก PAID ได้เลยโดยไม่ต้องกดรับออเดอร์ก่อน */
export const TO_PACK_STATUSES: SellerOrderStatus[] = ["PAID", "PREPARING"];
