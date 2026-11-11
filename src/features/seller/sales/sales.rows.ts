import { translate } from "@/lib/i18n";
/**
 * ตารางเลือก listing + ราคาลดรายแถว (Figma SAL-S2) — คิดที่หน้าเว็บเพื่อช่วยกรอกเท่านั้น
 * backend ตรวจซ้ำทุกแถว (ราคาลด < ราคาปัจจุบัน และ ≥ THB 1.00 · `SALE_OVERLAP`)
 */

export type SaleRowDraft = {
  listingId: number;
  /** ราคาปัจจุบันของ listing (= ราคาขีดฆ่า) */
  price: number;
  selected: boolean;
  /** ราคาลดที่กรอก — `null` = ยังไม่กรอก */
  salePrice: number | null;
};

/** ราคาลดจาก % ปัดเป็นบาทเต็ม — ไม่ต่ำกว่า THB 1.00 และต่ำกว่าราคาปัจจุบันอย่างน้อย THB 1.00 */
export function priceFromPercent(price: number, percent: number): number {
  const raw = Math.round(price * (1 - percent / 100));
  return Math.max(1, Math.min(raw, Math.ceil(price) - 1));
}

/** % ที่ลดจริงของแถว ปัดเป็นจำนวนเต็ม — `null` ถ้ายังไม่มีราคาหรือไม่ได้ลด */
export function rowPercent(price: number, salePrice: number | null): number | null {
  if (salePrice == null || salePrice >= price || price <= 0) return null;
  return Math.round((100 * (price - salePrice)) / price);
}

/** "ตั้งทุกแถวที่เลือก: N%" → ราคาลดรายแถว */
export function applyBulkPercent(rows: SaleRowDraft[], percent: number): SaleRowDraft[] {
  if (!Number.isFinite(percent) || percent < 1 || percent > 90) return rows;
  return rows.map((row) => (row.selected ? { ...row, salePrice: priceFromPercent(row.price, percent) } : row));
}

export type RowError = "missing" | "not-lower" | "too-low" | "overlap";

export const ROW_ERROR_MESSAGE: Record<Exclude<RowError, "overlap">, string> = {
  get missing() { return translate("sale", "seller.row.missing", "กรอกราคาลด"); },
  get "not-lower"() { return translate("sale", "seller.row.notLower", "ราคาลดต้องต่ำกว่าราคาปัจจุบัน"); },
  get "too-low"() { return translate("sale", "seller.row.tooLow", "ราคาลดต้องไม่ต่ำกว่า THB 1.00"); },
};

/** error ของแถวที่เลือก — แถวที่ไม่ได้เลือกไม่ตรวจ */
export function validateRow(row: SaleRowDraft, overlapIds: ReadonlySet<number> = new Set()): RowError | null {
  if (!row.selected) return null;
  if (row.salePrice == null || !Number.isFinite(row.salePrice)) return "missing";
  if (row.salePrice < 1) return "too-low";
  if (row.salePrice >= row.price) return "not-lower";
  if (overlapIds.has(row.listingId)) return "overlap";
  return null;
}

/** listingId → error ของทุกแถวที่ผิด */
export function rowErrors(rows: SaleRowDraft[], overlapIds: ReadonlySet<number> = new Set()): Map<number, RowError> {
  const errors = new Map<number, RowError>();
  for (const row of rows) {
    const error = validateRow(row, overlapIds);
    if (error) errors.set(row.listingId, error);
  }
  return errors;
}

/** ช่วง % ที่ลดของแถวที่เลือก เช่น "13–33%" */
export function percentRange(rows: SaleRowDraft[]): string | null {
  const values = rows
    .filter((row) => row.selected)
    .map((row) => rowPercent(row.price, row.salePrice))
    .filter((value): value is number => value != null);
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min}%` : `${min}–${max}%`;
}

/** ตัวอย่าง "คุณได้" — การลดราคาของร้าน คอมมิชชั่นคิดจากราคาที่ลดแล้ว */
export function sellerTakeHome(price: number, salePrice: number, commissionRate: number) {
  const commission = Math.round(salePrice * commissionRate);
  return { price, salePrice, commission, net: salePrice - commission, shopDiscount: price - salePrice };
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-744]
// @tolgee-key {"key": "seller.row.missing", "ns": "sale", "defaultValue": "กรอกราคาลด"}
// @tolgee-key {"key": "seller.row.notLower", "ns": "sale", "defaultValue": "ราคาลดต้องต่ำกว่าราคาปัจจุบัน"}
// @tolgee-key {"key": "seller.row.tooLow", "ns": "sale", "defaultValue": "ราคาลดต้องไม่ต่ำกว่า THB 1.00"}
