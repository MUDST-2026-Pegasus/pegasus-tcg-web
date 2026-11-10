import { toast } from "@/components/ui/toast";
import { checkoutMoney, formatPromotionError } from "@/features/cart/checkout.format";
import { isApiError } from "@/lib/api";
import type { ClaimableCode, PromotionTerms } from "./claim.types";
import type { PromotionOwnerType } from "./order.types";
import { dateTimeFormat, intlLocale, translate, translateError } from "@/lib/i18n";

// @tolgee-key {"key":"buyer.claimFormat.shopName","ns":"promotions","defaultValue":"ร้านนี้"}
// @tolgee-key {"key":"buyer.claimFormat.label","ns":"promotions","defaultValue":"ยอดขั้นต่ำ"}
// @tolgee-key {"key":"buyer.claimFormat.value","ns":"promotions","defaultValue":"จากสินค้าที่เข้าร่วม (หลังหักโค้ดร้าน ไม่รวมค่าส่ง)"}
// @tolgee-key {"key":"buyer.claimFormat.value2","ns":"promotions","defaultValue":"จากสินค้าของ {shopName}"}
// @tolgee-key {"key":"buyer.claimFormat.value3","ns":"promotions","defaultValue":"ไม่มีขั้นต่ำ"}
// @tolgee-key {"key":"buyer.claimFormat.label2","ns":"promotions","defaultValue":"ส่วนลดสูงสุด"}
// @tolgee-key {"key":"buyer.claimFormat.value4","ns":"promotions","defaultValue":"{value} ต่อคำสั่งซื้อ"}
// @tolgee-key {"key":"buyer.claimFormat.label3","ns":"promotions","defaultValue":"ใช้กับ"}
// @tolgee-key {"key":"buyer.claimFormat.value5","ns":"promotions","defaultValue":"ทุกเกม ทุกร้าน"}
// @tolgee-key {"key":"buyer.claimFormat.value6","ns":"promotions","defaultValue":"ทุกสินค้าในร้าน {shopName} เท่านั้น"}
// @tolgee-key {"key":"buyer.claimFormat.value7","ns":"promotions","defaultValue":"เฉพาะเกม"}
// @tolgee-key {"key":"buyer.claimFormat.value8","ns":"promotions","defaultValue":"เฉพาะหมวด"}
// @tolgee-key {"key":"buyer.claimFormat.value9","ns":"promotions","defaultValue":" ในร้าน {shopName}"}
// @tolgee-key {"key":"buyer.claimFormat.label4","ns":"promotions","defaultValue":"ระยะเวลา"}
// @tolgee-key {"key":"buyer.claimFormat.label5","ns":"promotions","defaultValue":"สิทธิ์"}
// @tolgee-key {"key":"buyer.claimFormat.value10","ns":"promotions","defaultValue":" · เหลือ {value} สิทธิ์"}
// @tolgee-key {"key":"buyer.claimFormat.value11","ns":"promotions","defaultValue":"{usageLimitPerUser} ครั้งต่อบัญชี{value}"}
// @tolgee-key {"key":"buyer.claimFormat.label6","ns":"promotions","defaultValue":"ผู้ใช้"}
// @tolgee-key {"key":"buyer.claimFormat.value12","ns":"promotions","defaultValue":"เฉพาะผู้ซื้อใหม่ (คำสั่งซื้อแรก)"}
// @tolgee-key {"key":"buyer.claimFormat.label7","ns":"promotions","defaultValue":"ใช้ร่วมกับ"}
// @tolgee-key {"key":"buyer.claimFormat.value13","ns":"promotions","defaultValue":"โค้ดร้านได้ร้านละ 1 โค้ด"}
// @tolgee-key {"key":"buyer.claimFormat.value14","ns":"promotions","defaultValue":"ใช้ร่วมกับโค้ดอื่นไม่ได้"}
// @tolgee-key {"key":"buyer.claimFormat.value15","ns":"promotions","defaultValue":"โค้ด Pegasus ได้"}
// @tolgee-key {"key":"buyer.claimFormat.formatClaimError","ns":"promotions","defaultValue":"โค้ดนี้ถูกเก็บครบแล้ว"}
// @tolgee-key {"key":"buyer.claimFormat.formatClaimError2","ns":"promotions","defaultValue":"โค้ดนี้หมดอายุแล้ว"}
// @tolgee-key {"key":"buyer.claimFormat.translateError","ns":"promotions","defaultValue":"เก็บโค้ดไม่สำเร็จ ลองใหม่อีกครั้ง"}
// @tolgee-key {"key":"buyer.claimFormat.title","ns":"promotions","defaultValue":"คัดลอก {code} แล้ว"}
// @tolgee-key {"key":"buyer.claimFormat.title2","ns":"promotions","defaultValue":"คัดลอกไม่สำเร็จ"}
// @tolgee-key {"key":"buyer.claimFormat.push","ns":"promotions","defaultValue":" สูงสุด {value}"}
// @tolgee-key {"key":"buyer.claimFormat.push2","ns":"promotions","defaultValue":"ลด {discountValue}%{value}"}
// @tolgee-key {"key":"buyer.claimFormat.push3","ns":"promotions","defaultValue":"ส่งฟรีสูงสุด {value}/ร้าน"}
// @tolgee-key {"key":"buyer.claimFormat.push4","ns":"promotions","defaultValue":"ส่งฟรี"}
// @tolgee-key {"key":"buyer.claimFormat.push5","ns":"promotions","defaultValue":"ขั้นต่ำ {value}"}
// @tolgee-key {"key":"buyer.claimFormat.push6","ns":"promotions","defaultValue":"เฉพาะ {name}"}

export type ClaimTicketState = "claimable" | "claimed" | "soldOut";

export function claimTicketState(promotion: Pick<ClaimableCode, "claimed" | "remainingClaims">): ClaimTicketState {
  if (promotion.claimed) return "claimed";
  return promotion.remainingClaims === 0 ? "soldOut" : "claimable";
}

const dateTime = dateTimeFormat({
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}, { calendar: "gregory" });

export function formatTermsDateTime(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateTime.format(date) : "—";
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
  const shopName = terms.shop?.name ?? translate("promotions", "buyer.claimFormat.shopName", "ร้านนี้");
  const rows: Array<{ label: string; value: string }> = [];

  rows.push({
    label: translate("promotions", "buyer.claimFormat.label", "ยอดขั้นต่ำ"),
    value: terms.minSpend > 0
      ? `${checkoutMoney(terms.minSpend)} ${platform ? translate("promotions", "buyer.claimFormat.value", "จากสินค้าที่เข้าร่วม (หลังหักโค้ดร้าน ไม่รวมค่าส่ง)") : translate("promotions", "buyer.claimFormat.value2", "จากสินค้าของ {shopName}", { shopName })}`
      : translate("promotions", "buyer.claimFormat.value3", "ไม่มีขั้นต่ำ"),
  });
  if (terms.maxDiscount) {
    rows.push({ label: translate("promotions", "buyer.claimFormat.label2", "ส่วนลดสูงสุด"), value: translate("promotions", "buyer.claimFormat.value4", "{value} ต่อคำสั่งซื้อ", { value: checkoutMoney(terms.maxDiscount) }) });
  }
  const targets = terms.scopeTargets.map((target) => target.name).join(", ");
  rows.push({
    label: translate("promotions", "buyer.claimFormat.label3", "ใช้กับ"),
    value: terms.scopeType === "ALL" || !targets
      ? platform ? translate("promotions", "buyer.claimFormat.value5", "ทุกเกม ทุกร้าน") : translate("promotions", "buyer.claimFormat.value6", "ทุกสินค้าในร้าน {shopName} เท่านั้น", { shopName })
      : `${terms.scopeType === "GAME" ? translate("promotions", "buyer.claimFormat.value7", "เฉพาะเกม") : translate("promotions", "buyer.claimFormat.value8", "เฉพาะหมวด")} ${targets}${platform ? "" : translate("promotions", "buyer.claimFormat.value9", " ในร้าน {shopName}", { shopName })}`,
  });
  rows.push({
    label: translate("promotions", "buyer.claimFormat.label4", "ระยะเวลา"),
    value: `${formatTermsDateTime(terms.startsAt)} – ${formatTermsDateTime(terms.endsAt)}`,
  });
  rows.push({
    label: translate("promotions", "buyer.claimFormat.label5", "สิทธิ์"),
    value: translate("promotions", "buyer.claimFormat.value11", "{usageLimitPerUser} ครั้งต่อบัญชี{value}", { usageLimitPerUser: terms.usageLimitPerUser, value: terms.remainingClaims != null ? translate("promotions", "buyer.claimFormat.value10", " · เหลือ {value} สิทธิ์", { value: terms.remainingClaims.toLocaleString(intlLocale()) }) : "" }),
  });
  if (terms.newBuyerOnly) {
    rows.push({ label: translate("promotions", "buyer.claimFormat.label6", "ผู้ใช้"), value: translate("promotions", "buyer.claimFormat.value12", "เฉพาะผู้ซื้อใหม่ (คำสั่งซื้อแรก)") });
  }
  rows.push({
    label: translate("promotions", "buyer.claimFormat.label7", "ใช้ร่วมกับ"),
    value: platform
      ? terms.stacksWithShopCodes ? translate("promotions", "buyer.claimFormat.value13", "โค้ดร้านได้ร้านละ 1 โค้ด") : translate("promotions", "buyer.claimFormat.value14", "ใช้ร่วมกับโค้ดอื่นไม่ได้")
      : translate("promotions", "buyer.claimFormat.value15", "โค้ด Pegasus ได้"),
  });
  return rows;
}

/** Errors from claiming, worded for a toast or the field under "เก็บโค้ด". */
export function formatClaimError(code: string | null | undefined): string {
  if (code === "PROMO_CLAIM_FULL") return translate("promotions", "buyer.claimFormat.formatClaimError", "โค้ดนี้ถูกเก็บครบแล้ว");
  if (code === "PROMO_EXPIRED") return translate("promotions", "buyer.claimFormat.formatClaimError2", "โค้ดนี้หมดอายุแล้ว");
  return formatPromotionError(code);
}

export function claimErrorMessage(error: unknown): string {
  if (isApiError(error) && error.code.startsWith("PROMO_")) return formatClaimError(error.code);
  return translateError(error, translate("promotions", "buyer.claimFormat.translateError", "เก็บโค้ดไม่สำเร็จ ลองใหม่อีกครั้ง"));
}

export async function copyPromotionCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.add({ type: "success", title: translate("promotions", "buyer.claimFormat.title", "คัดลอก {code} แล้ว", { code }) });
  } catch {
    toast.add({ type: "error", title: translate("promotions", "buyer.claimFormat.title2", "คัดลอกไม่สำเร็จ") });
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
    parts.push(translate("promotions", "buyer.claimFormat.push2", "ลด {discountValue}%{value}", { discountValue: code.discountValue, value: code.maxDiscount ? translate("promotions", "buyer.claimFormat.push", " สูงสุด {value}", { value: checkoutMoney(code.maxDiscount) }) : "" }));
  } else if (code.discountType === "FREE_SHIPPING") {
    parts.push(code.maxDiscount ? translate("promotions", "buyer.claimFormat.push3", "ส่งฟรีสูงสุด {value}/ร้าน", { value: checkoutMoney(code.maxDiscount) }) : translate("promotions", "buyer.claimFormat.push4", "ส่งฟรี"));
  }
  parts.push(code.minSpend > 0 ? translate("promotions", "buyer.claimFormat.push5", "ขั้นต่ำ {value}", { value: checkoutMoney(code.minSpend) }) : translate("promotions", "buyer.claimFormat.value3", "ไม่มีขั้นต่ำ"));
  if (code.ownerType === "SELLER" && code.shop) parts.push(translate("promotions", "buyer.claimFormat.push6", "เฉพาะ {name}", { name: code.shop.name }));
  return parts.join(" · ");
}
