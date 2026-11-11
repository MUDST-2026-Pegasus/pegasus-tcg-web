import type { ListingPricing } from "./sale.types";
import { formatCountdown as formatSharedCountdown, formatMoney } from "@/lib/i18n";

/** "THB 4,200.00" */
export function formatSaleBaht(amount: number | null | undefined): string {
  return formatMoney(Number(amount ?? 0));
}

/** มีราคาลดที่ผู้ซื้อเห็นอยู่ตอนนี้ไหม */
export function isOnSale(pricing: ListingPricing | null | undefined): pricing is ListingPricing & {
  sale: NonNullable<ListingPricing["sale"]>;
} {
  return !!pricing?.sale && pricing.salePrice < pricing.listPrice;
}

export type PriceTagState = "default" | "sale" | "flash";

/** state ของ Figma "SAL / Price Tag" */
export function priceTagState(pricing: ListingPricing | null | undefined): PriceTagState {
  if (!isOnSale(pricing)) return "default";
  return pricing.sale.type === "FLASH_SALE" ? "flash" : "sale";
}

export function isFlash(pricing: ListingPricing | null | undefined): boolean {
  return isOnSale(pricing) && pricing.sale.type === "FLASH_SALE";
}

/** ราคาที่ผู้ซื้อจ่าย — ไม่มี `pricing` ใช้ราคา listing เดิม */
export function effectivePrice(pricing: ListingPricing | null | undefined, fallback: number): number {
  return pricing ? pricing.salePrice : fallback;
}

/** ประหยัดได้เท่าไรต่อชิ้น (ส่วนต่างที่ API ส่งมา ไม่ได้คิดส่วนลดเอง) */
export function savingPerUnit(pricing: ListingPricing | null | undefined): number {
  return isOnSale(pricing) ? pricing.listPrice - pricing.salePrice : 0;
}

/** "-20%" — ใช้ `discountPercent` ของ API */
export function discountBadgeLabel(pricing: ListingPricing): string {
  return `-${pricing.discountPercent ?? 0}%`;
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * เวลาที่เหลือแบบนาฬิกา: "05:42:18" · เกิน 1 วัน "27 วัน 05:42:18"
 * ค่าติดลบนับเป็น 0
 */
export function formatCountdown(ms: number): string {
  return formatSharedCountdown(ms);
}

/** แยกเป็นช่อง ชม./นาที/วินาที ให้กล่องนับถอยหลังบนหน้าแรก (ชั่วโมงรวมวันไว้แล้ว) */
export function countdownParts(ms: number): [string, string, string] {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [pad(Math.floor(total / 3600)), pad(Math.floor((total % 3600) / 60)), pad(total % 60)];
}

/** ขายแล้ว/โควตา สำหรับแถบโควตา Flash · ไม่รู้โควตาทั้งหมดคืน `null` */
export function quotaProgress(quota: number | null | undefined, quotaLeft: number | null | undefined) {
  if (quota == null || quota <= 0 || quotaLeft == null) return null;
  const left = Math.max(0, Math.min(quota, quotaLeft));
  const sold = quota - left;
  return { sold, quota, left, percent: (100 * sold) / quota };
}
