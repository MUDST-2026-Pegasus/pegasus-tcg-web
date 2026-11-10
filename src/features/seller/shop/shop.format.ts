import { formatBaht } from '../shared/seller.format';
import { translate } from "@/lib/i18n";
export function extraFeeLabel(fee: number) { return fee > 0 ? translate("seller", "shop.shipping.extraFee", "+ {fee} ต่อใบถัดไป", { fee: formatBaht(fee) }) : translate("seller", "shop.shipping.noExtraFee", "ไม่คิดเพิ่มต่อใบ"); }
export function shippingDays(min: number | null, max: number | null) {
  if (min === null && max === null) return '—';
  if (min === null) return translate("seller", "shop.shipping.daysMax", "ไม่เกิน {max} วัน", { max: max ?? "" });
  if (max === null) return translate("seller", "shop.shipping.daysMin", "ตั้งแต่ {min} วัน", { min });
  return min === max ? translate("seller", "shop.shipping.days", "{days} วัน", { days: min }) : translate("seller", "shop.shipping.daysRange", "{min}–{max} วัน", { min, max });
}
export function maskAccount(account: string) { const clean = account.replace(/\s|-/g, ''); return clean.length > 4 ? `${'•'.repeat(clean.length - 4)}${clean.slice(-4)}` : '••••'; }

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "shop.shipping.extraFee", "ns": "seller", "defaultValue": "+ {fee} ต่อใบถัดไป"}
// @tolgee-key {"key": "shop.shipping.noExtraFee", "ns": "seller", "defaultValue": "ไม่คิดเพิ่มต่อใบ"}
// @tolgee-key {"key": "shop.shipping.daysMax", "ns": "seller", "defaultValue": "ไม่เกิน {max} วัน"}
// @tolgee-key {"key": "shop.shipping.daysMin", "ns": "seller", "defaultValue": "ตั้งแต่ {min} วัน"}
// @tolgee-key {"key": "shop.shipping.days", "ns": "seller", "defaultValue": "{days} วัน"}
// @tolgee-key {"key": "shop.shipping.daysRange", "ns": "seller", "defaultValue": "{min}–{max} วัน"}
