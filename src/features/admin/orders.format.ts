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
  PENDING_PAYMENT: { title: "รอชำระเงิน", tone: "pending", sort: "OLDEST" },
  AWAITING_SHIPMENT: {
    title: "ชำระแล้ว · รอส่ง",
    tone: "packing",
    sort: "PAID_OLDEST",
  },
  IN_TRANSIT: { title: "กำลังจัดส่ง", tone: "shipping", sort: "SHIPPED_NEWEST" },
  COMPLETED: { title: "สำเร็จ", tone: "success", sort: "COMPLETED_NEWEST" },
  DISPUTED: { title: "ข้อพิพาท", tone: "dispute", sort: "OLDEST" },
};

export const ORDER_STATUS_LABEL: Record<SellerOrderStatus, string> = {
  PENDING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระแล้ว",
  PREPARING: "กำลังแพ็ค",
  SHIPPED: "จัดส่งแล้ว",
  DELIVERED: "ถึงผู้ซื้อแล้ว",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
  RETURN_REQUESTED: "ขอคืนสินค้า",
  RETURNED: "คืนสินค้าแล้ว",
  REFUNDED: "คืนเงินแล้ว",
};

export const RETURN_REASON_LABEL: Record<ReturnReasonCode, string> = {
  NOT_AS_DESCRIBED: "สินค้าไม่ตรงปก",
  DAMAGED: "สินค้าเสียหาย",
  WRONG_ITEM: "ได้รับสินค้าผิด",
  NOT_RECEIVED: "ไม่ได้รับสินค้า",
  COUNTERFEIT: "สงสัยของปลอม",
  OTHER: "เหตุผลอื่น",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "โอนผ่านธนาคาร",
  MOCK_GATEWAY: "ช่องทางทดสอบ",
  WALLET: "กระเป๋าเงิน",
  CASH_ON_DELIVERY: "เก็บเงินปลายทาง",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "รอชำระ",
  AWAITING_VERIFICATION: "รอตรวจสลิป",
  SUCCEEDED: "ชำระสำเร็จ",
  FAILED: "ไม่สำเร็จ",
  CANCELLED: "ยกเลิก",
  EXPIRED: "หมดเวลา",
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
    return `${Math.floor(elapsed / MINUTE_MS)} นาที`;
  }
  const hours = Math.floor(elapsed / HOUR_MS);
  if (hours < 48) {
    return `${hours} ชม.`;
  }
  return `${Math.floor(hours / 24)} วัน`;
}

/** 60 → "1 ชม.", 90 → "90 นาที" */
export function formatTimeout(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60} ชม.` : `${minutes} นาที`;
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
      return `ค้าง ${formatElapsed(order.createdAt, now)}`;
    case "AWAITING_SHIPMENT":
      return order.paidAt
        ? `รอแพ็ค ${formatElapsed(order.paidAt, now)}`
        : NO_VALUE;
    case "IN_TRANSIT":
      return order.tracking?.trackingNumber ?? NO_VALUE;
    case "COMPLETED":
      return order.reviewRating === null
        ? "ยังไม่รีวิว"
        : `รีวิว ${order.reviewRating} ดาว`;
    case "DISPUTED":
      return order.returnReasonCode
        ? (RETURN_REASON_LABEL[order.returnReasonCode] ?? NO_VALUE)
        : NO_VALUE;
  }
}

/** 2 → "2 ใบ" */
export function formatItemCount(count: number): string {
  return `${count} ใบ`;
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
    parts.push(`${openDisputeCount} คำสั่งซื้อที่เปิดข้อพิพาท`);
  }
  if (overduePaymentCount > 0) {
    parts.push(
      `${overduePaymentCount} รายการค้างชำระเกิน ${formatTimeout(paymentTimeoutMinutes)}`,
    );
  }

  return {
    title: `มี ${parts.join(" และ ")}`,
    description:
      overduePaymentCount > 0
        ? "คำสั่งซื้อที่ค้างชำระเกินกำหนดควรถูกยกเลิกอัตโนมัติและคืนสต็อกให้ผู้ขาย ถ้ายังค้างอยู่แปลว่างานยกเลิกอัตโนมัติอาจมีปัญหา"
        : "ผู้ซื้อขอคืนสินค้า เงินของคำสั่งซื้อเหล่านี้ถูกพักไว้จนกว่าจะตกลงกันได้",
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
