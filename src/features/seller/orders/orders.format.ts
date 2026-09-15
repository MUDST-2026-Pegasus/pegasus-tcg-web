import type { OrderStatus } from "@/features/seller/shared/seller.types";

/** ชื่อสถานะแบบสั้น ใช้ทั้งชิปตัวกรองหน้ารายการและ breadcrumb หน้ารายละเอียด */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_pack: "รอแพ็ค",
  awaiting_payment: "รอชำระ",
  shipped: "กำลังจัดส่ง",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
};
