const returnStatusLabels: Record<string, string> = {
  REQUESTED: "รอผู้ขายตรวจสอบ",
  APPROVED: "อนุมัติคำขอแล้ว",
  REJECTED: "ปฏิเสธคำขอ",
  AWAITING_RETURN_SHIPMENT: "รอผู้ซื้อส่งสินค้าคืน",
  IN_TRANSIT: "สินค้าคืนอยู่ระหว่างขนส่ง",
  RECEIVED: "ผู้ขายได้รับสินค้าคืนแล้ว",
  REFUNDED: "คืนเงินแล้ว",
  CLOSED: "ปิดคำขอแล้ว",
};

const returnReasonLabels: Record<string, string> = {
  NOT_AS_DESCRIBED: "สินค้าไม่ตรงคำอธิบาย",
  DAMAGED: "สินค้าเสียหาย",
  WRONG_ITEM: "ได้รับสินค้าผิดรายการ",
  NOT_RECEIVED: "ไม่ได้รับสินค้า",
  COUNTERFEIT: "สงสัยว่าเป็นสินค้าปลอม",
  OTHER: "เหตุผลอื่น",
};

export const returnStatusOptions = Object.keys(returnStatusLabels);
export const returnStatusLabel = (status: string) => returnStatusLabels[status] ?? "สถานะอื่น";
export const returnReasonLabel = (reason: string) => returnReasonLabels[reason] ?? "เหตุผลอื่น";
