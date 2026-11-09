import type { AvailablePromotion } from "./promotions.types";
import { dateTimeFormat, intlLocale } from "@/lib/i18n";

export const checkoutMoney = (value: number) =>
  `฿${value.toLocaleString(intlLocale(), { maximumFractionDigits: 2 })}`;

const dayMonthYear = dateTimeFormat({
  day: "numeric",
  month: "short",
  year: "numeric",
}, { calendar: "gregory" });

export function formatPromotionDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return dayMonthYear.format(date);
}

export function normalizePromotionCode(code: string): string {
  return code.trim().toUpperCase();
}

export function findPromotionOwnerForCode(
  code: string | null | undefined,
  selection: {
    platformCode: string | null;
    sellerCodes: Record<number, string>;
  },
): "PLATFORM" | number | null {
  if (!code) return null;
  const normalized = normalizePromotionCode(code);
  if (
    selection.platformCode &&
    normalizePromotionCode(selection.platformCode) === normalized
  ) {
    return "PLATFORM";
  }
  const sellerEntry = Object.entries(selection.sellerCodes).find(
    ([, sellerCode]) => normalizePromotionCode(sellerCode) === normalized,
  );
  return sellerEntry ? Number(sellerEntry[0]) : null;
}

export function formatPromotionValue(promotion: {
  discountType: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
}): string {
  if (promotion.discountType === "FREE_SHIPPING") return "ส่งฟรี";
  if (promotion.discountType === "PERCENT") return `${promotion.discountValue}%`;
  return checkoutMoney(promotion.discountValue);
}

export function formatPromotionConditions(promotion: {
  minSpend?: number | null;
  maxDiscount?: number | null;
}): string {
  const parts: string[] = [];
  if (promotion.minSpend != null && promotion.minSpend > 0) {
    parts.push(`ขั้นต่ำ ${checkoutMoney(promotion.minSpend)}`);
  } else {
    parts.push("ไม่มีขั้นต่ำ");
  }
  if (promotion.maxDiscount != null && promotion.maxDiscount > 0) {
    parts.push(`สูงสุด ${checkoutMoney(promotion.maxDiscount)}`);
  }
  return parts.join(" · ");
}

export function formatPromotionRuleSummary(promotion: {
  discountType: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
  minSpend?: number | null;
  maxDiscount?: number | null;
}): string {
  const val = formatPromotionValue(promotion);
  const conditions = formatPromotionConditions(promotion);
  if (promotion.discountType === "FREE_SHIPPING") {
    return `ส่งฟรี · ${conditions}`;
  }
  return `ลด ${val} · ${conditions}`;
}

export function formatPromotionError(
  code: string | null | undefined,
  context?: {
    sellerName?: string | null;
    shortfall?: number | null;
    startsAt?: string | null;
  },
): string {
  if (!code) return "ไม่พบโค้ด ตรวจสอบตัวสะกดอีกครั้ง";
  const cleanCode = code.trim().toUpperCase();

  switch (cleanCode) {
    case "PROMO_EXPIRED":
      return "โค้ดหมดอายุแล้ว";
    case "PROMO_MIN_SPEND_NOT_MET":
      return context?.shortfall != null && context.shortfall > 0
        ? `ซื้อสินค้าเพิ่มอีก ${checkoutMoney(context.shortfall)} เพื่อใช้โค้ดนี้`
        : "ยอดซื้อยังไม่ถึงยอดขั้นต่ำเพื่อใช้โค้ดนี้";
    case "PROMO_WRONG_SELLER":
      return context?.sellerName
        ? `โค้ดนี้เป็นของร้าน ${context.sellerName} — ใส่ในช่อง “โค้ดร้าน” ของร้านนั้น`
        : "โค้ดนี้เป็นของร้านค้าอื่น — ใส่ในช่อง “โค้ดร้าน” ของร้านนั้น";
    case "PROMO_USED_UP":
      return "สิทธิ์ของโค้ดถูกใช้ครบแล้ว";
    case "PROMO_USER_LIMIT_REACHED":
      return "คุณใช้โค้ดนี้ครบจำนวนครั้งแล้ว";
    case "PROMO_NOT_STARTED":
      return context?.startsAt
        ? `โค้ดใช้ได้ตั้งแต่วันที่ ${formatPromotionDate(context.startsAt)}`
        : "โค้ดยังไม่เริ่มใช้งาน";
    case "PROMO_NOT_APPLICABLE":
      return "ไม่มีสินค้าในตะกร้าที่เข้าเงื่อนไขโค้ดนี้";
    case "PROMO_NOT_CLAIMED":
      return "โค้ดนี้ต้องเก็บก่อนใช้งาน";
    case "PROMO_CLAIM_FULL":
      return "โค้ดถูกเก็บครบสิทธิ์แล้ว";
    case "PROMO_PAUSED":
      return "โค้ดถูกระงับชั่วคราว";
    case "PROMO_CHANGED":
      return "ยอดชำระเปลี่ยนไป";
    case "PROMO_NOT_FOUND":
    default:
      return "ไม่พบโค้ด ตรวจสอบตัวสะกดอีกครั้ง";
  }
}

export function formatPromotionUnavailableReason(
  promotion: Pick<
    AvailablePromotion,
    "source" | "remainingClaims" | "reason" | "shortfall" | "sellerName"
  >,
): string {
  if (promotion.source === "CLAIMABLE") {
    return promotion.remainingClaims === 0
      ? "โค้ดนี้ถูกเก็บครบแล้ว"
      : "เก็บโค้ดก่อน แล้วจึงเลือกใช้ได้";
  }
  if (
    promotion.reason === "PROMO_MIN_SPEND_NOT_MET" &&
    promotion.shortfall != null &&
    promotion.shortfall > 0
  ) {
    return `ซื้อเพิ่มอีก ${checkoutMoney(promotion.shortfall)}`;
  }
  if (!promotion.reason) return "โค้ดนี้ยังใช้ไม่ได้";
  return (
    formatPromotionError(promotion.reason, {
      sellerName: promotion.sellerName,
      shortfall: promotion.shortfall,
    }) || "โค้ดนี้ยังใช้ไม่ได้"
  );
}
