import type { OrderTone } from "../orders.format";

/**
 * สีของหน้าภาพรวมคำสั่งซื้อ ใช้ร่วมกันระหว่าง board, การ์ด และรายการใน Sheet
 * รอชำระเงินใช้ส้ม, รอส่ง+จัดส่งใช้น้ำเงิน/ม่วง, สำเร็จเขียว, ข้อพิพาทแดง
 */

/** จุดหัวคอลัมน์ Kanban */
export const ORDER_TONE_DOT: Record<OrderTone, string> = {
  pending: "bg-[#f59e0b]",
  packing: "bg-[#0058bc]",
  shipping: "bg-[#6366f1]",
  success: "bg-[#12805c]",
  dispute: "bg-[#d0342c]",
};

/** badge บริบท (มุมล่างซ้าย) ในการ์ด — โทนเดียวกับจุดหัวคอลัมน์ */
export const ORDER_TONE_BADGE: Record<OrderTone, string> = {
  pending: "bg-[#fdf0dd] text-[#b45309]",
  packing: "bg-[#e8f1fc] text-[#0058bc]",
  shipping: "bg-[#ecebff] text-[#4f46e5]",
  success: "bg-[#e3f4ec] text-[#12805c]",
  dispute: "bg-[#fbe9e8] text-[#d0342c]",
};
