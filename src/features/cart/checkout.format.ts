import type { AvailablePromotion } from "./promotions.types";
import { dateTimeFormat, errorText, intlLocale } from "@/lib/i18n";

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
  const notFound = errorText("PROMO_NOT_FOUND") ?? "ไม่พบโค้ด ตรวจสอบตัวสะกดอีกครั้ง";
  if (!code) return notFound;
  const cleanCode = code.trim().toUpperCase();

  // ข้อความที่มีรายละเอียด (ยอด / ร้าน / วันที่) ใช้ key ใน errors:promo.* [TCG-547]
  if (cleanCode === "PROMO_MIN_SPEND_NOT_MET" && context?.shortfall != null && context.shortfall > 0) {
    return errorText("promo.minSpendShortfall", { amount: checkoutMoney(context.shortfall) }) ?? notFound;
  }
  if (cleanCode === "PROMO_WRONG_SELLER" && context?.sellerName) {
    return errorText("promo.wrongSellerNamed", { seller: context.sellerName }) ?? notFound;
  }
  if (cleanCode === "PROMO_NOT_STARTED" && context?.startsAt) {
    return errorText("promo.startsAt", { date: formatPromotionDate(context.startsAt) }) ?? notFound;
  }
  // code ที่ยังไม่มีคำแปล (PROMO_* ตัวใหม่) ถือว่าไม่พบโค้ด เหมือนเดิม
  return (cleanCode.startsWith("PROMO_") && errorText(cleanCode)) || notFound;
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
