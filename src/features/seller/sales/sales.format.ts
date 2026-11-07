import { translate } from "@/lib/language";
import { formatSaleBaht } from "@/components/sale";
import { SALE_STATUS_LABEL, SALE_STATUS_STYLE, salePeriod } from "@/features/admin/sales.format";
import { hasErrorCode, isApiError } from "@/lib/api";

import type { SalePriceLockedDetails, SellerSale, SellerSaleStatus } from "./sales.types";

export { SALE_STATUS_LABEL, SALE_STATUS_STYLE, salePeriod };

/** ตัวอย่างคอมมิชชั่นในการ์ด "คุณได้" (Figma SAL-S2) — อัตราจริงคิดที่ server ตามหมวด */
export const SAMPLE_SELLER_COMMISSION = 0.05;

const DAY_MS = 86_400_000;

/** "ทุกสินค้าในร้าน" / "2 หมวด" / "เลือก 6 listing" — API ไม่ส่งชื่อหมวดมา */
export function sellerScopeLabel(sale: Pick<SellerSale, "scopeType" | "scopeIds" | "items">): string {
  if (sale.scopeType === "SHOP") return translate("ทุกสินค้าในร้าน", "All products in the shop");
  if (sale.scopeType === "LISTINGS") return `เลือก ${sale.items.length.toLocaleString("th-TH")} listing`;
  return `${sale.scopeIds.length.toLocaleString("th-TH")} หมวด`;
}

/** "ลด 15%" / "ลด ฿150/ชิ้น" / "ราคาใหม่รายชิ้น" */
export function sellerDiscountLabel(sale: Pick<SellerSale, "discountType" | "discountValue">): string {
  if (sale.discountType === "PERCENT") return `ลด ${sale.discountValue}%`;
  if (sale.discountType === "FIXED_OFF") return `ลด ${formatSaleBaht(sale.discountValue ?? 0)}/ชิ้น`;
  return translate("ราคาใหม่รายชิ้น", "New price per item");
}

export function sellerDiscountDetail(sale: SellerSale): string {
  if (sale.discountType !== "FIXED_PRICE") return translate("ร้านออกเงิน", "Shop funded");
  // ช่วง % คิดจากราคารายแถว (item ที่ยังขายอยู่)
  const percents = sale.items
    .filter((item) => item.salePrice != null && item.listPrice > 0)
    .map((item) => Math.round((100 * (item.listPrice - (item.salePrice ?? item.listPrice))) / item.listPrice));
  if (percents.length === 0) return translate("ตั้งรายแถว", "Set per row");
  const min = Math.min(...percents);
  const max = Math.max(...percents);
  return min === max ? `ลด ${min}%` : `ลด ${min}–${max}%`;
}

/** "เหลือ 7 วัน" / "เริ่มใน 24 วัน" / "ทีมงานหยุด" */
export function sellerPeriodHint(sale: SellerSale, now: number): string {
  const days = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - now) / DAY_MS));
  switch (sale.status) {
    case "ACTIVE":
      return `เหลือ ${days(sale.endsAt)} วัน`;
    case "SCHEDULED":
      return `เริ่มใน ${days(sale.startsAt)} วัน`;
    case "PAUSED":
      return sale.pausedByPegasus ? "ทีมงานหยุด" : "หยุดไว้";
    default:
      return translate("สิ้นสุดแล้ว", "Ended");
  }
}

export function isSaleFinished(status: SellerSaleStatus): boolean {
  return status === "ENDED" || status === "SOLD_OUT" || status === "BUDGET_EXHAUSTED";
}

export function sellerSaleErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "SALE_OVERLAP")) return "มี listing อยู่ในการลดราคาอื่นช่วงเดียวกัน (SALE_OVERLAP) — เอาออกจากอันเดิมก่อน";
  if (hasErrorCode(error, "SALE_PAUSED")) return "ทีมงานหยุดการลดราคานี้ไว้ เปิดเองไม่ได้ — ติดต่อทีมงาน";
  if (hasErrorCode(error, "SALE_IN_USE")) return "มีออเดอร์แล้ว ลบไม่ได้ — ใช้ “จบก่อนกำหนด” แทน";
  if (hasErrorCode(error, "SALE_NOT_FOUND")) return "ไม่พบการลดราคานี้แล้ว ลองโหลดหน้าใหม่";
  if (hasErrorCode(error, "SELLER_NOT_VERIFIED")) return "ร้านยังไม่ผ่านการยืนยัน จึงลดราคาสินค้าไม่ได้";
  if (hasErrorCode(error, "SALE_INVALID")) return "ข้อมูลการลดราคาไม่ผ่านเงื่อนไข ตรวจราคาแต่ละแถวอีกครั้ง";
  return fallback;
}

/** แกะ `details` ของ 409 `SALE_PRICE_LOCKED` */
export function priceLockedDetails(error: unknown): SalePriceLockedDetails {
  if (!isApiError(error)) return {};
  const d = error.details;
  return {
    saleName: typeof d.saleName === "string" ? d.saleName : undefined,
    ownerType: d.ownerType === "PLATFORM" || d.ownerType === "SELLER" ? d.ownerType : undefined,
    endsAt: typeof d.endsAt === "string" ? d.endsAt : undefined,
    currentPrice: typeof d.currentPrice === "number" ? d.currentPrice : undefined,
  };
}
