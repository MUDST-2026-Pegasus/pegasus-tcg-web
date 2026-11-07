import { translate } from "@/lib/language";
import { orderStage } from "./order-stage";
import type { OrderDetails } from "./orders.types";

export type OrderFilterTab =
  | "ALL"
  | "PENDING"
  | "PREPARING"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "RETURN_REFUND"
  | "CANCELLED";

export type FilterTabMeta = {
  key: OrderFilterTab;
  label: string;
};

export const ORDER_FILTER_TABS: FilterTabMeta[] = [
  { key: "ALL", get label() { return translate("ทั้งหมด (All)", "All"); } },
  { key: "PENDING", get label() { return translate("รอชำระเงิน (Pending / To Pay)", "To pay"); } },
  { key: "PREPARING", get label() { return translate("กำลังเตรียมพัสดุ (Preparing / Prepared)", "Preparing"); } },
  { key: "IN_TRANSIT", get label() { return translate("กำลังจัดส่ง (In Transit / Shipped)", "In transit"); } },
  { key: "COMPLETED", get label() { return translate("สำเร็จแล้ว (Completed / Delivered)", "Completed"); } },
  { key: "RETURN_REFUND", get label() { return translate("ขอคืนเงิน/คืนสินค้า (Return Requested / Refunded)", "Returns and refunds"); } },
  { key: "CANCELLED", get label() { return translate("ยกเลิกแล้ว (Cancelled)", "Cancelled"); } },
];

export function matchesOrderFilter(order: OrderDetails, filter: OrderFilterTab): boolean {
  if (filter === "ALL") return true;
  const { stage } = orderStage(order);
  switch (filter) {
    case "PENDING":
      return stage === "AWAITING_PAYMENT" || stage === "PAYMENT_REVIEW";
    case "PREPARING":
      return stage === "PREPARING";
    case "IN_TRANSIT":
      return stage === "IN_TRANSIT";
    case "COMPLETED":
      return stage === "COMPLETED";
    case "RETURN_REFUND":
      return stage === "RETURN_IN_PROGRESS" || stage === "REFUNDED";
    case "CANCELLED":
      return stage === "CANCELLED";
    default:
      return true;
  }
}
