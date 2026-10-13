import {
  SELLER_ORDER_STATUS_LABEL,
  TO_PACK_STATUSES,
} from "@/features/seller/shared/order-status";
import { formatBaht } from "@/features/seller/shared/seller.format";
import type {
  OrderStatus,
  SellerOrderStatus,
} from "@/features/seller/shared/seller.types";
import { getErrorMessage, hasErrorCode } from "@/lib/api";

import type {
  OrderItem,
  OrderPayment,
  PaymentMethod,
  PaymentRecordStatus,
  SellerOrderCounts,
  SellerOrderDetail,
  SellerOrderDetails,
  SellerOrderSort,
  ShippingAddressSnapshot,
} from "./orders.types";

/**
 * ตัวช่วยแปลงค่าดิบจาก `/sellers/me/orders` → ข้อความบนหน้าจัดการคำสั่งซื้อ
 * ไม่มี React — ทดสอบได้ตรง ๆ
 */

/** ชื่อสถานะแบบสั้น ใช้ทั้งชิปตัวกรองหน้ารายการและ breadcrumb หน้ารายละเอียด */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_pack: "รอแพ็ค",
  awaiting_payment: "รอชำระ",
  shipped: "กำลังจัดส่ง",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
};

// ---------- แท็บ ----------

/** แท็บบนหน้าจัดการคำสั่งซื้อ — อยู่ใน URL เป็น `?status=` */
export type OrderTab =
  | "awaiting_pack"
  | "awaiting_payment"
  | "shipped"
  | "completed"
  | "returns"
  | "cancelled";

export type OrderTabMeta = {
  id: OrderTab;
  label: string;
  statuses: SellerOrderStatus[];
  /** ลำดับที่เหมาะกับแท็บนั้น — รอแพ็คเอาที่จ่ายนานสุดขึ้นก่อน เพราะใกล้เลยกำหนดส่ง */
  sort: SellerOrderSort;
};

/** เรียงตามลำดับงานของร้าน แต่ละสถานะจริงอยู่ในแท็บเดียวเท่านั้น */
export const ORDER_TABS: OrderTabMeta[] = [
  { id: "awaiting_pack", label: "รอแพ็ค", statuses: TO_PACK_STATUSES, sort: "PAID_OLDEST" },
  { id: "awaiting_payment", label: "รอชำระ", statuses: ["PENDING_PAYMENT"], sort: "OLDEST" },
  { id: "shipped", label: "กำลังจัดส่ง", statuses: ["SHIPPED", "DELIVERED"], sort: "SHIPPED_NEWEST" },
  { id: "completed", label: "สำเร็จ", statuses: ["COMPLETED"], sort: "COMPLETED_NEWEST" },
  {
    id: "returns",
    label: "คืนสินค้า",
    statuses: ["RETURN_REQUESTED", "RETURNED", "REFUNDED"],
    sort: "NEWEST",
  },
  { id: "cancelled", label: "ยกเลิก", statuses: ["CANCELLED"], sort: "NEWEST" },
];

/** ค่าใน URL ที่ไม่รู้จัก (หรือไม่มี) กลับไปแท็บแรก */
export function tabOf(value: string | null): OrderTabMeta {
  return ORDER_TABS.find((tab) => tab.id === value) ?? ORDER_TABS[0];
}

/** แท็บที่สถานะนี้อยู่ — breadcrumb หน้ารายละเอียดลิงก์กลับไปที่นี่ */
export function tabOfStatus(status: SellerOrderStatus): OrderTabMeta {
  return ORDER_TABS.find((tab) => tab.statuses.includes(status)) ?? ORDER_TABS[0];
}

export function countOf(counts: SellerOrderCounts | undefined, statuses: SellerOrderStatus[]): number {
  return statuses.reduce((sum, status) => sum + (counts?.[status] ?? 0), 0);
}

/** "8 ออเดอร์รอแพ็ค · 34 กำลังจัดส่ง" — ตัวเลขชุดเดียวกับชิป */
export function ordersSubtitle(counts: SellerOrderCounts | undefined): string {
  const toPack = countOf(counts, TO_PACK_STATUSES);
  const shipping = countOf(counts, ["SHIPPED", "DELIVERED"]);
  return `${toPack} ออเดอร์รอแพ็ค · ${shipping} กำลังจัดส่ง · จัดส่งให้ทันกำหนดเพื่อรักษาคะแนนร้าน`;
}

/** "default" = ใช้ลำดับของแท็บนั้น */
export type SortChoice = "default" | "NEWEST" | "OLDEST" | "TOTAL_DESC";

export const SORT_OPTIONS: { value: SortChoice; label: string }[] = [
  { value: "default", label: "เรียง: ด่วนที่สุดก่อน" },
  { value: "NEWEST", label: "เรียง: ใหม่สุดก่อน" },
  { value: "OLDEST", label: "เรียง: เก่าสุดก่อน" },
  { value: "TOTAL_DESC", label: "เรียง: ยอดสูง-ต่ำ" },
];

export function sortOf(value: string | null): SortChoice {
  return SORT_OPTIONS.find((option) => option.value === value)?.value ?? "default";
}

// ---------- ขนส่ง ----------

/** `carrierCode` ที่ส่งไปกับ `ShipOrderRequest` — ชื่อที่ผู้ซื้อเห็นคือ `label` */
export const CARRIER_OPTIONS: { value: string; label: string }[] = [
  { value: "KERRY", label: "Kerry Express" },
  { value: "FLASH", label: "Flash Express" },
  { value: "JT", label: "J&T Express" },
  { value: "SPX", label: "SPX Express" },
  { value: "THAILAND_POST_EMS", label: "ไปรษณีย์ไทย EMS" },
  { value: "THAILAND_POST", label: "ไปรษณีย์ไทย ลงทะเบียน" },
];

export function carrierLabel(code: string): string {
  return CARRIER_OPTIONS.find((option) => option.value === code)?.label ?? code;
}

/** ส่งได้ทั้งจาก PAID (ข้ามการกดรับ) และ PREPARING */
export function canShip(status: SellerOrderStatus): boolean {
  return TO_PACK_STATUSES.includes(status);
}

export function canAccept(status: SellerOrderStatus): boolean {
  return status === "PAID";
}

/** ตรงกับ `SellerOrderStatus.CANCELLABLE` — ส่งของออกไปแล้วยกเลิกไม่ได้ */
export function canCancel(status: SellerOrderStatus): boolean {
  return status === "PENDING_PAYMENT" || status === "PAID" || status === "PREPARING";
}

// ---------- ที่อยู่ ----------

/** snapshot เสีย/ว่าง คืน `null` แทนที่จะพังทั้งหน้า */
export function parseShippingAddress(snapshot: string | null): ShippingAddressSnapshot | null {
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

/** ชื่อ / บ้านเลขที่ / ตำบล-อำเภอ-จังหวัด-รหัส / เบอร์ — ข้ามบรรทัดที่ว่าง */
export function addressLines(address: ShippingAddressSnapshot | null): string[] {
  if (!address) {
    return ["ไม่มีที่อยู่จัดส่ง"];
  }
  const street = [address.line1, address.line2].filter(Boolean).join(" ");
  const area = [address.subdistrict, address.district, address.province, address.postalCode]
    .filter(Boolean)
    .join(" ");
  return [
    address.recipientName,
    street,
    area,
    address.phone ? `โทร ${address.phone}` : undefined,
  ].filter((line): line is string => Boolean(line));
}

// ---------- เวลา ----------

const dateTimeFormat = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

const dateFormat = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Bangkok",
});

/** "13 ต.ค. 2569 14:05" */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

/** "เมื่อสักครู่", "เมื่อ 2 ชม. ที่แล้ว", "เมื่อ 3 วันที่แล้ว" */
export function formatAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `เมื่อ ${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `เมื่อ ${hours} ชม. ที่แล้ว`;
  return `เมื่อ ${Math.floor(hours / 24)} วันที่แล้ว`;
}

/** เหลือน้อยกว่านี้ก่อนเลยกำหนดส่ง การ์ดขึ้นกรอบสีส้ม */
const NEAR_DEADLINE_MS = 24 * 60 * 60_000;

/**
 * ออเดอร์ที่ยังต้องแพ็คและใกล้ (หรือเลย) วันที่ร้านสัญญาไว้ — `null` = ไม่ต้องเตือน
 * กำหนดส่งคือวันที่จ่าย + จำนวนวันเตรียมของของร้าน (`shipBy` จาก backend)
 */
export function deadlineLabel(
  status: SellerOrderStatus,
  shipBy: string | null,
  now: Date = new Date(),
): string | null {
  if (!shipBy || !canShip(status)) {
    return null;
  }
  const left = new Date(shipBy).getTime() - now.getTime();
  if (left < 0) return "เลยกำหนดส่ง";
  if (left < NEAR_DEADLINE_MS) return "ใกล้เกินกำหนด";
  return null;
}

/** "ต้องจัดส่งภายใน 15 ต.ค." */
export function shipByLabel(shipBy: string): string {
  return `ต้องจัดส่งภายใน ${dateFormat.format(new Date(shipBy))}`;
}

// ---------- การชำระเงิน ----------

export type PaymentState = "paid" | "pending" | "refunded";

/** ดูจากสถานะออเดอร์ ไม่ใช่จาก payment record — ออเดอร์คือสิ่งที่ร้านต้องตัดสินใจ */
export function paymentStateOf(status: SellerOrderStatus): PaymentState {
  switch (status) {
    case "PENDING_PAYMENT":
      return "pending";
    case "CANCELLED":
    case "REFUNDED":
      return "refunded";
    default:
      return "paid";
  }
}

export const PAYMENT_STATE_LABEL: Record<PaymentState, string> = {
  paid: "ชำระแล้ว",
  pending: "รอชำระ",
  refunded: "ยกเลิก / คืนเงิน",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "โอนผ่านธนาคาร",
  MOCK_GATEWAY: "ช่องทางทดสอบ",
  WALLET: "กระเป๋าเงิน",
  CASH_ON_DELIVERY: "เก็บเงินปลายทาง",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentRecordStatus, string> = {
  PENDING: "รอชำระ",
  AWAITING_VERIFICATION: "รอแอดมินตรวจสลิป",
  SUCCEEDED: "ชำระสำเร็จ",
  FAILED: "ไม่สำเร็จ",
  CANCELLED: "ยกเลิก",
  EXPIRED: "หมดเวลา",
};

export function paymentRows(payment: OrderPayment | null): { id: string; label: string; value: string }[] {
  if (!payment) {
    return [{ id: "status", label: "สถานะ", value: "ผู้ซื้อยังไม่ได้ชำระ" }];
  }
  return [
    { id: "method", label: "ช่องทาง", value: PAYMENT_METHOD_LABEL[payment.method] ?? payment.method },
    { id: "status", label: "สถานะ", value: PAYMENT_STATUS_LABEL[payment.status] ?? payment.status },
    { id: "amount", label: "ยอดที่ชำระ (ทั้งคำสั่งซื้อ)", value: formatBaht(payment.amount) },
    { id: "paid-at", label: "เวลาที่ชำระ", value: payment.paidAt ? formatDateTime(payment.paidAt) : "—" },
  ];
}

// ---------- สินค้า ----------

const CONDITION_LABEL: Record<string, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
  SEALED: "ซีลปิด",
};

/** "EN / FOIL · Near Mint" — บรรทัดรองใต้ชื่อสินค้า */
export function itemMeta(item: OrderItem): string {
  return [item.variantLabel, item.condition ? (CONDITION_LABEL[item.condition] ?? item.condition) : null]
    .filter(Boolean)
    .join(" · ");
}

export function pieceCount(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

// ---------- ไทม์ไลน์และกำไร ----------

export type TimelineEntry = {
  id: string;
  label: string;
  /** เวลาที่เกิด หรือ "กำลังดำเนินการ" / "รอดำเนินการ" */
  detail: string;
  done: boolean;
};

/**
 * ขั้นที่มีเวลาแล้วนับว่าเสร็จ ขั้นแรกที่ยังไม่มีเวลาคือขั้นที่ "กำลังดำเนินการ"
 * "รับออเดอร์" ไม่บังคับ — ถ้าส่งไปแล้วโดยไม่ได้กดรับ ขั้นนั้นถูกตัดทิ้ง
 * ออเดอร์ที่ยกเลิกตัดขั้นที่ไม่ได้เกิดทิ้ง แล้วปิดท้ายด้วยขั้นยกเลิกพร้อมเหตุผล
 */
export function timelineEntries(order: SellerOrderDetails, paidAt: string | null): TimelineEntry[] {
  const steps = [
    { id: "ordered", label: "ผู้ซื้อสั่งซื้อ", at: order.createdAt },
    { id: "paid", label: "ผู้ซื้อชำระเงิน", at: paidAt },
    { id: "accepted", label: "คุณรับออเดอร์ · เริ่มแพ็ค", at: order.acceptedAt },
    { id: "shipped", label: "ส่งพัสดุและกรอกเลขพัสดุ", at: order.shippedAt },
    {
      id: "completed",
      label: "ผู้ซื้อได้รับสินค้า · ปล่อยเงินเข้าบัญชีร้าน",
      at: order.completedAt ?? order.deliveredAt,
    },
  ].filter((step) => step.id !== "accepted" || step.at || !order.shippedAt);

  if (order.cancelledAt) {
    return [
      ...steps
        .filter((step) => step.at)
        .map((step) => ({ id: step.id, label: step.label, detail: formatDateTime(step.at!), done: true })),
      {
        id: "cancelled",
        label: order.cancelReason ? `ยกเลิกคำสั่งซื้อ · ${order.cancelReason}` : "ยกเลิกคำสั่งซื้อ",
        detail: formatDateTime(order.cancelledAt),
        done: true,
      },
    ];
  }

  const currentIndex = steps.findIndex((step) => !step.at);
  return steps.map((step, index) => ({
    id: step.id,
    label: step.label,
    detail: step.at
      ? formatDateTime(step.at)
      : index === currentIndex
        ? "กำลังดำเนินการ"
        : "รอดำเนินการ",
    done: Boolean(step.at),
  }));
}

export type ProfitSummary = {
  rows: { id: string; label: string; value: string }[];
  net: string;
};

/**
 * กำไรของออเดอร์ = ยอดรวม (รวมค่าส่งที่ผู้ซื้อจ่าย) − ค่าคอม − ต้นทุนการ์ด
 * ค่าคอมเป็นอัตราที่ freeze ตอน checkout ต้นทุนเป็นค่าเฉลี่ยที่ freeze ตอนขาย
 * ออเดอร์ที่ยกเลิกไม่มีกำไรให้สรุป
 */
export function profitSummary(detail: SellerOrderDetail): ProfitSummary | null {
  const { order } = detail.summary;
  if (order.status === "CANCELLED") {
    return null;
  }
  return {
    rows: [
      { id: "sales", label: "ยอดขาย (รวมค่าส่ง)", value: formatBaht(order.grandTotal) },
      { id: "commission", label: "− ค่าคอมมิชชั่น", value: formatBaht(order.commissionAmount) },
      { id: "cost", label: "− ต้นทุนสินค้า", value: formatBaht(roundMoney(detail.costTotal)) },
    ],
    net: formatBaht(roundMoney(order.sellerNetAmount - detail.costTotal)),
  };
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** ชื่อสถานะยาวที่ badge ข้างเลขออเดอร์ใช้ */
export function statusTitle(status: SellerOrderStatus): string {
  return SELLER_ORDER_STATUS_LABEL[status];
}

/** "nattapong_p" → "NP", "kandypop" → "KA" */
export function initialsOf(username: string): string {
  const parts = username.split(/[^A-Za-z0-9ก-๙]+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : username.slice(0, 2);
  return letters.toUpperCase();
}

// ---------- error ----------

/** ข้อความภาษาไทยของ error ที่หน้านี้เจอบ่อย ที่เหลือใช้ข้อความจาก backend */
export function orderErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "ORDER_STATUS_TRANSITION")) {
    return "สถานะออเดอร์เปลี่ยนไปแล้ว รีเฟรชแล้วลองใหม่";
  }
  if (hasErrorCode(error, "PAYMENT_UNDER_REVIEW")) {
    return "สลิปของออเดอร์นี้กำลังรอแอดมินตรวจ ยกเลิกได้หลังตรวจเสร็จ";
  }
  if (hasErrorCode(error, "ORDER_NOT_FOUND")) {
    return "ไม่พบคำสั่งซื้อนี้ในร้านของคุณ";
  }
  return getErrorMessage(error, fallback);
}
