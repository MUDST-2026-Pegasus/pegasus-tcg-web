import { translate } from "@/lib/language";
const labels: Record<string, string> = {
  get PENDING_PAYMENT() { return translate("รอชำระเงิน", "Awaiting payment"); },
  get PAID() { return translate("ชำระเงินแล้ว", "Paid"); },
  get PARTIALLY_COMPLETED() { return translate("เสร็จสิ้นบางรายการ", "Partially completed"); },
  get PREPARING() { return translate("กำลังเตรียมสินค้า", "Preparing"); },
  get SHIPPED() { return translate("จัดส่งแล้ว", "Shipped"); },
  get DELIVERED() { return translate("จัดส่งถึงแล้ว", "Delivered"); },
  get COMPLETED() { return translate("เสร็จสิ้น", "Completed"); },
  get CANCELLED() { return translate("ยกเลิกแล้ว", "Cancelled"); },
  get RETURN_REQUESTED() { return translate("มีคำขอคืนสินค้า", "Return requested"); },
  get RETURNED() { return translate("คืนสินค้าแล้ว", "Returned"); },
  get REFUNDED() { return translate("คืนเงินแล้ว", "Refunded"); },
};

export const orderStatusLabel = (status: string) => labels[status] ?? translate("สถานะอื่น", "Other status");
