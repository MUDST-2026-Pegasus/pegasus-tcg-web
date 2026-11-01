import { orderStage } from "./order-stage";
import type { OrderDetails } from "./orders.types";

export type OrderFilterTab =
  | "ALL"
  | "PENDING"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "CANCELLED";

export type FilterTabMeta = {
  key: OrderFilterTab;
  label: string;
};

export const ORDER_FILTER_TABS: FilterTabMeta[] = [
  { key: "ALL", label: "ทั้งหมด (All)" },
  { key: "PENDING", label: "รอชำระเงิน (Pending)" },
  { key: "IN_TRANSIT", label: "กำลังจัดส่ง (In Transit)" },
  { key: "COMPLETED", label: "สำเร็จแล้ว (Completed)" },
  { key: "CANCELLED", label: "ยกเลิกแล้ว (Cancelled)" },
];

export function matchesOrderFilter(order: OrderDetails, filter: OrderFilterTab): boolean {
  if (filter === "ALL") return true;
  const { stage } = orderStage(order);
  switch (filter) {
    case "PENDING":
      return stage === "AWAITING_PAYMENT" || stage === "PAYMENT_REVIEW";
    case "IN_TRANSIT":
      return stage === "IN_TRANSIT" || stage === "PREPARING";
    case "COMPLETED":
      return stage === "COMPLETED";
    case "CANCELLED":
      return stage === "CANCELLED" || stage === "REFUNDED" || stage === "RETURN_IN_PROGRESS";
    default:
      return true;
  }
}
