const labels: Record<string, string> = {
  PENDING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  PARTIALLY_COMPLETED: "เสร็จสิ้นบางรายการ",
  PREPARING: "กำลังเตรียมสินค้า",
  SHIPPED: "จัดส่งแล้ว",
  DELIVERED: "จัดส่งถึงแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิกแล้ว",
  RETURN_REQUESTED: "มีคำขอคืนสินค้า",
  RETURNED: "คืนสินค้าแล้ว",
  REFUNDED: "คืนเงินแล้ว",
};

export const orderStatusLabel = (status: string) => labels[status] ?? "สถานะอื่น";
