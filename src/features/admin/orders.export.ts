import type { SellerOrderStatus } from "./orders.types";

/** ทุกสถานะของคำสั่งซื้อย่อย ตามลำดับใน dialog ส่งออก */
export const EXPORT_ORDER_STATUSES: SellerOrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

/** ค่าเริ่มต้นของช่วงวันที่: 30 วันล่าสุดรวมวันนี้ */
export const DEFAULT_EXPORT_DAYS = 30;

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** วันนี้ตามเวลาไทย `yyyy-mm-dd` (ไทยไม่มีเวลาออมแสง บวก 7 ชั่วโมงพอ) */
export function bangkokToday(now: Date = new Date()): string {
  return new Date(now.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * วันแรก–วันสุดท้าย (รวมทั้งสองวัน) ที่ผู้ใช้เลือก → `from`/`to` ที่ backend ใช้
 * `to` เป็นเที่ยงคืนของวันถัดไป เพราะ backend ไม่นับ `to` เข้าไปในช่วง
 */
export function orderExportRange(firstDay: string, lastDay: string): { from: string; to: string } {
  return {
    from: `${firstDay}T00:00:00+07:00`,
    to: `${addDays(lastDay, 1)}T00:00:00+07:00`,
  };
}

/** เลือกครบทุกสถานะไม่ต้องส่ง `status` ไป backend จะได้ไม่ต้องกรอง */
export function exportStatusFilter(selected: SellerOrderStatus[]): SellerOrderStatus[] {
  return selected.length === EXPORT_ORDER_STATUSES.length ? [] : selected;
}
