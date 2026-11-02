import { toast } from "@/components/ui/toast";
import { checkoutMoney, formatPromotionError } from "@/features/cart/checkout.format";
import { getErrorMessage, isApiError } from "@/lib/api";
import type { ClaimableCode, PromotionTerms } from "./claim.types";

export type ClaimTicketState = "claimable" | "claimed" | "soldOut";

export function claimTicketState(promotion: Pick<ClaimableCode, "claimed" | "remainingClaims">): ClaimTicketState {
  if (promotion.claimed) return "claimed";
  return promotion.remainingClaims === 0 ? "soldOut" : "claimable";
}

const dateTime = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

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
  const shopName = terms.shop?.name ?? "ร้านนี้";
  const rows: Array<{ label: string; value: string }> = [];

  rows.push({
    label: "ยอดขั้นต่ำ",
    value: terms.minSpend > 0
      ? `${checkoutMoney(terms.minSpend)} ${platform ? "จากสินค้าที่เข้าร่วม (หลังหักโค้ดร้าน ไม่รวมค่าส่ง)" : `จากสินค้าของ ${shopName}`}`
      : "ไม่มีขั้นต่ำ",
  });
  if (terms.maxDiscount) {
    rows.push({ label: "ส่วนลดสูงสุด", value: `${checkoutMoney(terms.maxDiscount)} ต่อคำสั่งซื้อ` });
  }
  const targets = terms.scopeTargets.map((target) => target.name).join(", ");
  rows.push({
    label: "ใช้กับ",
    value: terms.scopeType === "ALL" || !targets
      ? platform ? "ทุกเกม ทุกร้าน" : `ทุกสินค้าในร้าน ${shopName} เท่านั้น`
      : `${terms.scopeType === "GAME" ? "เฉพาะเกม" : "เฉพาะหมวด"} ${targets}${platform ? "" : ` ในร้าน ${shopName}`}`,
  });
  rows.push({
    label: "ระยะเวลา",
    value: `${formatTermsDateTime(terms.startsAt)} – ${formatTermsDateTime(terms.endsAt)}`,
  });
  rows.push({
    label: "สิทธิ์",
    value: `${terms.usageLimitPerUser} ครั้งต่อบัญชี${terms.remainingClaims != null ? ` · เหลือ ${terms.remainingClaims.toLocaleString("th-TH")} สิทธิ์` : ""}`,
  });
  if (terms.newBuyerOnly) {
    rows.push({ label: "ผู้ใช้", value: "เฉพาะผู้ซื้อใหม่ (คำสั่งซื้อแรก)" });
  }
  rows.push({
    label: "ใช้ร่วมกับ",
    value: platform
      ? terms.stacksWithShopCodes ? "โค้ดร้านได้ร้านละ 1 โค้ด" : "ใช้ร่วมกับโค้ดอื่นไม่ได้"
      : "โค้ด Pegasus ได้",
  });
  return rows;
}

/** Errors from claiming, worded for a toast or the field under "เก็บโค้ด". */
export function formatClaimError(code: string | null | undefined): string {
  if (code === "PROMO_CLAIM_FULL") return "โค้ดนี้ถูกเก็บครบแล้ว";
  if (code === "PROMO_EXPIRED") return "โค้ดนี้หมดอายุแล้ว";
  return formatPromotionError(code);
}

export function claimErrorMessage(error: unknown): string {
  if (isApiError(error) && error.code.startsWith("PROMO_")) return formatClaimError(error.code);
  return getErrorMessage(error, "เก็บโค้ดไม่สำเร็จ ลองใหม่อีกครั้ง");
}

export async function copyPromotionCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.add({ type: "success", title: `คัดลอก ${code} แล้ว` });
  } catch {
    toast.add({ type: "error", title: "คัดลอกไม่สำเร็จ" });
  }
}

/** "ลด 10% สูงสุด ฿200 · ขั้นต่ำ ฿500 · เฉพาะ CardVault BKK" — W1's second line. */
export function walletRuleSummary(code: {
  ownerType: "PLATFORM" | "SELLER";
  shop: { name: string } | null;
  discountType: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
  maxDiscount: number | null;
  minSpend: number;
}): string {
  const parts: string[] = [];
  if (code.discountType === "PERCENT") {
    parts.push(`ลด ${code.discountValue}%${code.maxDiscount ? ` สูงสุด ${checkoutMoney(code.maxDiscount)}` : ""}`);
  } else if (code.discountType === "FREE_SHIPPING") {
    parts.push(code.maxDiscount ? `ส่งฟรีสูงสุด ${checkoutMoney(code.maxDiscount)}/ร้าน` : "ส่งฟรี");
  }
  parts.push(code.minSpend > 0 ? `ขั้นต่ำ ${checkoutMoney(code.minSpend)}` : "ไม่มีขั้นต่ำ");
  if (code.ownerType === "SELLER" && code.shop) parts.push(`เฉพาะ ${code.shop.name}`);
  return parts.join(" · ");
}
