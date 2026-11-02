import type { OrderDetails, SellerOrderDetails } from "./orders.types";

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
  AWAITING_PAYMENT: { label: "Awaiting Payment", badgeClassName: "bg-destructive text-white border-transparent" },
  PAYMENT_REVIEW: { label: "Verifying Payment", badgeClassName: "bg-amber-100 text-amber-800 border-transparent" },
  PREPARING: { label: "Preparing", badgeClassName: "bg-blue-100 text-blue-800 border-transparent" },
  IN_TRANSIT: { label: "In Transit", badgeClassName: "bg-secondary text-secondary-foreground border-transparent" },
  RETURN_IN_PROGRESS: { label: "Return Requested", badgeClassName: "bg-orange-100 text-orange-800 border-transparent" },
  COMPLETED: { label: "Completed", badgeClassName: "bg-secondary text-secondary-foreground border-transparent" },
  CANCELLED: { label: "Cancelled", badgeClassName: "bg-muted text-muted-foreground border-transparent" },
  REFUNDED: { label: "Refunded", badgeClassName: "bg-violet-100 text-violet-800 border-transparent" },
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
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
