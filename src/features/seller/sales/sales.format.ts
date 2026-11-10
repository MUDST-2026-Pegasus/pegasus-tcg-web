import { formatSaleBaht } from "@/components/sale";
import { SALE_STATUS_LABEL, SALE_STATUS_STYLE, salePeriod } from "@/features/admin/sales.format";
import { hasErrorCode, isApiError } from "@/lib/api";

import type { SalePriceLockedDetails, SellerSale, SellerSaleStatus } from "./sales.types";
import { intlLocale, translate } from "@/lib/i18n";

export { SALE_STATUS_LABEL, SALE_STATUS_STYLE, salePeriod };

/** ตัวอย่างคอมมิชชั่นในการ์ด "คุณได้" (Figma SAL-S2) — อัตราจริงคิดที่ server ตามหมวด */
export const SAMPLE_SELLER_COMMISSION = 0.05;

const DAY_MS = 86_400_000;

/** translate("sale", "seller.scope.shop", "ทุกสินค้าในร้าน") / "2 หมวด" / "เลือก 6 listing" — API ไม่ส่งชื่อหมวดมา */
export function sellerScopeLabel(sale: Pick<SellerSale, "scopeType" | "scopeIds" | "items">): string {
  if (sale.scopeType === "SHOP") return translate("sale", "seller.scope.shop", "ทุกสินค้าในร้าน");
  if (sale.scopeType === "LISTINGS") return translate("sale", "seller.scope.listings", "เลือก {count} listing", { count: sale.items.length.toLocaleString(intlLocale()) });
  return translate("sale", "seller.scope.categories", "{count} หมวด", { count: sale.scopeIds.length.toLocaleString(intlLocale()) });
}

/** "ลด 15%" / "ลด ฿150/ชิ้น" / translate("sale", "seller.discount.fixedPrice", "ราคาใหม่รายชิ้น") */
export function sellerDiscountLabel(sale: Pick<SellerSale, "discountType" | "discountValue">): string {
  if (sale.discountType === "PERCENT") return translate("sale", "seller.discount.percent", "ลด {percent}%", { percent: sale.discountValue ?? 0 });
  if (sale.discountType === "FIXED_OFF") return translate("sale", "seller.discount.fixedOff", "ลด {amount}/ชิ้น", { amount: formatSaleBaht(sale.discountValue ?? 0) });
  return translate("sale", "seller.discount.fixedPrice", "ราคาใหม่รายชิ้น");
}

export function sellerDiscountDetail(sale: SellerSale): string {
  if (sale.discountType !== "FIXED_PRICE") return translate("sale", "seller.discount.shopPays", "ร้านออกเงิน");
  // ช่วง % คิดจากราคารายแถว (item ที่ยังขายอยู่)
  const percents = sale.items
    .filter((item) => item.salePrice != null && item.listPrice > 0)
    .map((item) => Math.round((100 * (item.listPrice - (item.salePrice ?? item.listPrice))) / item.listPrice));
  if (percents.length === 0) return translate("sale", "seller.discount.perRow", "ตั้งรายแถว");
  const min = Math.min(...percents);
  const max = Math.max(...percents);
  return min === max ? translate("sale", "seller.discount.percent", "ลด {percent}%", { percent: min }) : translate("sale", "seller.discount.percentRange", "ลด {min}–{max}%", { min, max });
}

/** "เหลือ 7 วัน" / "เริ่มใน 24 วัน" / "ทีมงานหยุด" */
export function sellerPeriodHint(sale: SellerSale, now: number): string {
  const days = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - now) / DAY_MS));
  switch (sale.status) {
    case "ACTIVE":
      return translate("sale", "seller.period.daysLeft", "เหลือ {days} วัน", { days: days(sale.endsAt) });
    case "SCHEDULED":
      return translate("sale", "seller.period.startsIn", "เริ่มใน {days} วัน", { days: days(sale.startsAt) });
    case "PAUSED":
      return sale.pausedByPegasus ? translate("sale", "seller.period.pausedByTeam", "ทีมงานหยุด") : translate("sale", "seller.period.paused", "หยุดไว้");
    default:
      return translate("sale", "seller.period.ended", "สิ้นสุดแล้ว");
  }
}

export function isSaleFinished(status: SellerSaleStatus): boolean {
  return status === "ENDED" || status === "SOLD_OUT" || status === "BUDGET_EXHAUSTED";
}

export function sellerSaleErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "SALE_OVERLAP")) return translate("sale", "seller.errors.overlap", "มี listing อยู่ในการลดราคาอื่นช่วงเดียวกัน (SALE_OVERLAP) — เอาออกจากอันเดิมก่อน");
  if (hasErrorCode(error, "SALE_PAUSED")) return translate("sale", "seller.errors.paused", "ทีมงานหยุดการลดราคานี้ไว้ เปิดเองไม่ได้ — ติดต่อทีมงาน");
  if (hasErrorCode(error, "SALE_IN_USE")) return translate("sale", "seller.errors.inUse", "มีออเดอร์แล้ว ลบไม่ได้ — ใช้ “จบก่อนกำหนด” แทน");
  if (hasErrorCode(error, "SALE_NOT_FOUND")) return translate("sale", "seller.errors.notFound", "ไม่พบการลดราคานี้แล้ว ลองโหลดหน้าใหม่");
  if (hasErrorCode(error, "SELLER_NOT_VERIFIED")) return translate("sale", "seller.errors.notVerified", "ร้านยังไม่ผ่านการยืนยัน จึงลดราคาสินค้าไม่ได้");
  if (hasErrorCode(error, "SALE_INVALID")) return translate("sale", "seller.errors.invalid", "ข้อมูลการลดราคาไม่ผ่านเงื่อนไข ตรวจราคาแต่ละแถวอีกครั้ง");
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

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-744]
// @tolgee-key {"key": "seller.scope.shop", "ns": "sale", "defaultValue": "ทุกสินค้าในร้าน"}
// @tolgee-key {"key": "seller.scope.listings", "ns": "sale", "defaultValue": "เลือก {count} listing"}
// @tolgee-key {"key": "seller.scope.categories", "ns": "sale", "defaultValue": "{count} หมวด"}
// @tolgee-key {"key": "seller.discount.fixedPrice", "ns": "sale", "defaultValue": "ราคาใหม่รายชิ้น"}
// @tolgee-key {"key": "seller.discount.percent", "ns": "sale", "defaultValue": "ลด {percent}%"}
// @tolgee-key {"key": "seller.discount.fixedOff", "ns": "sale", "defaultValue": "ลด {amount}/ชิ้น"}
// @tolgee-key {"key": "seller.discount.shopPays", "ns": "sale", "defaultValue": "ร้านออกเงิน"}
// @tolgee-key {"key": "seller.discount.perRow", "ns": "sale", "defaultValue": "ตั้งรายแถว"}
// @tolgee-key {"key": "seller.discount.percentRange", "ns": "sale", "defaultValue": "ลด {min}–{max}%"}
// @tolgee-key {"key": "seller.period.daysLeft", "ns": "sale", "defaultValue": "เหลือ {days} วัน"}
// @tolgee-key {"key": "seller.period.startsIn", "ns": "sale", "defaultValue": "เริ่มใน {days} วัน"}
// @tolgee-key {"key": "seller.period.pausedByTeam", "ns": "sale", "defaultValue": "ทีมงานหยุด"}
// @tolgee-key {"key": "seller.period.paused", "ns": "sale", "defaultValue": "หยุดไว้"}
// @tolgee-key {"key": "seller.period.ended", "ns": "sale", "defaultValue": "สิ้นสุดแล้ว"}
// @tolgee-key {"key": "seller.errors.overlap", "ns": "sale", "defaultValue": "มี listing อยู่ในการลดราคาอื่นช่วงเดียวกัน (SALE_OVERLAP) — เอาออกจากอันเดิมก่อน"}
// @tolgee-key {"key": "seller.errors.paused", "ns": "sale", "defaultValue": "ทีมงานหยุดการลดราคานี้ไว้ เปิดเองไม่ได้ — ติดต่อทีมงาน"}
// @tolgee-key {"key": "seller.errors.inUse", "ns": "sale", "defaultValue": "มีออเดอร์แล้ว ลบไม่ได้ — ใช้ “จบก่อนกำหนด” แทน"}
// @tolgee-key {"key": "seller.errors.notFound", "ns": "sale", "defaultValue": "ไม่พบการลดราคานี้แล้ว ลองโหลดหน้าใหม่"}
// @tolgee-key {"key": "seller.errors.notVerified", "ns": "sale", "defaultValue": "ร้านยังไม่ผ่านการยืนยัน จึงลดราคาสินค้าไม่ได้"}
// @tolgee-key {"key": "seller.errors.invalid", "ns": "sale", "defaultValue": "ข้อมูลการลดราคาไม่ผ่านเงื่อนไข ตรวจราคาแต่ละแถวอีกครั้ง"}
