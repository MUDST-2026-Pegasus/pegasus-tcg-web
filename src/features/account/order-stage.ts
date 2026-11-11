import type { OrderDetails, SellerOrderDetails } from "./orders.types";
import { formatDateTime } from "@/lib/i18n";
import { translate } from "@/lib/i18n";

// @tolgee-key {"key": "account.stage.AWAITING_PAYMENT", "ns": "buyer", "defaultValue": "รอชำระเงิน"}
// @tolgee-key {"key": "account.stage.PAYMENT_REVIEW", "ns": "buyer", "defaultValue": "กำลังตรวจสอบการชำระเงิน"}
// @tolgee-key {"key": "account.stage.PREPARING", "ns": "buyer", "defaultValue": "กำลังเตรียมสินค้า"}
// @tolgee-key {"key": "account.stage.IN_TRANSIT", "ns": "buyer", "defaultValue": "กำลังจัดส่ง"}
// @tolgee-key {"key": "account.stage.RETURN_IN_PROGRESS", "ns": "buyer", "defaultValue": "ขอคืนสินค้าแล้ว"}
// @tolgee-key {"key": "account.stage.COMPLETED", "ns": "buyer", "defaultValue": "สำเร็จ"}
// @tolgee-key {"key": "account.stage.CANCELLED", "ns": "buyer", "defaultValue": "ยกเลิกแล้ว"}
// @tolgee-key {"key": "account.stage.REFUNDED", "ns": "buyer", "defaultValue": "คืนเงินแล้ว"}

/**
 * Where a buyer's order is in the checkout → payout flow, as the order card shows it.
 *
 * The API rolls `sales_order.status` up from its seller orders and keeps it at PAID
 * from payment until delivery, so the card cannot read "shipped" or "return
 * requested" off the parent alone — it looks at the children for those.
 */
export type OrderStage =
  | "AWAITING_PAYMENT"
  | "PAYMENT_REVIEW"
  | "PREPARING"
  | "IN_TRANSIT"
  | "RETURN_IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type OrderStageInfo = {
  stage: OrderStage;
  label: string;
  /** Badge colours; matches the dot badges in Figma 03 Order History. */
  badgeClassName: string;
};

const IN_TRANSIT = ["SHIPPED", "DELIVERED"];
const PREPARING = ["PAID", "PREPARING"];
// RETURNED is not final: the refund is still being paid out after the seller gets the parcel back.
const RETURNING = ["RETURN_REQUESTED", "RETURNED"];

const stageInfo: Record<OrderStage, Omit<OrderStageInfo, "stage">> = {
  AWAITING_PAYMENT: { get label() { return translate("buyer", "account.stage.AWAITING_PAYMENT", "รอชำระเงิน"); }, badgeClassName: "bg-destructive text-white border-transparent" },
  PAYMENT_REVIEW: { get label() { return translate("buyer", "account.stage.PAYMENT_REVIEW", "กำลังตรวจสอบการชำระเงิน"); }, badgeClassName: "bg-amber-100 text-amber-800 border-transparent" },
  PREPARING: { get label() { return translate("buyer", "account.stage.PREPARING", "กำลังเตรียมสินค้า"); }, badgeClassName: "bg-blue-100 text-blue-800 border-transparent" },
  IN_TRANSIT: { get label() { return translate("buyer", "account.stage.IN_TRANSIT", "กำลังจัดส่ง"); }, badgeClassName: "bg-secondary text-secondary-foreground border-transparent" },
  RETURN_IN_PROGRESS: { get label() { return translate("buyer", "account.stage.RETURN_IN_PROGRESS", "ขอคืนสินค้าแล้ว"); }, badgeClassName: "bg-orange-100 text-orange-800 border-transparent" },
  COMPLETED: { get label() { return translate("buyer", "account.stage.COMPLETED", "สำเร็จ"); }, badgeClassName: "bg-secondary text-secondary-foreground border-transparent" },
  CANCELLED: { get label() { return translate("buyer", "account.stage.CANCELLED", "ยกเลิกแล้ว"); }, badgeClassName: "bg-muted text-muted-foreground border-transparent" },
  REFUNDED: { get label() { return translate("buyer", "account.stage.REFUNDED", "คืนเงินแล้ว"); }, badgeClassName: "bg-violet-100 text-violet-800 border-transparent" },
};

function has(children: SellerOrderDetails[], statuses: string[]) {
  return children.some((child) => statuses.includes(child.status));
}

/** The stage that needs the buyer's attention first. */
export function orderStage(order: OrderDetails): OrderStageInfo {
  const children = order.sellerOrders ?? [];
  const stage = ((): OrderStage => {
    if (order.status === "PENDING_PAYMENT") {
      return order.paymentUnderReview ? "PAYMENT_REVIEW" : "AWAITING_PAYMENT";
    }
    if (order.status === "CANCELLED" || order.status === "CANCELED") return "CANCELLED";
    if (order.status === "REFUNDED") return "REFUNDED";
    if (order.status === "RETURN_REQUESTED" || order.status === "RETURNED" || has(children, RETURNING)) return "RETURN_IN_PROGRESS";
    if (order.status === "SHIPPED" || has(children, IN_TRANSIT)) return "IN_TRANSIT";
    if (order.status === "PREPARING" || order.status === "PROCESSING" || has(children, PREPARING)) return "PREPARING";
    if (order.status === "COMPLETED" || order.status === "DELIVERED" || order.status === "PARTIALLY_COMPLETED" || has(children, ["COMPLETED"])) {
      return "COMPLETED";
    }
    if (has(children, ["REFUNDED"])) return "REFUNDED";
    return order.status === "PAID" ? "PREPARING" : "CANCELLED";
  })();
  return { stage, ...stageInfo[stage] };
}

/**
 * Whether the buyer may still cancel: before payment, or inside the cancel window
 * after it, while nothing has shipped and no slip is waiting for review.
 */
export function canBuyerCancel(order: OrderDetails, now = Date.now()): boolean {
  if (order.paymentUnderReview) return false;
  const children = order.sellerOrders ?? [];
  if (order.status === "PENDING_PAYMENT") return true;
  if (order.status !== "PAID" || !has(children, PREPARING)) return false;
  if (has(children, [...IN_TRANSIT, "COMPLETED"])) return false;
  return !order.cancellableUntil || Date.parse(order.cancellableUntil) > now;
}

/** Seller orders the buyer can confirm as received right now. */
export function confirmableSellerOrders(order: OrderDetails): SellerOrderDetails[] {
  return (order.sellerOrders ?? []).filter((child) => IN_TRANSIT.includes(child.status));
}

/** Earliest escrow auto-release among the parcels still on the way. */
export function nextAutoCompleteAt(order: OrderDetails): string | null {
  const dates = confirmableSellerOrders(order)
    .map((child) => child.autoCompleteAt)
    .filter((value): value is string => !!value)
    .sort();
  return dates[0] ?? null;
}

/** First tracking number of a parcel still on the way, for the card's one-line hint. */
export function firstTracking(order: OrderDetails): { carrier: string; trackingNumber: string } | null {
  for (const child of confirmableSellerOrders(order)) {
    const shipment = child.shipments?.find((item) => item.trackingNumber);
    if (shipment) return { carrier: shipment.carrierName || shipment.carrierCode, trackingNumber: shipment.trackingNumber };
  }
  return null;
}

export function formatOrderDateTime(value: string): string {
  return formatDateTime(value);
}
