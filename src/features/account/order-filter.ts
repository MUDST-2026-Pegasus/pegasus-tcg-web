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
  { key: "ALL", label: "ทั้งหมด (All)" },
  { key: "PENDING", label: "รอชำระเงิน (Pending / To Pay)" },
  { key: "PREPARING", label: "กำลังเตรียมพัสดุ (Preparing / Prepared)" },
  { key: "IN_TRANSIT", label: "กำลังจัดส่ง (In Transit / Shipped)" },
  { key: "COMPLETED", label: "สำเร็จแล้ว (Completed / Delivered)" },
  { key: "RETURN_REFUND", label: "ขอคืนเงิน/คืนสินค้า (Return Requested / Refunded)" },
  { key: "CANCELLED", label: "ยกเลิกแล้ว (Cancelled)" },
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
