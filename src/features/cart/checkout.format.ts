import type { AvailablePromotion, PromoCodeOutcome } from "./promotions.types";
import { dateTimeFormat, errorText, formatNumber, translate } from "@/lib/i18n";

// @tolgee-key {"key": "cart.common.freeShipping", "ns": "buyer", "defaultValue": "ส่งฟรี"}
// @tolgee-key {"key": "cart.code.minSpend", "ns": "buyer", "defaultValue": "ขั้นต่ำ {amount}"}
// @tolgee-key {"key": "cart.code.noMinSpend", "ns": "buyer", "defaultValue": "ไม่มีขั้นต่ำ"}
// @tolgee-key {"key": "cart.code.maxDiscount", "ns": "buyer", "defaultValue": "สูงสุด {amount}"}
// @tolgee-key {"key": "cart.code.freeShippingRule", "ns": "buyer", "defaultValue": "ส่งฟรี · {conditions}"}
// @tolgee-key {"key": "cart.code.discountRule", "ns": "buyer", "defaultValue": "ลด {value} · {conditions}"}
// @tolgee-key {"key": "cart.code.notFound", "ns": "buyer", "defaultValue": "ไม่พบโค้ด ตรวจสอบตัวสะกดอีกครั้ง"}
// @tolgee-key {"key": "cart.code.fullyClaimed", "ns": "buyer", "defaultValue": "โค้ดนี้ถูกเก็บครบแล้ว"}
// @tolgee-key {"key": "cart.code.claimFirst", "ns": "buyer", "defaultValue": "เก็บโค้ดก่อน แล้วจึงเลือกใช้ได้"}
// @tolgee-key {"key": "cart.code.shortfall", "ns": "buyer", "defaultValue": "ซื้อเพิ่มอีก {amount}"}
// @tolgee-key {"key": "cart.code.unusable", "ns": "buyer", "defaultValue": "โค้ดนี้ยังใช้ไม่ได้"}

export const checkoutMoney = (value: number) =>
  formatNumber(value, { style: "currency", currency: "THB", currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 2 });

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

/**
 * The slot (Pegasus or a shop) a preview outcome belongs to: where the code was
 * typed, not who owns it, so an unknown or wrong-slot code still finds its slot
 * [TCG-769]. Without the slot fields (older API) an outcome with no owner is the
 * Pegasus slot's.
 */
export function promotionOutcomeSlot(outcome: PromoCodeOutcome): "PLATFORM" | number | null {
  if (outcome.slotOwnerType === "PLATFORM") return "PLATFORM";
  if (outcome.slotOwnerType === "SELLER") return outcome.slotSellerProfileId ?? null;
  if (outcome.ownerType === "PLATFORM") return "PLATFORM";
  return outcome.sellerProfileId ?? (outcome.ownerType == null ? "PLATFORM" : null);
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
  if (promotion.discountType === "FREE_SHIPPING") return translate("buyer", "cart.common.freeShipping", "ส่งฟรี");
  if (promotion.discountType === "PERCENT") return `${promotion.discountValue}%`;
  return checkoutMoney(promotion.discountValue);
}

export function formatPromotionConditions(promotion: {
  minSpend?: number | null;
  maxDiscount?: number | null;
}): string {
  const parts: string[] = [];
  if (promotion.minSpend != null && promotion.minSpend > 0) {
    parts.push(translate("buyer", "cart.code.minSpend", "ขั้นต่ำ {amount}", { amount: checkoutMoney(promotion.minSpend) }));
  } else {
    parts.push(translate("buyer", "cart.code.noMinSpend", "ไม่มีขั้นต่ำ"));
  }
  if (promotion.maxDiscount != null && promotion.maxDiscount > 0) {
    parts.push(translate("buyer", "cart.code.maxDiscount", "สูงสุด {amount}", { amount: checkoutMoney(promotion.maxDiscount) }));
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
    return translate("buyer", "cart.code.freeShippingRule", "ส่งฟรี · {conditions}", { conditions });
  }
  return translate("buyer", "cart.code.discountRule", "ลด {value} · {conditions}", { value: val, conditions });
}

export function formatPromotionError(
  code: string | null | undefined,
  context?: {
    sellerName?: string | null;
    shortfall?: number | null;
    startsAt?: string | null;
  },
): string {
  const notFound = errorText("PROMO_NOT_FOUND") ?? translate("buyer", "cart.code.notFound", "ไม่พบโค้ด ตรวจสอบตัวสะกดอีกครั้ง");
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
      ? translate("buyer", "cart.code.fullyClaimed", "โค้ดนี้ถูกเก็บครบแล้ว")
      : translate("buyer", "cart.code.claimFirst", "เก็บโค้ดก่อน แล้วจึงเลือกใช้ได้");
  }
  if (
    promotion.reason === "PROMO_MIN_SPEND_NOT_MET" &&
    promotion.shortfall != null &&
    promotion.shortfall > 0
  ) {
    return translate("buyer", "cart.code.shortfall", "ซื้อเพิ่มอีก {amount}", { amount: checkoutMoney(promotion.shortfall) });
  }
  if (!promotion.reason) return translate("buyer", "cart.code.unusable", "โค้ดนี้ยังใช้ไม่ได้");
  return (
    formatPromotionError(promotion.reason, {
      sellerName: promotion.sellerName,
      shortfall: promotion.shortfall,
    }) || translate("buyer", "cart.code.unusable", "โค้ดนี้ยังใช้ไม่ได้")
  );
}
