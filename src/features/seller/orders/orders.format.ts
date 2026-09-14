import type { OrderStatus } from "@/features/seller/shared/seller.types";

/** ชื่อสถานะแบบสั้น ใช้ทั้งชิปตัวกรองหน้ารายการและ breadcrumb หน้ารายละเอียด */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_pack: "รอแพ็ค",
  awaiting_payment: "รอชำระ",
  shipped: "กำลังจัดส่ง",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
};

const bahtWhole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const bahtSatang = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ฿1,850 เมื่อเป็นจำนวนเต็ม และ ฿92.50 เมื่อมีเศษสตางค์ — ตรงกับที่ดีไซน์ใช้ */
export function formatBaht(amount: number): string {
  const formatter = Number.isInteger(amount) ? bahtWhole : bahtSatang;
  return `฿${formatter.format(amount)}`;
}
