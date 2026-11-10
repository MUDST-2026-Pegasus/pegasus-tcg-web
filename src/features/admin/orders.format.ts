import { isApiError, isNetworkError } from "@/lib/api";

import type {
  AdminOrderSort,
  AdminOrderSummary,
  OrderBoardAlerts,
  OrderBoardColumnKey,
  PaymentMethod,
  PaymentStatus,
  ReturnReasonCode,
  SellerOrderStatus,
  ShippingAddressSnapshot,
} from "./orders.types";
import { translateError, translate } from "@/lib/i18n";

/**
 * ตัวช่วยแปลงค่าดิบจาก `/admin/orders` → ข้อความบนหน้า
 * ไม่มี React และไม่แตะ PII นอกจากจัดรูปให้อ่านง่าย
 */

/** โทนสีของคอลัมน์ — ใช้ทั้งจุดหัวคอลัมน์และ badge ในการ์ด */
export type OrderTone = "pending" | "packing" | "shipping" | "success" | "dispute";

export type OrderColumnMeta = {
  title: string;
  tone: OrderTone;
  /** ลำดับเดียวกับที่ backend เรียงคอลัมน์นั้นบน board ใช้ต่อใน "ดูเพิ่มเติม" */
  sort: AdminOrderSort;
};

export const ORDER_COLUMN_META: Record<OrderBoardColumnKey, OrderColumnMeta> = {
  PENDING_PAYMENT: { get title() { return translate("admin", "orders.column.pendingPayment", "รอชำระเงิน"); }, tone: "pending", sort: "OLDEST" },
  AWAITING_SHIPMENT: {
    get title() {
      return translate("admin", "orders.column.awaitingShipment", "ชำระแล้ว · รอส่ง");
    },
    tone: "packing",
    sort: "PAID_OLDEST",
  },
  IN_TRANSIT: { get title() { return translate("admin", "orders.column.inTransit", "กำลังจัดส่ง"); }, tone: "shipping", sort: "SHIPPED_NEWEST" },
  COMPLETED: { get title() { return translate("admin", "orders.column.completed", "สำเร็จ"); }, tone: "success", sort: "COMPLETED_NEWEST" },
  DISPUTED: { get title() { return translate("admin", "orders.column.disputed", "ข้อพิพาท"); }, tone: "dispute", sort: "OLDEST" },
};

export const ORDER_STATUS_LABEL: Record<SellerOrderStatus, string> = {
  get PENDING_PAYMENT() {
    return translate("admin", "orders.status.pendingPayment", "รอชำระเงิน");
  },
  get PAID() {
    return translate("admin", "orders.status.paid", "ชำระแล้ว");
  },
  get PREPARING() {
    return translate("admin", "orders.status.preparing", "กำลังแพ็ค");
  },
  get SHIPPED() {
    return translate("admin", "orders.status.shipped", "จัดส่งแล้ว");
  },
  get DELIVERED() {
    return translate("admin", "orders.status.delivered", "ถึงผู้ซื้อแล้ว");
  },
  get COMPLETED() {
    return translate("admin", "orders.status.completed", "สำเร็จ");
  },
  get CANCELLED() {
    return translate("admin", "orders.status.cancelled", "ยกเลิก");
  },
  get RETURN_REQUESTED() {
    return translate("admin", "orders.status.returnRequested", "ขอคืนสินค้า");
  },
  get RETURNED() {
    return translate("admin", "orders.status.returned", "คืนสินค้าแล้ว");
  },
  get REFUNDED() {
    return translate("admin", "orders.status.refunded", "คืนเงินแล้ว");
  },
};

export const RETURN_REASON_LABEL: Record<ReturnReasonCode, string> = {
  get NOT_AS_DESCRIBED() {
    return translate("admin", "orders.returnReason.notAsDescribed", "สินค้าไม่ตรงปก");
  },
  get DAMAGED() {
    return translate("admin", "orders.returnReason.damaged", "สินค้าเสียหาย");
  },
  get WRONG_ITEM() {
    return translate("admin", "orders.returnReason.wrongItem", "ได้รับสินค้าผิด");
  },
  get NOT_RECEIVED() {
    return translate("admin", "orders.returnReason.notReceived", "ไม่ได้รับสินค้า");
  },
  get COUNTERFEIT() {
    return translate("admin", "orders.returnReason.counterfeit", "สงสัยของปลอม");
  },
  get OTHER() {
    return translate("admin", "orders.returnReason.other", "เหตุผลอื่น");
  },
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  get BANK_TRANSFER() {
    return translate("admin", "orders.paymentMethod.bankTransfer", "โอนผ่านธนาคาร");
  },
  get MOCK_GATEWAY() {
    return translate("admin", "orders.paymentMethod.mockGateway", "ช่องทางทดสอบ");
  },
  get WALLET() {
    return translate("admin", "orders.paymentMethod.wallet", "กระเป๋าเงิน");
  },
  get CASH_ON_DELIVERY() {
    return translate("admin", "orders.paymentMethod.cashOnDelivery", "เก็บเงินปลายทาง");
  },
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  get PENDING() {
    return translate("admin", "orders.paymentStatus.pending", "รอชำระ");
  },
  get AWAITING_VERIFICATION() {
    return translate("admin", "orders.paymentStatus.awaitingVerification", "รอตรวจสลิป");
  },
  get SUCCEEDED() {
    return translate("admin", "orders.paymentStatus.succeeded", "ชำระสำเร็จ");
  },
  get FAILED() {
    return translate("admin", "orders.paymentStatus.failed", "ไม่สำเร็จ");
  },
  get CANCELLED() {
    return translate("admin", "orders.paymentStatus.cancelled", "ยกเลิก");
  },
  get EXPIRED() {
    return translate("admin", "orders.paymentStatus.expired", "หมดเวลา");
  },
};

/** ใช้แทนค่าที่ยังไม่มี — ไม่เดาข้อความขึ้นมาเอง */
export const NO_VALUE = "—";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * ระยะเวลาที่รอมาแล้ว แบบสั้นพอใส่ badge
 * ต่ำกว่า 1 ชม. เป็นนาที, ถึง 48 ชม. เป็นชั่วโมง, เกินนั้นเป็นวัน
 */
export function formatElapsed(fromIso: string, now: Date = new Date()): string {
  const elapsed = Math.max(0, now.getTime() - new Date(fromIso).getTime());
  if (elapsed < HOUR_MS) {
    return translate("admin", "orders.duration.minutes", "{n} นาที", { n: Math.floor(elapsed / MINUTE_MS) });
  }
  const hours = Math.floor(elapsed / HOUR_MS);
  if (hours < 48) {
    return translate("admin", "orders.duration.hours", "{n} ชม.", { n: hours });
  }
  return translate("admin", "orders.duration.days", "{n} วัน", { n: Math.floor(hours / 24) });
}

/** 60 → "1 ชม.", 90 → "90 นาที" */
export function formatTimeout(minutes: number): string {
  return minutes % 60 === 0 ? translate("admin", "orders.duration.hours", "{n} ชม.", { n: minutes / 60 }) : translate("admin", "orders.duration.minutes", "{n} นาที", { n: minutes });
}

/**
 * ข้อความบน badge ท้ายการ์ด — ความหมายต่างกันตามคอลัมน์
 * ค่าที่ backend ยังไม่มี (เช่น ยังไม่มีเลขพัสดุ) แสดงเป็น `—`
 */
export function orderContextLabel(
  column: OrderBoardColumnKey,
  order: AdminOrderSummary,
  now: Date = new Date(),
): string {
  switch (column) {
    case "PENDING_PAYMENT":
      return translate("admin", "orders.context.pending", "ค้าง {time}", { time: formatElapsed(order.createdAt, now) });
    case "AWAITING_SHIPMENT":
      return order.paidAt
        ? translate("admin", "orders.context.packing", "รอแพ็ค {time}", { time: formatElapsed(order.paidAt, now) })
        : NO_VALUE;
    case "IN_TRANSIT":
      return order.tracking?.trackingNumber ?? NO_VALUE;
    case "COMPLETED":
      return order.reviewRating === null
        ? translate("admin", "orders.context.noReview", "ยังไม่รีวิว")
        : translate("admin", "orders.context.review", "รีวิว {rating} ดาว", { rating: order.reviewRating });
    case "DISPUTED":
      return order.returnReasonCode
        ? (RETURN_REASON_LABEL[order.returnReasonCode] ?? NO_VALUE)
        : NO_VALUE;
  }
}

/** 2 → "2 ใบ" */
export function formatItemCount(count: number): string {
  return translate("admin", "orders.itemCount", "{count} ใบ", { count });
}

/** ชื่อที่แสดงของผู้ซื้อ/ผู้ขาย — ใช้ username ตามดีไซน์ */
export function partyName(party: { username: string }): string {
  return party.username;
}

export type OrderAlertNotice = {
  title: string;
  description: string;
};

/** แถบเตือนด้านบน — `null` เมื่อไม่มีอะไรต้องเตือน ให้ซ่อนแถบไปเลย */
export function orderAlertNotice(
  alerts: OrderBoardAlerts,
): OrderAlertNotice | null {
  const { openDisputeCount, overduePaymentCount, paymentTimeoutMinutes } =
    alerts;
  if (openDisputeCount === 0 && overduePaymentCount === 0) {
    return null;
  }

  const parts: string[] = [];
  if (openDisputeCount > 0) {
    parts.push(translate("admin", "orders.alert.disputes", "{count} คำสั่งซื้อที่เปิดข้อพิพาท", { count: openDisputeCount }));
  }
  if (overduePaymentCount > 0) {
    parts.push(
      translate("admin", "orders.alert.overdue", "{count} รายการค้างชำระเกิน {timeout}", { count: overduePaymentCount, timeout: formatTimeout(paymentTimeoutMinutes) }),
    );
  }

  return {
    title: translate("admin", "orders.alert.title", "มี {items}", { items: parts.join(translate("admin", "orders.alert.joiner", " และ ")) }),
    description:
      overduePaymentCount > 0
        ? translate("admin", "orders.alert.overdueHint", "คำสั่งซื้อที่ค้างชำระเกินกำหนดควรถูกยกเลิกอัตโนมัติและคืนสต็อกให้ผู้ขาย ถ้ายังค้างอยู่แปลว่างานยกเลิกอัตโนมัติอาจมีปัญหา")
        : translate("admin", "orders.alert.disputeHint", "ผู้ซื้อขอคืนสินค้า เงินของคำสั่งซื้อเหล่านี้ถูกพักไว้จนกว่าจะตกลงกันได้"),
  };
}

/**
 * แกะที่อยู่จาก snapshot ที่ backend เก็บไว้ตอน checkout
 * snapshot เสีย/ว่าง คืน `null` แทนที่จะโยน error ทั้งหน้า
 */
export function parseShippingAddress(
  snapshot: string | null,
): ShippingAddressSnapshot | null {
  if (!snapshot) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const address = parsed as ShippingAddressSnapshot;
    return address.recipientName || address.line1 ? address : null;
  } catch {
    return null;
  }
}

/** ที่อยู่หลายบรรทัดรวมเป็นบรรทัดเดียว ข้ามช่องที่ว่าง */
export function formatAddressLine(address: ShippingAddressSnapshot): string {
  return [
    address.line1,
    address.line2,
    address.subdistrict,
    address.district,
    address.province,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(" ");
}

export function adminOrderSummaryDownloadErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return translate("admin", "orders.pdfError.network", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่");
  }
  if (isApiError(error)) {
    switch (error.status) {
      case 401:
        return translate("admin", "orders.pdfError.unauthorized", "เซสชันหมดอายุ กรุณาเข้าสู่ระบบแล้วลองใหม่");
      case 403:
        return translate("admin", "orders.pdfError.forbidden", "บัญชีนี้ไม่มีสิทธิ์ดาวน์โหลดเอกสารคำสั่งซื้อ");
      case 404:
        return translate("admin", "orders.pdfError.notFound", "ไม่พบคำสั่งซื้อที่เลือก หรือรายการถูกลบแล้ว");
      default:
        if (error.status >= 500) return translate("admin", "orders.pdfError.server", "ระบบสร้าง PDF ขัดข้อง กรุณาลองใหม่อีกครั้ง");
    }
  }
  return translateError(error, translate("admin", "orders.pdfError.failed", "ดาวน์โหลด PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"));
}

// @tolgee-key {"key": "orders.column.pendingPayment", "ns": "admin", "defaultValue": "รอชำระเงิน"}
// @tolgee-key {"key": "orders.column.inTransit", "ns": "admin", "defaultValue": "กำลังจัดส่ง"}
// @tolgee-key {"key": "orders.column.completed", "ns": "admin", "defaultValue": "สำเร็จ"}
// @tolgee-key {"key": "orders.column.disputed", "ns": "admin", "defaultValue": "ข้อพิพาท"}
// @tolgee-key {"key": "orders.column.awaitingShipment", "ns": "admin", "defaultValue": "ชำระแล้ว · รอส่ง"}
// @tolgee-key {"key": "orders.status.pendingPayment", "ns": "admin", "defaultValue": "รอชำระเงิน"}
// @tolgee-key {"key": "orders.status.paid", "ns": "admin", "defaultValue": "ชำระแล้ว"}
// @tolgee-key {"key": "orders.status.preparing", "ns": "admin", "defaultValue": "กำลังแพ็ค"}
// @tolgee-key {"key": "orders.status.shipped", "ns": "admin", "defaultValue": "จัดส่งแล้ว"}
// @tolgee-key {"key": "orders.status.delivered", "ns": "admin", "defaultValue": "ถึงผู้ซื้อแล้ว"}
// @tolgee-key {"key": "orders.status.completed", "ns": "admin", "defaultValue": "สำเร็จ"}
// @tolgee-key {"key": "orders.status.cancelled", "ns": "admin", "defaultValue": "ยกเลิก"}
// @tolgee-key {"key": "orders.status.returnRequested", "ns": "admin", "defaultValue": "ขอคืนสินค้า"}
// @tolgee-key {"key": "orders.status.returned", "ns": "admin", "defaultValue": "คืนสินค้าแล้ว"}
// @tolgee-key {"key": "orders.status.refunded", "ns": "admin", "defaultValue": "คืนเงินแล้ว"}
// @tolgee-key {"key": "orders.returnReason.notAsDescribed", "ns": "admin", "defaultValue": "สินค้าไม่ตรงปก"}
// @tolgee-key {"key": "orders.returnReason.damaged", "ns": "admin", "defaultValue": "สินค้าเสียหาย"}
// @tolgee-key {"key": "orders.returnReason.wrongItem", "ns": "admin", "defaultValue": "ได้รับสินค้าผิด"}
// @tolgee-key {"key": "orders.returnReason.notReceived", "ns": "admin", "defaultValue": "ไม่ได้รับสินค้า"}
// @tolgee-key {"key": "orders.returnReason.counterfeit", "ns": "admin", "defaultValue": "สงสัยของปลอม"}
// @tolgee-key {"key": "orders.returnReason.other", "ns": "admin", "defaultValue": "เหตุผลอื่น"}
// @tolgee-key {"key": "orders.paymentMethod.bankTransfer", "ns": "admin", "defaultValue": "โอนผ่านธนาคาร"}
// @tolgee-key {"key": "orders.paymentMethod.mockGateway", "ns": "admin", "defaultValue": "ช่องทางทดสอบ"}
// @tolgee-key {"key": "orders.paymentMethod.wallet", "ns": "admin", "defaultValue": "กระเป๋าเงิน"}
// @tolgee-key {"key": "orders.paymentMethod.cashOnDelivery", "ns": "admin", "defaultValue": "เก็บเงินปลายทาง"}
// @tolgee-key {"key": "orders.paymentStatus.pending", "ns": "admin", "defaultValue": "รอชำระ"}
// @tolgee-key {"key": "orders.paymentStatus.awaitingVerification", "ns": "admin", "defaultValue": "รอตรวจสลิป"}
// @tolgee-key {"key": "orders.paymentStatus.succeeded", "ns": "admin", "defaultValue": "ชำระสำเร็จ"}
// @tolgee-key {"key": "orders.paymentStatus.failed", "ns": "admin", "defaultValue": "ไม่สำเร็จ"}
// @tolgee-key {"key": "orders.paymentStatus.cancelled", "ns": "admin", "defaultValue": "ยกเลิก"}
// @tolgee-key {"key": "orders.paymentStatus.expired", "ns": "admin", "defaultValue": "หมดเวลา"}
// @tolgee-key {"key": "orders.duration.minutes", "ns": "admin", "defaultValue": "{n} นาที"}
// @tolgee-key {"key": "orders.duration.hours", "ns": "admin", "defaultValue": "{n} ชม."}
// @tolgee-key {"key": "orders.duration.days", "ns": "admin", "defaultValue": "{n} วัน"}
// @tolgee-key {"key": "orders.context.pending", "ns": "admin", "defaultValue": "ค้าง {time}"}
// @tolgee-key {"key": "orders.context.packing", "ns": "admin", "defaultValue": "รอแพ็ค {time}"}
// @tolgee-key {"key": "orders.context.noReview", "ns": "admin", "defaultValue": "ยังไม่รีวิว"}
// @tolgee-key {"key": "orders.context.review", "ns": "admin", "defaultValue": "รีวิว {rating} ดาว"}
// @tolgee-key {"key": "orders.itemCount", "ns": "admin", "defaultValue": "{count} ใบ"}
// @tolgee-key {"key": "orders.alert.disputes", "ns": "admin", "defaultValue": "{count} คำสั่งซื้อที่เปิดข้อพิพาท"}
// @tolgee-key {"key": "orders.alert.overdue", "ns": "admin", "defaultValue": "{count} รายการค้างชำระเกิน {timeout}"}
// @tolgee-key {"key": "orders.alert.joiner", "ns": "admin", "defaultValue": " และ "}
// @tolgee-key {"key": "orders.alert.title", "ns": "admin", "defaultValue": "มี {items}"}
// @tolgee-key {"key": "orders.alert.overdueHint", "ns": "admin", "defaultValue": "คำสั่งซื้อที่ค้างชำระเกินกำหนดควรถูกยกเลิกอัตโนมัติและคืนสต็อกให้ผู้ขาย ถ้ายังค้างอยู่แปลว่างานยกเลิกอัตโนมัติอาจมีปัญหา"}
// @tolgee-key {"key": "orders.alert.disputeHint", "ns": "admin", "defaultValue": "ผู้ซื้อขอคืนสินค้า เงินของคำสั่งซื้อเหล่านี้ถูกพักไว้จนกว่าจะตกลงกันได้"}
// @tolgee-key {"key": "orders.pdfError.network", "ns": "admin", "defaultValue": "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่"}
// @tolgee-key {"key": "orders.pdfError.unauthorized", "ns": "admin", "defaultValue": "เซสชันหมดอายุ กรุณาเข้าสู่ระบบแล้วลองใหม่"}
// @tolgee-key {"key": "orders.pdfError.forbidden", "ns": "admin", "defaultValue": "บัญชีนี้ไม่มีสิทธิ์ดาวน์โหลดเอกสารคำสั่งซื้อ"}
// @tolgee-key {"key": "orders.pdfError.notFound", "ns": "admin", "defaultValue": "ไม่พบคำสั่งซื้อที่เลือก หรือรายการถูกลบแล้ว"}
// @tolgee-key {"key": "orders.pdfError.server", "ns": "admin", "defaultValue": "ระบบสร้าง PDF ขัดข้อง กรุณาลองใหม่อีกครั้ง"}
// @tolgee-key {"key": "orders.pdfError.failed", "ns": "admin", "defaultValue": "ดาวน์โหลด PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"}
