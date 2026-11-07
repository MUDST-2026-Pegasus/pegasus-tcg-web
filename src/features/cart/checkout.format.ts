import { getLanguage, translate } from "@/lib/language";
import type { AvailablePromotion } from "./promotions.types";

export const checkoutMoney = (value: number) =>
  `฿${value.toLocaleString(getLanguage() === "th" ? "th-TH" : "en-US", { maximumFractionDigits: 2 })}`;

const dayMonthYear = () => new Intl.DateTimeFormat(getLanguage() === "th" ? "th-TH-u-ca-gregory" : "en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatPromotionDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return dayMonthYear().format(date);
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
  if (promotion.discountType === "FREE_SHIPPING") return translate("ส่งฟรี", "Free shipping");
  if (promotion.discountType === "PERCENT") return `${promotion.discountValue}%`;
  return checkoutMoney(promotion.discountValue);
}

export function formatPromotionConditions(promotion: {
  minSpend?: number | null;
  maxDiscount?: number | null;
}): string {
  const parts: string[] = [];
  if (promotion.minSpend != null && promotion.minSpend > 0) {
    parts.push(translate(`ขั้นต่ำ ${checkoutMoney(promotion.minSpend)}`, `Minimum spend ${checkoutMoney(promotion.minSpend)}`));
  } else {
    parts.push(translate("ไม่มีขั้นต่ำ", "No minimum spend"));
  }
  if (promotion.maxDiscount != null && promotion.maxDiscount > 0) {
    parts.push(translate(`สูงสุด ${checkoutMoney(promotion.maxDiscount)}`, `Up to ${checkoutMoney(promotion.maxDiscount)}`));
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
    return translate(`ส่งฟรี · ${conditions}`, `Free shipping · ${conditions}`);
  }
  return translate(`ลด ${val} · ${conditions}`, `${val} off · ${conditions}`);
}

export function formatPromotionError(
  code: string | null | undefined,
  context?: {
    sellerName?: string | null;
    shortfall?: number | null;
    startsAt?: string | null;
  },
): string {
  if (!code) return translate("ไม่พบโค้ด ตรวจสอบตัวสะกดอีกครั้ง", "Code not found. Check the spelling");
  const cleanCode = code.trim().toUpperCase();

  switch (cleanCode) {
    case "PROMO_EXPIRED":
      return translate("โค้ดหมดอายุแล้ว", "This coupon has expired");
    case "PROMO_MIN_SPEND_NOT_MET":
      return context?.shortfall != null && context.shortfall > 0
        ? translate(`ซื้อสินค้าเพิ่มอีก ${checkoutMoney(context.shortfall)} เพื่อใช้โค้ดนี้`, `Spend another ${checkoutMoney(context.shortfall)} to use this coupon`)
        : translate("ยอดซื้อยังไม่ถึงยอดขั้นต่ำเพื่อใช้โค้ดนี้", "The minimum spend for this coupon has not been reached");
    case "PROMO_WRONG_SELLER":
      return context?.sellerName
        ? translate(`โค้ดนี้เป็นของร้าน ${context.sellerName} — ใส่ในช่อง “โค้ดร้าน” ของร้านนั้น`, `This code belongs to ${context.sellerName}. Enter it in that shop’s coupon field`)
        : translate("โค้ดนี้เป็นของร้านค้าอื่น — ใส่ในช่อง “โค้ดร้าน” ของร้านนั้น", "This code belongs to another shop. Enter it in that shop’s coupon field");
    case "PROMO_USED_UP":
      return translate("สิทธิ์ของโค้ดถูกใช้ครบแล้ว", "This coupon has reached its usage limit");
    case "PROMO_USER_LIMIT_REACHED":
      return translate("คุณใช้โค้ดนี้ครบจำนวนครั้งแล้ว", "You have reached your usage limit for this coupon");
    case "PROMO_NOT_STARTED":
      return context?.startsAt
        ? translate(`โค้ดใช้ได้ตั้งแต่วันที่ ${formatPromotionDate(context.startsAt)}`, `This coupon starts on ${formatPromotionDate(context.startsAt)}`)
        : translate("โค้ดยังไม่เริ่มใช้งาน", "This coupon is not active yet");
    case "PROMO_NOT_APPLICABLE":
      return translate("ไม่มีสินค้าในตะกร้าที่เข้าเงื่อนไขโค้ดนี้", "No cart items qualify for this coupon");
    case "PROMO_NOT_CLAIMED":
      return translate("โค้ดนี้ต้องเก็บก่อนใช้งาน", "Collect this coupon before using it");
    case "PROMO_CLAIM_FULL":
      return translate("โค้ดถูกเก็บครบสิทธิ์แล้ว", "This coupon has been fully claimed");
    case "PROMO_PAUSED":
      return translate("โค้ดถูกระงับชั่วคราว", "This coupon is temporarily paused");
    case "PROMO_CHANGED":
      return translate("ยอดชำระเปลี่ยนไป", "The amount due has changed");
    case "PROMO_NOT_FOUND":
    default:
      return translate("ไม่พบโค้ด ตรวจสอบตัวสะกดอีกครั้ง", "Code not found. Check the spelling");
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
      ? translate("โค้ดนี้ถูกเก็บครบแล้ว", "This coupon has been fully claimed")
      : translate("เก็บโค้ดก่อน แล้วจึงเลือกใช้ได้", "Collect this coupon before selecting it");
  }
  if (
    promotion.reason === "PROMO_MIN_SPEND_NOT_MET" &&
    promotion.shortfall != null &&
    promotion.shortfall > 0
  ) {
    return translate(`ซื้อเพิ่มอีก ${checkoutMoney(promotion.shortfall)}`, `Spend another ${checkoutMoney(promotion.shortfall)}`);
  }
  if (!promotion.reason) return translate("โค้ดนี้ยังใช้ไม่ได้", "This coupon is not available yet");
  return (
    formatPromotionError(promotion.reason, {
      sellerName: promotion.sellerName,
      shortfall: promotion.shortfall,
    }) || translate("โค้ดนี้ยังใช้ไม่ได้", "This coupon is not available yet")
  );
}
