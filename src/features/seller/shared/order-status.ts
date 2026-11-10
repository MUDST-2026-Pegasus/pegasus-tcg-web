import type { SellerOrderStatus } from "./seller.types";
import { translate } from "@/lib/i18n";

/**
 * ชื่อและสีของสถานะคำสั่งซื้อจากมุมของร้าน — ใช้ทั้งการ์ดคำสั่งซื้อล่าสุดในแดชบอร์ด
 * และหน้าจัดการคำสั่งซื้อ ให้สถานะเดียวกันหน้าตาเหมือนกันทุกที่
 */

export const SELLER_ORDER_STATUS_LABEL: Record<SellerOrderStatus, string> = {
  get PENDING_PAYMENT() { return translate("seller", "orderStatus.PENDING_PAYMENT", "รอชำระ"); },
  get PAID() { return translate("seller", "orderStatus.PAID", "รอแพ็ค"); },
  get PREPARING() { return translate("seller", "orderStatus.PREPARING", "กำลังแพ็ค"); },
  get SHIPPED() { return translate("seller", "orderStatus.SHIPPED", "จัดส่งแล้ว"); },
  get DELIVERED() { return translate("seller", "orderStatus.DELIVERED", "ถึงผู้ซื้อแล้ว"); },
  get COMPLETED() { return translate("seller", "orderStatus.COMPLETED", "สำเร็จ"); },
  get CANCELLED() { return translate("seller", "orderStatus.CANCELLED", "ยกเลิก"); },
  get RETURN_REQUESTED() { return translate("seller", "orderStatus.RETURN_REQUESTED", "ขอคืนสินค้า"); },
  get RETURNED() { return translate("seller", "orderStatus.RETURNED", "คืนสินค้าแล้ว"); },
  get REFUNDED() { return translate("seller", "orderStatus.REFUNDED", "คืนเงินแล้ว"); },
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
  muted: "bg-muted text-[#6b7280]",
};

/** ที่ร้านต้องแพ็คและส่ง — ส่งจาก PAID ได้เลยโดยไม่ต้องกดรับออเดอร์ก่อน */
export const TO_PACK_STATUSES: SellerOrderStatus[] = ["PAID", "PREPARING"];

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "orderStatus.PENDING_PAYMENT", "ns": "seller", "defaultValue": "รอชำระ"}
// @tolgee-key {"key": "orderStatus.PAID", "ns": "seller", "defaultValue": "รอแพ็ค"}
// @tolgee-key {"key": "orderStatus.PREPARING", "ns": "seller", "defaultValue": "กำลังแพ็ค"}
// @tolgee-key {"key": "orderStatus.SHIPPED", "ns": "seller", "defaultValue": "จัดส่งแล้ว"}
// @tolgee-key {"key": "orderStatus.DELIVERED", "ns": "seller", "defaultValue": "ถึงผู้ซื้อแล้ว"}
// @tolgee-key {"key": "orderStatus.COMPLETED", "ns": "seller", "defaultValue": "สำเร็จ"}
// @tolgee-key {"key": "orderStatus.CANCELLED", "ns": "seller", "defaultValue": "ยกเลิก"}
// @tolgee-key {"key": "orderStatus.RETURN_REQUESTED", "ns": "seller", "defaultValue": "ขอคืนสินค้า"}
// @tolgee-key {"key": "orderStatus.RETURNED", "ns": "seller", "defaultValue": "คืนสินค้าแล้ว"}
// @tolgee-key {"key": "orderStatus.REFUNDED", "ns": "seller", "defaultValue": "คืนเงินแล้ว"}
