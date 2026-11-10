import { orderStage } from "./order-stage";
import type { OrderDetails } from "./orders.types";
import { translate } from "@/lib/i18n";

// @tolgee-key {"key": "account.filter.ALL", "ns": "buyer", "defaultValue": "ทั้งหมด (All)"}
// @tolgee-key {"key": "account.filter.PENDING", "ns": "buyer", "defaultValue": "รอชำระเงิน (Pending / To Pay)"}
// @tolgee-key {"key": "account.filter.PREPARING", "ns": "buyer", "defaultValue": "กำลังเตรียมพัสดุ (Preparing / Prepared)"}
// @tolgee-key {"key": "account.filter.IN_TRANSIT", "ns": "buyer", "defaultValue": "กำลังจัดส่ง (In Transit / Shipped)"}
// @tolgee-key {"key": "account.filter.COMPLETED", "ns": "buyer", "defaultValue": "สำเร็จแล้ว (Completed / Delivered)"}
// @tolgee-key {"key": "account.filter.RETURN_REFUND", "ns": "buyer", "defaultValue": "ขอคืนเงิน/คืนสินค้า (Return Requested / Refunded)"}
// @tolgee-key {"key": "account.filter.CANCELLED", "ns": "buyer", "defaultValue": "ยกเลิกแล้ว (Cancelled)"}

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
  { key: "ALL", get label() { return translate("buyer", "account.filter.ALL", "ทั้งหมด (All)"); } },
  { key: "PENDING", get label() { return translate("buyer", "account.filter.PENDING", "รอชำระเงิน (Pending / To Pay)"); } },
  { key: "PREPARING", get label() { return translate("buyer", "account.filter.PREPARING", "กำลังเตรียมพัสดุ (Preparing / Prepared)"); } },
  { key: "IN_TRANSIT", get label() { return translate("buyer", "account.filter.IN_TRANSIT", "กำลังจัดส่ง (In Transit / Shipped)"); } },
  { key: "COMPLETED", get label() { return translate("buyer", "account.filter.COMPLETED", "สำเร็จแล้ว (Completed / Delivered)"); } },
  { key: "RETURN_REFUND", get label() { return translate("buyer", "account.filter.RETURN_REFUND", "ขอคืนเงิน/คืนสินค้า (Return Requested / Refunded)"); } },
  { key: "CANCELLED", get label() { return translate("buyer", "account.filter.CANCELLED", "ยกเลิกแล้ว (Cancelled)"); } },
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
