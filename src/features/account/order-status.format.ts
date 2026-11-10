import { translate } from "@/lib/i18n";

// @tolgee-key {"key": "account.status.PENDING_PAYMENT", "ns": "buyer", "defaultValue": "รอชำระเงิน"}
// @tolgee-key {"key": "account.status.PAID", "ns": "buyer", "defaultValue": "ชำระเงินแล้ว"}
// @tolgee-key {"key": "account.status.PARTIALLY_COMPLETED", "ns": "buyer", "defaultValue": "เสร็จสิ้นบางรายการ"}
// @tolgee-key {"key": "account.status.PREPARING", "ns": "buyer", "defaultValue": "กำลังเตรียมสินค้า"}
// @tolgee-key {"key": "account.status.SHIPPED", "ns": "buyer", "defaultValue": "จัดส่งแล้ว"}
// @tolgee-key {"key": "account.status.DELIVERED", "ns": "buyer", "defaultValue": "จัดส่งถึงแล้ว"}
// @tolgee-key {"key": "account.status.COMPLETED", "ns": "buyer", "defaultValue": "เสร็จสิ้น"}
// @tolgee-key {"key": "account.status.CANCELLED", "ns": "buyer", "defaultValue": "ยกเลิกแล้ว"}
// @tolgee-key {"key": "account.status.RETURN_REQUESTED", "ns": "buyer", "defaultValue": "มีคำขอคืนสินค้า"}
// @tolgee-key {"key": "account.status.RETURNED", "ns": "buyer", "defaultValue": "คืนสินค้าแล้ว"}
// @tolgee-key {"key": "account.status.REFUNDED", "ns": "buyer", "defaultValue": "คืนเงินแล้ว"}
// @tolgee-key {"key": "account.status.other", "ns": "buyer", "defaultValue": "สถานะอื่น"}
const labels: Record<string, string> = {
  get PENDING_PAYMENT() { return translate("buyer", "account.status.PENDING_PAYMENT", "รอชำระเงิน"); },
  get PAID() { return translate("buyer", "account.status.PAID", "ชำระเงินแล้ว"); },
  get PARTIALLY_COMPLETED() { return translate("buyer", "account.status.PARTIALLY_COMPLETED", "เสร็จสิ้นบางรายการ"); },
  get PREPARING() { return translate("buyer", "account.status.PREPARING", "กำลังเตรียมสินค้า"); },
  get SHIPPED() { return translate("buyer", "account.status.SHIPPED", "จัดส่งแล้ว"); },
  get DELIVERED() { return translate("buyer", "account.status.DELIVERED", "จัดส่งถึงแล้ว"); },
  get COMPLETED() { return translate("buyer", "account.status.COMPLETED", "เสร็จสิ้น"); },
  get CANCELLED() { return translate("buyer", "account.status.CANCELLED", "ยกเลิกแล้ว"); },
  get RETURN_REQUESTED() { return translate("buyer", "account.status.RETURN_REQUESTED", "มีคำขอคืนสินค้า"); },
  get RETURNED() { return translate("buyer", "account.status.RETURNED", "คืนสินค้าแล้ว"); },
  get REFUNDED() { return translate("buyer", "account.status.REFUNDED", "คืนเงินแล้ว"); },
};

export const orderStatusLabel = (status: string) => labels[status] ?? translate("buyer", "account.status.other", "สถานะอื่น");
