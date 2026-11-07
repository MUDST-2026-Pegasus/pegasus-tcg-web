import { getLanguage, translate } from "@/lib/language";
import { toast } from "@/components/ui/toast";
import { checkoutMoney, formatPromotionError } from "@/features/cart/checkout.format";
import { getErrorMessage, isApiError } from "@/lib/api";
import type { ClaimableCode, PromotionTerms } from "./claim.types";
import type { PromotionOwnerType } from "./order.types";

export type ClaimTicketState = "claimable" | "claimed" | "soldOut";

export function claimTicketState(promotion: Pick<ClaimableCode, "claimed" | "remainingClaims">): ClaimTicketState {
  if (promotion.claimed) return "claimed";
  return promotion.remainingClaims === 0 ? "soldOut" : "claimable";
}

const dateTime = () => new Intl.DateTimeFormat(getLanguage() === "th" ? "th-TH-u-ca-gregory" : "en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTermsDateTime(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateTime().format(date) : "—";
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days left before a code ends, rounded up; null once it has ended. */
export function daysUntil(value: string, now = Date.now()): number | null {
  const end = Date.parse(value);
  if (!Number.isFinite(end) || end <= now) return null;
  return Math.ceil((end - now) / DAY_MS);
}

/** W1 shows a code ending within 3 days in orange. */
export function isExpiringSoon(value: string, now = Date.now()): boolean {
  const days = daysUntil(value, now);
  return days != null && days <= 3;
}

/** The checklist in the "เงื่อนไขโค้ด" modal. */
export function termsRows(terms: PromotionTerms): Array<{ label: string; value: string }> {
  const platform = terms.ownerType === "PLATFORM";
  const shopName = terms.shop?.name ?? translate("ร้านนี้", "this shop");
  const rows: Array<{ label: string; value: string }> = [];

  rows.push({
    label: translate("ยอดขั้นต่ำ", "Minimum spend"),
    value: terms.minSpend > 0
      ? translate(`${checkoutMoney(terms.minSpend)} ${platform ? translate("จากสินค้าที่เข้าร่วม (หลังหักโค้ดร้าน ไม่รวมค่าส่ง)", "on eligible items after shop discounts, excluding shipping") : `จากสินค้าของ ${shopName}`}`, `${checkoutMoney(terms.minSpend)} ${platform ? translate("จากสินค้าที่เข้าร่วม (หลังหักโค้ดร้าน ไม่รวมค่าส่ง)", "on eligible items after shop discounts, excluding shipping") : `on products from ${shopName}`}`)
      : translate("ไม่มีขั้นต่ำ", "No minimum spend"),
  });
  if (terms.maxDiscount) {
    rows.push({ label: translate("ส่วนลดสูงสุด", "Maximum discount"), value: translate(`${checkoutMoney(terms.maxDiscount)} ต่อคำสั่งซื้อ`, `${checkoutMoney(terms.maxDiscount)} per order`) });
  }
  const targets = terms.scopeTargets.map((target) => target.name).join(", ");
  rows.push({
    label: translate("ใช้กับ", "Applies to"),
    value: terms.scopeType === "ALL" || !targets
      ? platform ? translate("ทุกเกม ทุกร้าน", "All games and shops") : translate(`ทุกสินค้าในร้าน ${shopName} เท่านั้น`, `All products from ${shopName} only`)
      : translate(`${terms.scopeType === "GAME" ? translate("เฉพาะเกม", "Selected games") : translate("เฉพาะหมวด", "Selected categories")} ${targets}${platform ? "" : ` ในร้าน ${shopName}`}`, `${terms.scopeType === "GAME" ? translate("เฉพาะเกม", "Selected games") : translate("เฉพาะหมวด", "Selected categories")} ${targets}${platform ? "" : ` at ${shopName}`}`),
  });
  rows.push({
    label: translate("ระยะเวลา", "Valid period"),
    value: `${formatTermsDateTime(terms.startsAt)} – ${formatTermsDateTime(terms.endsAt)}`,
  });
  rows.push({
    label: translate("สิทธิ์", "Usage limit"),
    value: translate(`${terms.usageLimitPerUser} ครั้งต่อบัญชี${terms.remainingClaims != null ? ` · เหลือ ${terms.remainingClaims.toLocaleString(getLanguage() === "th" ? "th-TH" : "en-US")} สิทธิ์` : ""}`, `${terms.usageLimitPerUser} uses per account${terms.remainingClaims != null ? ` · ${terms.remainingClaims.toLocaleString("en-US")} claims left` : ""}`),
  });
  if (terms.newBuyerOnly) {
    rows.push({ label: translate("ผู้ใช้", "Users"), value: translate("เฉพาะผู้ซื้อใหม่ (คำสั่งซื้อแรก)", "New buyers only (first order)") });
  }
  rows.push({
    label: translate("ใช้ร่วมกับ", "Can combine with"),
    value: platform
      ? terms.stacksWithShopCodes ? translate("โค้ดร้านได้ร้านละ 1 โค้ด", "One shop coupon per shop") : translate("ใช้ร่วมกับโค้ดอื่นไม่ได้", "Cannot combine with other coupons")
      : translate("โค้ด Pegasus ได้", "a Pegasus coupon"),
  });
  return rows;
}

/** Errors from claiming, worded for a toast or the field under "เก็บโค้ด". */
export function formatClaimError(code: string | null | undefined): string {
  if (code === "PROMO_CLAIM_FULL") return translate("โค้ดนี้ถูกเก็บครบแล้ว", "This coupon has been fully claimed");
  if (code === "PROMO_EXPIRED") return translate("โค้ดนี้หมดอายุแล้ว", "This coupon has expired");
  return formatPromotionError(code);
}

export function claimErrorMessage(error: unknown): string {
  if (isApiError(error) && error.code.startsWith("PROMO_")) return formatClaimError(error.code);
  return getErrorMessage(error, translate("เก็บโค้ดไม่สำเร็จ ลองใหม่อีกครั้ง", "Could not collect coupon. Please try again"));
}

export async function copyPromotionCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.add({ type: "success", title: translate(`คัดลอก ${code} แล้ว`, `${code} copied`) });
  } catch {
    toast.add({ type: "error", title: translate("คัดลอกไม่สำเร็จ", "Could not copy") });
  }
}

/** "ลด 10% สูงสุด ฿200 · ขั้นต่ำ ฿500 · เฉพาะ CardVault BKK" — W1's second line. */
export function walletRuleSummary(code: {
  ownerType: PromotionOwnerType;
  shop: { name: string } | null;
  discountType: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
  maxDiscount: number | null;
  minSpend: number;
}): string {
  const parts: string[] = [];
  if (code.discountType === "PERCENT") {
    parts.push(translate(`ลด ${code.discountValue}%${code.maxDiscount ? ` สูงสุด ${checkoutMoney(code.maxDiscount)}` : ""}`, `${code.discountValue}% off${code.maxDiscount ? ` up to ${checkoutMoney(code.maxDiscount)}` : ""}`));
  } else if (code.discountType === "FREE_SHIPPING") {
    parts.push(code.maxDiscount ? translate(`ส่งฟรีสูงสุด ${checkoutMoney(code.maxDiscount)}/ร้าน`, `Free shipping up to ${checkoutMoney(code.maxDiscount)} per shop`) : translate("ส่งฟรี", "Free shipping"));
  }
  parts.push(code.minSpend > 0 ? translate(`ขั้นต่ำ ${checkoutMoney(code.minSpend)}`, `Minimum spend ${checkoutMoney(code.minSpend)}`) : translate("ไม่มีขั้นต่ำ", "No minimum spend"));
  if (code.ownerType === "SELLER" && code.shop) parts.push(translate(`เฉพาะ ${code.shop.name}`, `Only ${code.shop.name}`));
  return parts.join(" · ");
}
