import {
  SELLER_ORDER_STATUS_LABEL,
  TO_PACK_STATUSES,
} from "@/features/seller/shared/order-status";
import { formatBaht } from "@/features/seller/shared/seller.format";
import type { SellerOrderStatus } from "@/features/seller/shared/seller.types";
import { hasErrorCode, isApiError, isNetworkError } from "@/lib/api";

import type { DashboardMonthSummary } from "@/features/seller/dashboard/dashboard.types";

import { CARRIER_OPTIONS, carrierLabel } from "../shared/carriers";

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
  ShippingChoice,
} from "./orders.types";
import { dateTimeFormat as lazyDateTimeFormat, translateError, translate } from "@/lib/i18n";

/**
 * ตัวช่วยแปลงค่าดิบจาก `/sellers/me/orders` → ข้อความบนหน้าจัดการคำสั่งซื้อ
 * ไม่มี React — ทดสอบได้ตรง ๆ
 */

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

/** สถานะหลังการขายที่ `ReturnService` ฝั่ง backend เป็นคนขยับ — จัดการได้ที่ `/seller/returns` */
export const RETURN_STATUSES: SellerOrderStatus[] = ["RETURN_REQUESTED", "RETURNED", "REFUNDED"];

export const RETURNS_PATH = "/seller/returns";

/** เรียงตามลำดับงานของร้าน แต่ละสถานะจริงอยู่ในแท็บเดียวเท่านั้น */
export const ORDER_TABS: OrderTabMeta[] = [
  { id: "awaiting_pack", get label() { return translate("seller", "orders.tabs.awaiting_pack", "รอแพ็ค"); }, statuses: TO_PACK_STATUSES, sort: "PAID_OLDEST" },
  { id: "awaiting_payment", get label() { return translate("seller", "orders.tabs.awaiting_payment", "รอชำระ"); }, statuses: ["PENDING_PAYMENT"], sort: "OLDEST" },
  { id: "shipped", get label() { return translate("seller", "orders.tabs.shipped", "กำลังจัดส่ง"); }, statuses: ["SHIPPED", "DELIVERED"], sort: "SHIPPED_NEWEST" },
  { id: "completed", get label() { return translate("seller", "orders.tabs.completed", "สำเร็จ"); }, statuses: ["COMPLETED"], sort: "COMPLETED_NEWEST" },
  { id: "returns", get label() { return translate("seller", "orders.tabs.returns", "คืนสินค้า"); }, statuses: RETURN_STATUSES, sort: "NEWEST" },
  { id: "cancelled", get label() { return translate("seller", "orders.tabs.cancelled", "ยกเลิก"); }, statuses: ["CANCELLED"], sort: "NEWEST" },
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

/**
 * "8 ออเดอร์รอแพ็ค · 34 กำลังจัดส่ง" — ตัวเลขชุดเดียวกับชิป
 * ระหว่างโหลดห้ามขึ้น 0 ผู้ขายจะเข้าใจว่าไม่มีงาน ทั้งที่อาจมีออเดอร์รออยู่
 */
export function ordersSubtitle(counts: SellerOrderCounts | undefined): string {
  if (counts === undefined) {
    return translate("seller", "orders.subtitle.counting", "กำลังนับออเดอร์…");
  }
  const toPack = countOf(counts, TO_PACK_STATUSES);
  const shipping = countOf(counts, ["SHIPPED", "DELIVERED"]);
  return translate("seller", "orders.subtitle.summary", "{toPack} ออเดอร์รอแพ็ค · {shipping} กำลังจัดส่ง · จัดส่งให้ทันกำหนดเพื่อรักษาคะแนนร้าน", { toPack, shipping });
}

/** "default" = ใช้ลำดับของแท็บนั้น */
export type SortChoice = "default" | "NEWEST" | "OLDEST" | "TOTAL_DESC";

export const SORT_OPTIONS: { value: SortChoice; label: string }[] = [
  { value: "default", get label() { return translate("seller", "orders.sort.default", "เรียง: ด่วนที่สุดก่อน"); } },
  { value: "NEWEST", get label() { return translate("seller", "orders.sort.newest", "เรียง: ใหม่สุดก่อน"); } },
  { value: "OLDEST", get label() { return translate("seller", "orders.sort.oldest", "เรียง: เก่าสุดก่อน"); } },
  { value: "TOTAL_DESC", get label() { return translate("seller", "orders.sort.totalDesc", "เรียง: ยอดสูง-ต่ำ"); } },
];

export function sortOf(value: string | null): SortChoice {
  return SORT_OPTIONS.find((option) => option.value === value)?.value ?? "default";
}

// ---------- ขนส่ง ----------

/** `carrierCode` ที่ส่งไปกับ `ShipOrderRequest` — ชื่อที่ผู้ซื้อเห็นคือ `label` */
export { CARRIER_OPTIONS, carrierLabel } from "../shared/carriers";

/** ขนส่งที่ผู้ซื้อเลือก เฉพาะที่อยู่ในรายการให้เลือก รหัสอื่นถือว่าเลือกแทนให้ไม่ได้ */
export function buyerCarrierCode(choice: ShippingChoice | null): string | null {
  const code = choice?.carrierCode;
  return code && CARRIER_OPTIONS.some((option) => option.value === code) ? code : null;
}

/** ค่าเริ่มต้นของช่องขนส่ง — `""` คือให้ผู้ขายเลือกเอง ออเดอร์ที่ไม่มี snapshot ใช้ตัวแรกตามเดิม */
export function defaultCarrier(choice: ShippingChoice | null): string {
  return choice ? (buyerCarrierCode(choice) ?? "") : CARRIER_OPTIONS[0].value;
}

export type CarrierMatch = "matches" | "differs" | "unset" | null;

/** ค่าในช่องขนส่งเทียบกับที่ผู้ซื้อเลือก — `null` คือไม่มีอะไรต้องบอกผู้ขาย */
export function carrierMatch(choice: ShippingChoice | null, carrier: string): CarrierMatch {
  if (!choice) return null;
  const buyerCode = buyerCarrierCode(choice);
  if (buyerCode === null) return carrier === "" ? "unset" : null;
  return carrier === buyerCode ? "matches" : "differs";
}

/** chip ในกล่องการจัดส่งที่ผู้ซื้อเลือก */
export function buyerCarrierChipLabel(choice: ShippingChoice): string {
  return choice.carrierCode ? carrierLabel(choice.carrierCode) : translate("seller", "orders.carrier.unspecified", "ไม่ระบุขนส่ง");
}

/** chip ในหน้ารายการ — ตัวเลือกที่ไม่ผูกขนส่งแสดงชื่อตัวเลือกแทน */
export function listCarrierChipLabel(choice: ShippingChoice): string {
  return choice.carrierCode ? carrierLabel(choice.carrierCode) : choice.name;
}

/** "1–2" หรือ "1" — `null` เมื่อร้านไม่ได้ระบุ */
export function estDaysLabel(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min === null || max === null || min === max) return String(min ?? max);
  return `${min}–${max}`;
}

/** บรรทัดใน dialog ยืนยันจัดส่ง — เฉพาะตอนส่งด้วยขนส่งที่ไม่ตรงกับที่ผู้ซื้อเลือก */
export function buyerChoiceNote(choice: ShippingChoice | null, match: CarrierMatch): string | null {
  return choice && match === "differs"
    ? translate("seller", "orders.carrier.buyerChose", "ผู้ซื้อเลือก: {name} ({carrier})", { name: choice.name, carrier: buyerCarrierChipLabel(choice) })
    : null;
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

/** อยู่ในขั้นตอนคืนสินค้า หรือจบด้วยการคืนเงิน — หน้ารายละเอียดลิงก์ไป `/seller/returns` */
export function isReturnStatus(status: SellerOrderStatus): boolean {
  return RETURN_STATUSES.includes(status);
}

/** คำขอคืนยังไม่ได้ข้อสรุป เงินของออเดอร์ยังถูกพักไว้ */
export function isReturnOpen(status: SellerOrderStatus): boolean {
  return status === "RETURN_REQUESTED" || status === "RETURNED";
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
    return [translate("seller", "orders.address.none", "ไม่มีที่อยู่จัดส่ง")];
  }
  const street = [address.line1, address.line2].filter(Boolean).join(" ");
  const area = [address.subdistrict, address.district, address.province, address.postalCode]
    .filter(Boolean)
    .join(" ");
  return [
    address.recipientName,
    street,
    area,
    address.phone ? translate("seller", "orders.address.phone", "โทร {phone}", { phone: address.phone }) : undefined,
  ].filter((line): line is string => Boolean(line));
}

// ---------- เวลา ----------

const dateTimeFormat = lazyDateTimeFormat({
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

const dateFormat = lazyDateTimeFormat({
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
  if (minutes < 1) return translate("seller", "orders.ago.justNow", "เมื่อสักครู่");
  if (minutes < 60) return translate("seller", "orders.ago.minutes", "เมื่อ {minutes} นาทีที่แล้ว", { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate("seller", "orders.ago.hours", "เมื่อ {hours} ชม. ที่แล้ว", { hours });
  return translate("seller", "orders.ago.days", "เมื่อ {days} วันที่แล้ว", { days: Math.floor(hours / 24) });
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
  if (left < 0) return translate("seller", "orders.deadline.overdue", "เลยกำหนดส่ง");
  if (left < NEAR_DEADLINE_MS) return translate("seller", "orders.deadline.near", "ใกล้เกินกำหนด");
  return null;
}

/** "ต้องจัดส่งภายใน 15 ต.ค." */
export function shipByLabel(shipBy: string): string {
  return translate("seller", "orders.deadline.shipBy", "ต้องจัดส่งภายใน {date}", { date: dateFormat.format(new Date(shipBy)) });
}

// ---------- การชำระเงิน ----------

export type PaymentState = "paid" | "pending" | "refunded" | "cancelled";

/**
 * ดูจากสถานะออเดอร์ ไม่ใช่จาก payment record — ออเดอร์คือสิ่งที่ร้านต้องตัดสินใจ
 * ยกเลิกก่อนผู้ซื้อจ่าย (`paidAt` ว่าง) ไม่มีเงินให้คืน จึงเป็นแค่ "ยกเลิก"
 */
export function paymentStateOf(status: SellerOrderStatus, paidAt: string | null): PaymentState {
  switch (status) {
    case "PENDING_PAYMENT":
      return "pending";
    case "CANCELLED":
      return paidAt ? "refunded" : "cancelled";
    case "REFUNDED":
      return "refunded";
    default:
      return "paid";
  }
}

export const PAYMENT_STATE_LABEL: Record<PaymentState, string> = {
  get paid() { return translate("seller", "orders.paymentState.paid", "ชำระแล้ว"); },
  get pending() { return translate("seller", "orders.paymentState.pending", "รอชำระ"); },
  get refunded() { return translate("seller", "orders.paymentState.refunded", "ยกเลิก / คืนเงิน"); },
  get cancelled() { return translate("seller", "orders.paymentState.cancelled", "ยกเลิก"); },
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  get BANK_TRANSFER() { return translate("seller", "orders.paymentMethod.BANK_TRANSFER", "โอนผ่านธนาคาร"); },
  get MOCK_GATEWAY() { return translate("seller", "orders.paymentMethod.MOCK_GATEWAY", "ช่องทางทดสอบ"); },
  get WALLET() { return translate("seller", "orders.paymentMethod.WALLET", "กระเป๋าเงิน"); },
  get CASH_ON_DELIVERY() { return translate("seller", "orders.paymentMethod.CASH_ON_DELIVERY", "เก็บเงินปลายทาง"); },
};

export const PAYMENT_STATUS_LABEL: Record<PaymentRecordStatus, string> = {
  get PENDING() { return translate("seller", "orders.paymentStatus.PENDING", "รอชำระ"); },
  get AWAITING_VERIFICATION() { return translate("seller", "orders.paymentStatus.AWAITING_VERIFICATION", "รอแอดมินตรวจสลิป"); },
  get SUCCEEDED() { return translate("seller", "orders.paymentStatus.SUCCEEDED", "ชำระสำเร็จ"); },
  get FAILED() { return translate("seller", "orders.paymentStatus.FAILED", "ไม่สำเร็จ"); },
  get CANCELLED() { return translate("seller", "orders.paymentStatus.CANCELLED", "ยกเลิก"); },
  get EXPIRED() { return translate("seller", "orders.paymentStatus.EXPIRED", "หมดเวลา"); },
};

/**
 * ชื่อแถวยอดเงินตามสถานะของรายการชำระ — ไม่มีชื่อ = ไม่แสดงยอด
 * ระบบสร้างรายการชำระไว้ตั้งแต่ผู้ซื้อเปิดหน้าโอนเงิน ยอดจึงมีอยู่แม้เงินยังไม่เข้า
 * เรียกว่า "ยอดที่ชำระ" ได้เฉพาะตอนสำเร็จ ส่วนรายการที่ล้มเหลว/ยกเลิก/หมดเวลาไม่มีเงินเข้าเลย
 */
const PAYMENT_AMOUNT_LABEL: Partial<Record<PaymentRecordStatus, string>> = {
  get SUCCEEDED() { return translate("seller", "orders.paymentAmount.SUCCEEDED", "ยอดที่ชำระ (ทั้งคำสั่งซื้อ)"); },
  get PENDING() { return translate("seller", "orders.paymentAmount.PENDING", "ยอดที่ต้องชำระ (ทั้งคำสั่งซื้อ)"); },
  get AWAITING_VERIFICATION() { return translate("seller", "orders.paymentAmount.AWAITING_VERIFICATION", "ยอดที่แจ้งโอน (ทั้งคำสั่งซื้อ)"); },
};

export function paymentRows(payment: OrderPayment | null): { id: string; label: string; value: string }[] {
  if (!payment) {
    return [{ id: "status", label: translate("seller", "orders.payment.status", "สถานะ"), value: translate("seller", "orders.payment.notPaid", "ผู้ซื้อยังไม่ได้ชำระ") }];
  }
  const amountLabel = PAYMENT_AMOUNT_LABEL[payment.status];
  return [
    { id: "method", label: translate("seller", "orders.payment.method", "ช่องทาง"), value: PAYMENT_METHOD_LABEL[payment.method] ?? payment.method },
    { id: "status", label: translate("seller", "orders.payment.status", "สถานะ"), value: PAYMENT_STATUS_LABEL[payment.status] ?? payment.status },
    ...(amountLabel ? [{ id: "amount", label: amountLabel, value: formatBaht(payment.amount) }] : []),
    ...(payment.paidAt
      ? [{ id: "paid-at", label: translate("seller", "orders.payment.paidAt", "เวลาที่ชำระ"), value: formatDateTime(payment.paidAt) }]
      : []),
  ];
}

// ---------- สินค้า ----------

const CONDITION_LABEL: Record<string, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
  get SEALED() { return translate("seller", "orders.condition.sealed", "ซีลปิด"); },
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

const RETURN_STEP_LABEL: Partial<Record<SellerOrderStatus, string>> = {
  get RETURN_REQUESTED() { return translate("seller", "orders.timeline.returnRequested", "ผู้ซื้อขอคืนสินค้า"); },
  get RETURNED() { return translate("seller", "orders.timeline.returned", "ร้านได้รับสินค้าคืน"); },
  get REFUNDED() { return translate("seller", "orders.timeline.refunded", "คืนเงินให้ผู้ซื้อแล้ว"); },
};

type TimelineStep = { id: string; label: string; at: string | null };

/** เวลาล่าสุดที่ออเดอร์เข้าสถานะนี้ตาม `statusHistory` — `null` = ไม่เคยเข้า */
function enteredAt(order: SellerOrderDetails, status: SellerOrderStatus): string | null {
  return order.statusHistory.findLast((entry) => entry.toStatus === status)?.createdAt ?? null;
}

/**
 * ขั้นที่มีเวลาแล้วนับว่าเสร็จ ขั้นแรกที่ยังไม่มีเวลาคือขั้นที่ "กำลังดำเนินการ"
 * "รับออเดอร์" กับ "พัสดุถึงผู้ซื้อ" ไม่บังคับ — ไม่เกิดก็ถูกตัดทิ้ง
 * ออเดอร์ที่ยกเลิกตัดขั้นที่ไม่ได้เกิดทิ้ง แล้วปิดท้ายด้วยขั้นยกเลิกพร้อมเหตุผล
 *
 * ขั้นคืนสินค้ามาจาก `statusHistory` เพราะออเดอร์ไม่มีคอลัมน์เวลาของสถานะพวกนี้
 * เงินปล่อยให้ร้านตอน COMPLETED เท่านั้น — พัสดุถึงแล้ว (DELIVERED) หรือกำลังคืนสินค้า
 * เงินยังพักอยู่ จึงไม่ขึ้นว่าปล่อยเงินแล้ว และออเดอร์ที่จบด้วย REFUNDED ไม่มีขั้นปล่อยเงินเลย
 */
export function timelineEntries(order: SellerOrderDetails, paidAt: string | null): TimelineEntry[] {
  const returnSteps: TimelineStep[] = order.statusHistory.flatMap((entry) => {
    const label = RETURN_STEP_LABEL[entry.toStatus];
    return label ? [{ id: `${entry.toStatus.toLowerCase()}-${entry.id}`, label, at: entry.createdAt }] : [];
  });

  const closingSteps: TimelineStep[] = isReturnOpen(order.status)
    ? [{ id: "return-resolution", label: translate("seller", "orders.timeline.returnResolution", "สรุปผลคำขอคืนสินค้า"), at: null }]
    : order.status === "REFUNDED"
      ? []
      : [
          {
            id: "completed",
            label: translate("seller", "orders.timeline.completed", "ผู้ซื้อได้รับสินค้า · ปล่อยเงินเข้าบัญชีร้าน"),
            at: order.completedAt ?? enteredAt(order, "COMPLETED"),
          },
        ];

  const steps: TimelineStep[] = [
    { id: "ordered", label: translate("seller", "orders.timeline.ordered", "ผู้ซื้อสั่งซื้อ"), at: order.createdAt },
    { id: "paid", label: translate("seller", "orders.timeline.paid", "ผู้ซื้อชำระเงิน"), at: paidAt },
    { id: "accepted", label: translate("seller", "orders.timeline.accepted", "คุณรับออเดอร์ · เริ่มแพ็ค"), at: order.acceptedAt },
    { id: "shipped", label: translate("seller", "orders.timeline.shipped", "ส่งพัสดุและกรอกเลขพัสดุ"), at: order.shippedAt },
    { id: "delivered", label: translate("seller", "orders.timeline.delivered", "พัสดุถึงผู้ซื้อ"), at: order.deliveredAt },
    ...returnSteps,
    ...closingSteps,
  ].filter(
    (step) =>
      (step.id !== "accepted" || step.at || !order.shippedAt) &&
      (step.id !== "delivered" || step.at),
  );

  if (order.cancelledAt) {
    return [
      ...steps
        .filter((step) => step.at)
        .map((step) => ({ id: step.id, label: step.label, detail: formatDateTime(step.at!), done: true })),
      {
        id: "cancelled",
        label: order.cancelReason
          ? translate("seller", "orders.timeline.cancelledWithReason", "ยกเลิกคำสั่งซื้อ · {reason}", { reason: order.cancelReason })
          : translate("seller", "orders.timeline.cancelled", "ยกเลิกคำสั่งซื้อ"),
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
        ? translate("seller", "orders.timeline.inProgress", "กำลังดำเนินการ")
        : translate("seller", "orders.timeline.waiting", "รอดำเนินการ"),
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
  const hasPromotionDiscount = (order.sellerDiscount ?? 0) > 0 || (order.platformDiscount ?? 0) > 0;
  return {
    rows: [
      ...(hasPromotionDiscount
        ? []
        : [
            { id: "sales", label: translate("seller", "orders.money.salesWithShipping", "ยอดขาย (รวมค่าส่ง)"), value: formatBaht(order.grandTotal) },
            { id: "commission", label: translate("seller", "orders.profit.commission", "− ค่าคอมมิชชั่น"), value: formatBaht(order.commissionAmount) },
          ]),
      { id: "cost", label: translate("seller", "orders.profit.cost", "− ต้นทุนสินค้า"), value: formatBaht(roundMoney(detail.costTotal)) },
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

// ---------- คอลัมน์ขวาของหน้ารายการ ----------

export type MonthlySummary = {
  title: string;
  rows: { id: string; label: string; value: string; tone: "default" | "muted" }[];
  netLabel: string;
  netValue: string;
};

/**
 * ผลประกอบการเดือนนี้ — ตัวเลขชุดเดียวกับแดชบอร์ด (`/sellers/me/dashboard` → `month`)
 * ยอดขายรวมค่าส่งที่ผู้ซื้อจ่าย ค่าคอมคืออัตราที่ freeze ตอน checkout
 */
export function monthlySummary(month: DashboardMonthSummary): MonthlySummary {
  return {
    title: translate("seller", "orders.monthly.title", "ผลประกอบการเดือนนี้"),
    rows: [
      // แดชบอร์ดแสดงยอดเดือนเดียวกันแบบไม่รวมค่าส่ง ป้ายจึงต้องบอกว่ายอดนี้รวม
      { id: "sales", label: translate("seller", "orders.money.salesWithShipping", "ยอดขาย (รวมค่าส่ง)"), value: formatBaht(month.revenue), tone: "default" },
      { id: "cost", label: translate("seller", "orders.monthly.cost", "ต้นทุนสินค้า"), value: `− ${formatBaht(roundMoney(month.cost))}`, tone: "muted" },
      { id: "commission", label: translate("seller", "orders.monthly.commission", "ค่าคอมมิชชั่น"), value: `− ${formatBaht(month.commission)}`, tone: "muted" },
    ],
    netLabel: translate("seller", "orders.money.net", "กำไรสุทธิ"),
    netValue: formatBaht(roundMoney(month.net)),
  };
}

export function shippingSteps() {
  return {
    title: translate("seller", "orders.shippingSteps.title", "ขั้นตอนการจัดส่ง"),
    items: [
      { id: "accept", label: translate("seller", "orders.shippingSteps.accept", "กดรับออเดอร์ให้ผู้ซื้อรู้ว่าเริ่มแพ็คแล้ว") },
      { id: "pack", label: translate("seller", "orders.shippingSteps.pack", "แพ็คการ์ดด้วย Top Loader") },
      { id: "photo", label: translate("seller", "orders.shippingSteps.photo", "ถ่ายรูปก่อนปิดกล่อง") },
      { id: "tracking", label: translate("seller", "orders.shippingSteps.tracking", "กรอกขนส่งและเลขพัสดุ") },
      { id: "confirm", label: translate("seller", "orders.shippingSteps.confirm", "กดยืนยันจัดส่ง") },
    ],
  };
}

export function packingTip() {
  return {
    title: translate("seller", "orders.tip.title", "เคล็ดลับ"),
    description: translate("seller", "orders.tip.description", "ส่งให้ทันวันที่ร้านกำหนดไว้ เงินจะเข้าบัญชีร้านเมื่อผู้ซื้อยืนยันรับสินค้า หรือครบกำหนดหลังส่ง"),
  };
}

// ---------- error ----------

/** ข้อความภาษาไทยของ error ที่หน้านี้เจอบ่อย ที่เหลือใช้ข้อความจาก backend */
export function orderErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "ORDER_STATUS_TRANSITION")) {
    return translate("seller", "orders.errors.statusChanged", "สถานะออเดอร์เปลี่ยนไปแล้ว รีเฟรชแล้วลองใหม่");
  }
  if (hasErrorCode(error, "PAYMENT_UNDER_REVIEW")) {
    return translate("seller", "orders.errors.underReview", "สลิปของออเดอร์นี้กำลังรอแอดมินตรวจ ยกเลิกได้หลังตรวจเสร็จ");
  }
  if (hasErrorCode(error, "ORDER_NOT_FOUND")) {
    return translate("seller", "orders.errors.notFound", "ไม่พบคำสั่งซื้อนี้ในร้านของคุณ");
  }
  return translateError(error, fallback);
}

export function orderSummaryDownloadErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return translate("seller", "orders.errors.network", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่");
  }
  if (isApiError(error)) {
    switch (error.status) {
      case 401:
        return translate("seller", "orders.errors.sessionExpired", "เซสชันหมดอายุ กรุณาเข้าสู่ระบบแล้วลองใหม่");
      case 403:
        return translate("seller", "orders.errors.forbidden", "บัญชีนี้ไม่มีสิทธิ์ดาวน์โหลดเอกสารของร้าน");
      case 404:
        return translate("seller", "orders.errors.notFound", "ไม่พบคำสั่งซื้อนี้ในร้านของคุณ");
      default:
        if (error.status >= 500) return translate("seller", "orders.errors.pdfServer", "ระบบสร้าง PDF ขัดข้อง กรุณาลองใหม่อีกครั้ง");
    }
  }
  return translateError(error, translate("seller", "orders.errors.pdfFailed", "ดาวน์โหลด PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"));
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "orders.tabs.awaiting_pack", "ns": "seller", "defaultValue": "รอแพ็ค"}
// @tolgee-key {"key": "orders.tabs.awaiting_payment", "ns": "seller", "defaultValue": "รอชำระ"}
// @tolgee-key {"key": "orders.tabs.shipped", "ns": "seller", "defaultValue": "กำลังจัดส่ง"}
// @tolgee-key {"key": "orders.tabs.completed", "ns": "seller", "defaultValue": "สำเร็จ"}
// @tolgee-key {"key": "orders.tabs.returns", "ns": "seller", "defaultValue": "คืนสินค้า"}
// @tolgee-key {"key": "orders.tabs.cancelled", "ns": "seller", "defaultValue": "ยกเลิก"}
// @tolgee-key {"key": "orders.subtitle.counting", "ns": "seller", "defaultValue": "กำลังนับออเดอร์…"}
// @tolgee-key {"key": "orders.subtitle.summary", "ns": "seller", "defaultValue": "{toPack} ออเดอร์รอแพ็ค · {shipping} กำลังจัดส่ง · จัดส่งให้ทันกำหนดเพื่อรักษาคะแนนร้าน"}
// @tolgee-key {"key": "orders.sort.default", "ns": "seller", "defaultValue": "เรียง: ด่วนที่สุดก่อน"}
// @tolgee-key {"key": "orders.sort.newest", "ns": "seller", "defaultValue": "เรียง: ใหม่สุดก่อน"}
// @tolgee-key {"key": "orders.sort.oldest", "ns": "seller", "defaultValue": "เรียง: เก่าสุดก่อน"}
// @tolgee-key {"key": "orders.sort.totalDesc", "ns": "seller", "defaultValue": "เรียง: ยอดสูง-ต่ำ"}
// @tolgee-key {"key": "orders.carrier.unspecified", "ns": "seller", "defaultValue": "ไม่ระบุขนส่ง"}
// @tolgee-key {"key": "orders.carrier.buyerChose", "ns": "seller", "defaultValue": "ผู้ซื้อเลือก: {name} ({carrier})"}
// @tolgee-key {"key": "orders.address.none", "ns": "seller", "defaultValue": "ไม่มีที่อยู่จัดส่ง"}
// @tolgee-key {"key": "orders.address.phone", "ns": "seller", "defaultValue": "โทร {phone}"}
// @tolgee-key {"key": "orders.ago.justNow", "ns": "seller", "defaultValue": "เมื่อสักครู่"}
// @tolgee-key {"key": "orders.ago.minutes", "ns": "seller", "defaultValue": "เมื่อ {minutes} นาทีที่แล้ว"}
// @tolgee-key {"key": "orders.ago.hours", "ns": "seller", "defaultValue": "เมื่อ {hours} ชม. ที่แล้ว"}
// @tolgee-key {"key": "orders.ago.days", "ns": "seller", "defaultValue": "เมื่อ {days} วันที่แล้ว"}
// @tolgee-key {"key": "orders.deadline.overdue", "ns": "seller", "defaultValue": "เลยกำหนดส่ง"}
// @tolgee-key {"key": "orders.deadline.near", "ns": "seller", "defaultValue": "ใกล้เกินกำหนด"}
// @tolgee-key {"key": "orders.deadline.shipBy", "ns": "seller", "defaultValue": "ต้องจัดส่งภายใน {date}"}
// @tolgee-key {"key": "orders.paymentState.paid", "ns": "seller", "defaultValue": "ชำระแล้ว"}
// @tolgee-key {"key": "orders.paymentState.pending", "ns": "seller", "defaultValue": "รอชำระ"}
// @tolgee-key {"key": "orders.paymentState.refunded", "ns": "seller", "defaultValue": "ยกเลิก / คืนเงิน"}
// @tolgee-key {"key": "orders.paymentState.cancelled", "ns": "seller", "defaultValue": "ยกเลิก"}
// @tolgee-key {"key": "orders.paymentMethod.BANK_TRANSFER", "ns": "seller", "defaultValue": "โอนผ่านธนาคาร"}
// @tolgee-key {"key": "orders.paymentMethod.MOCK_GATEWAY", "ns": "seller", "defaultValue": "ช่องทางทดสอบ"}
// @tolgee-key {"key": "orders.paymentMethod.WALLET", "ns": "seller", "defaultValue": "กระเป๋าเงิน"}
// @tolgee-key {"key": "orders.paymentMethod.CASH_ON_DELIVERY", "ns": "seller", "defaultValue": "เก็บเงินปลายทาง"}
// @tolgee-key {"key": "orders.paymentStatus.PENDING", "ns": "seller", "defaultValue": "รอชำระ"}
// @tolgee-key {"key": "orders.paymentStatus.AWAITING_VERIFICATION", "ns": "seller", "defaultValue": "รอแอดมินตรวจสลิป"}
// @tolgee-key {"key": "orders.paymentStatus.SUCCEEDED", "ns": "seller", "defaultValue": "ชำระสำเร็จ"}
// @tolgee-key {"key": "orders.paymentStatus.FAILED", "ns": "seller", "defaultValue": "ไม่สำเร็จ"}
// @tolgee-key {"key": "orders.paymentStatus.CANCELLED", "ns": "seller", "defaultValue": "ยกเลิก"}
// @tolgee-key {"key": "orders.paymentStatus.EXPIRED", "ns": "seller", "defaultValue": "หมดเวลา"}
// @tolgee-key {"key": "orders.paymentAmount.SUCCEEDED", "ns": "seller", "defaultValue": "ยอดที่ชำระ (ทั้งคำสั่งซื้อ)"}
// @tolgee-key {"key": "orders.paymentAmount.PENDING", "ns": "seller", "defaultValue": "ยอดที่ต้องชำระ (ทั้งคำสั่งซื้อ)"}
// @tolgee-key {"key": "orders.paymentAmount.AWAITING_VERIFICATION", "ns": "seller", "defaultValue": "ยอดที่แจ้งโอน (ทั้งคำสั่งซื้อ)"}
// @tolgee-key {"key": "orders.payment.status", "ns": "seller", "defaultValue": "สถานะ"}
// @tolgee-key {"key": "orders.payment.notPaid", "ns": "seller", "defaultValue": "ผู้ซื้อยังไม่ได้ชำระ"}
// @tolgee-key {"key": "orders.payment.method", "ns": "seller", "defaultValue": "ช่องทาง"}
// @tolgee-key {"key": "orders.payment.paidAt", "ns": "seller", "defaultValue": "เวลาที่ชำระ"}
// @tolgee-key {"key": "orders.condition.sealed", "ns": "seller", "defaultValue": "ซีลปิด"}
// @tolgee-key {"key": "orders.timeline.returnRequested", "ns": "seller", "defaultValue": "ผู้ซื้อขอคืนสินค้า"}
// @tolgee-key {"key": "orders.timeline.returned", "ns": "seller", "defaultValue": "ร้านได้รับสินค้าคืน"}
// @tolgee-key {"key": "orders.timeline.refunded", "ns": "seller", "defaultValue": "คืนเงินให้ผู้ซื้อแล้ว"}
// @tolgee-key {"key": "orders.timeline.returnResolution", "ns": "seller", "defaultValue": "สรุปผลคำขอคืนสินค้า"}
// @tolgee-key {"key": "orders.timeline.completed", "ns": "seller", "defaultValue": "ผู้ซื้อได้รับสินค้า · ปล่อยเงินเข้าบัญชีร้าน"}
// @tolgee-key {"key": "orders.timeline.ordered", "ns": "seller", "defaultValue": "ผู้ซื้อสั่งซื้อ"}
// @tolgee-key {"key": "orders.timeline.paid", "ns": "seller", "defaultValue": "ผู้ซื้อชำระเงิน"}
// @tolgee-key {"key": "orders.timeline.accepted", "ns": "seller", "defaultValue": "คุณรับออเดอร์ · เริ่มแพ็ค"}
// @tolgee-key {"key": "orders.timeline.shipped", "ns": "seller", "defaultValue": "ส่งพัสดุและกรอกเลขพัสดุ"}
// @tolgee-key {"key": "orders.timeline.delivered", "ns": "seller", "defaultValue": "พัสดุถึงผู้ซื้อ"}
// @tolgee-key {"key": "orders.timeline.cancelledWithReason", "ns": "seller", "defaultValue": "ยกเลิกคำสั่งซื้อ · {reason}"}
// @tolgee-key {"key": "orders.timeline.cancelled", "ns": "seller", "defaultValue": "ยกเลิกคำสั่งซื้อ"}
// @tolgee-key {"key": "orders.timeline.inProgress", "ns": "seller", "defaultValue": "กำลังดำเนินการ"}
// @tolgee-key {"key": "orders.timeline.waiting", "ns": "seller", "defaultValue": "รอดำเนินการ"}
// @tolgee-key {"key": "orders.money.salesWithShipping", "ns": "seller", "defaultValue": "ยอดขาย (รวมค่าส่ง)"}
// @tolgee-key {"key": "orders.profit.commission", "ns": "seller", "defaultValue": "− ค่าคอมมิชชั่น"}
// @tolgee-key {"key": "orders.profit.cost", "ns": "seller", "defaultValue": "− ต้นทุนสินค้า"}
// @tolgee-key {"key": "orders.monthly.title", "ns": "seller", "defaultValue": "ผลประกอบการเดือนนี้"}
// @tolgee-key {"key": "orders.monthly.cost", "ns": "seller", "defaultValue": "ต้นทุนสินค้า"}
// @tolgee-key {"key": "orders.monthly.commission", "ns": "seller", "defaultValue": "ค่าคอมมิชชั่น"}
// @tolgee-key {"key": "orders.money.net", "ns": "seller", "defaultValue": "กำไรสุทธิ"}
// @tolgee-key {"key": "orders.shippingSteps.title", "ns": "seller", "defaultValue": "ขั้นตอนการจัดส่ง"}
// @tolgee-key {"key": "orders.shippingSteps.accept", "ns": "seller", "defaultValue": "กดรับออเดอร์ให้ผู้ซื้อรู้ว่าเริ่มแพ็คแล้ว"}
// @tolgee-key {"key": "orders.shippingSteps.pack", "ns": "seller", "defaultValue": "แพ็คการ์ดด้วย Top Loader"}
// @tolgee-key {"key": "orders.shippingSteps.photo", "ns": "seller", "defaultValue": "ถ่ายรูปก่อนปิดกล่อง"}
// @tolgee-key {"key": "orders.shippingSteps.tracking", "ns": "seller", "defaultValue": "กรอกขนส่งและเลขพัสดุ"}
// @tolgee-key {"key": "orders.shippingSteps.confirm", "ns": "seller", "defaultValue": "กดยืนยันจัดส่ง"}
// @tolgee-key {"key": "orders.tip.title", "ns": "seller", "defaultValue": "เคล็ดลับ"}
// @tolgee-key {"key": "orders.tip.description", "ns": "seller", "defaultValue": "ส่งให้ทันวันที่ร้านกำหนดไว้ เงินจะเข้าบัญชีร้านเมื่อผู้ซื้อยืนยันรับสินค้า หรือครบกำหนดหลังส่ง"}
// @tolgee-key {"key": "orders.errors.statusChanged", "ns": "seller", "defaultValue": "สถานะออเดอร์เปลี่ยนไปแล้ว รีเฟรชแล้วลองใหม่"}
// @tolgee-key {"key": "orders.errors.underReview", "ns": "seller", "defaultValue": "สลิปของออเดอร์นี้กำลังรอแอดมินตรวจ ยกเลิกได้หลังตรวจเสร็จ"}
// @tolgee-key {"key": "orders.errors.notFound", "ns": "seller", "defaultValue": "ไม่พบคำสั่งซื้อนี้ในร้านของคุณ"}
// @tolgee-key {"key": "orders.errors.network", "ns": "seller", "defaultValue": "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่"}
// @tolgee-key {"key": "orders.errors.sessionExpired", "ns": "seller", "defaultValue": "เซสชันหมดอายุ กรุณาเข้าสู่ระบบแล้วลองใหม่"}
// @tolgee-key {"key": "orders.errors.forbidden", "ns": "seller", "defaultValue": "บัญชีนี้ไม่มีสิทธิ์ดาวน์โหลดเอกสารของร้าน"}
// @tolgee-key {"key": "orders.errors.pdfServer", "ns": "seller", "defaultValue": "ระบบสร้าง PDF ขัดข้อง กรุณาลองใหม่อีกครั้ง"}
// @tolgee-key {"key": "orders.errors.pdfFailed", "ns": "seller", "defaultValue": "ดาวน์โหลด PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"}
