import type { Payout } from "@/features/finance/finance.types";
import { intlLocale, translate, formatMoney } from "@/lib/i18n";

// The seller API does not expose payout.minimum_amount yet.
export const PAYOUT_MINIMUM = 100;

export const payoutStatuses: Record<string, { label: string; className: string }> = {
  REQUESTED: { get label() { return translate("seller", "payout.status.REQUESTED", "รอตรวจสอบ"); }, className: "bg-secondary text-slate-600" },
  APPROVED: { get label() { return translate("seller", "payout.status.APPROVED", "อนุมัติแล้ว"); }, className: "bg-sky-100 text-primary" },
  PROCESSING: { get label() { return translate("seller", "payout.status.PROCESSING", "กำลังโอน"); }, className: "bg-amber-100 text-amber-700" },
  PAID: { get label() { return translate("seller", "payout.status.PAID", "โอนสำเร็จ"); }, className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { get label() { return translate("seller", "payout.status.REJECTED", "ไม่อนุมัติ"); }, className: "bg-red-100 text-red-700" },
  FAILED: { get label() { return translate("seller", "payout.status.FAILED", "โอนไม่สำเร็จ"); }, className: "bg-red-100 text-red-700" },
};

export const payoutStatus = (status: string) => payoutStatuses[status] ?? { label: status, className: "bg-secondary text-slate-600" };
export const money = (value: number | string) => formatMoney(Number(value));
export const formatThaiDateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat(intlLocale(), {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Bangkok",
}).format(new Date(value)).replace(/\s+(\d{2}:\d{2})$/, " · $1") : "—";
export const maskAccount = (value: string) => value.length > 4 ? `••••${value.slice(-4)}` : value;

export function validatePayoutAmount(amount: string, withdrawable: number, min = PAYOUT_MINIMUM): string | null {
  if (!amount) return translate("seller", "payout.validation.required", "กรุณาระบุจำนวนเงิน");
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || !Number.isFinite(Number(amount))) return translate("seller", "payout.validation.format", "กรุณาระบุจำนวนเงินเป็นตัวเลขและทศนิยมไม่เกิน 2 ตำแหน่ง");
  if (Number(amount) < min) return translate("seller", "payout.validation.min", "ขั้นต่ำต่อครั้ง {min}", { min: money(min) });
  if (Number(amount) > withdrawable) return translate("seller", "payout.validation.max", "เกินยอดถอนได้ {max} — กด ''ถอนทั้งหมด'' เพื่อใส่ยอดสูงสุด", { max: money(withdrawable) });
  return null;
}

export function payoutDetail(payout: Payout): string {
  switch (payout.status) {
    case "REQUESTED": return translate("seller", "payout.detail.requested", "รอแอดมินตรวจสอบ");
    case "APPROVED":
    case "PROCESSING": return translate("seller", "payout.detail.approvedAt", "อนุมัติเมื่อ {date}", { date: formatThaiDateTime(payout.approvedAt) });
    case "PAID": return translate("seller", "payout.detail.paidAt", "โอนเมื่อ {date}", { date: formatThaiDateTime(payout.paidAt) }) + (payout.transferReference ? translate("seller", "payout.detail.reference", " · อ้างอิง {reference}", { reference: payout.transferReference }) : "");
    case "REJECTED":
    case "FAILED": return translate("seller", "payout.detail.rejected", "{reason} · ยอดกลับมาถอนได้แล้ว", { reason: payout.rejectionReason ?? translate("seller", "payout.detail.noReason", "ไม่ระบุเหตุผล") });
    default: return payout.status;
  }
}

const walletEntryLabels: Record<string, string> = {
  get SELLER_EARNING() { return translate("seller", "payout.ledger.type.SELLER_EARNING", "รายได้จากออเดอร์"); },
  get PROMO_SUBSIDY() { return translate("seller", "payout.ledger.type.PROMO_SUBSIDY", "Pegasus ชดเชยส่วนลด"); },
  get REFUND_OUT() { return translate("seller", "payout.ledger.type.REFUND_OUT", "คืนเงินผู้ซื้อ"); },
  get PAYOUT_OUT() { return translate("seller", "payout.ledger.type.PAYOUT_OUT", "ถอนเงิน"); },
  get ADJUSTMENT() { return translate("seller", "payout.ledger.type.ADJUSTMENT", "ปรับยอดโดยแอดมิน"); },
};
export const walletEntryLabel = (type: string) => walletEntryLabels[type] ?? type;

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-555]
// @tolgee-key {"key": "payout.status.REQUESTED", "ns": "seller", "defaultValue": "รอตรวจสอบ"}
// @tolgee-key {"key": "payout.status.APPROVED", "ns": "seller", "defaultValue": "อนุมัติแล้ว"}
// @tolgee-key {"key": "payout.status.PROCESSING", "ns": "seller", "defaultValue": "กำลังโอน"}
// @tolgee-key {"key": "payout.status.PAID", "ns": "seller", "defaultValue": "โอนสำเร็จ"}
// @tolgee-key {"key": "payout.status.REJECTED", "ns": "seller", "defaultValue": "ไม่อนุมัติ"}
// @tolgee-key {"key": "payout.status.FAILED", "ns": "seller", "defaultValue": "โอนไม่สำเร็จ"}
// @tolgee-key {"key": "payout.validation.required", "ns": "seller", "defaultValue": "กรุณาระบุจำนวนเงิน"}
// @tolgee-key {"key": "payout.validation.format", "ns": "seller", "defaultValue": "กรุณาระบุจำนวนเงินเป็นตัวเลขและทศนิยมไม่เกิน 2 ตำแหน่ง"}
// @tolgee-key {"key": "payout.validation.min", "ns": "seller", "defaultValue": "ขั้นต่ำต่อครั้ง {min}"}
// @tolgee-key {"key": "payout.validation.max", "ns": "seller", "defaultValue": "เกินยอดถอนได้ {max} — กด ''ถอนทั้งหมด'' เพื่อใส่ยอดสูงสุด"}
// @tolgee-key {"key": "payout.detail.requested", "ns": "seller", "defaultValue": "รอแอดมินตรวจสอบ"}
// @tolgee-key {"key": "payout.detail.approvedAt", "ns": "seller", "defaultValue": "อนุมัติเมื่อ {date}"}
// @tolgee-key {"key": "payout.detail.paidAt", "ns": "seller", "defaultValue": "โอนเมื่อ {date}"}
// @tolgee-key {"key": "payout.detail.reference", "ns": "seller", "defaultValue": " · อ้างอิง {reference}"}
// @tolgee-key {"key": "payout.detail.rejected", "ns": "seller", "defaultValue": "{reason} · ยอดกลับมาถอนได้แล้ว"}
// @tolgee-key {"key": "payout.detail.noReason", "ns": "seller", "defaultValue": "ไม่ระบุเหตุผล"}
// @tolgee-key {"key": "payout.ledger.type.SELLER_EARNING", "ns": "seller", "defaultValue": "รายได้จากออเดอร์"}
// @tolgee-key {"key": "payout.ledger.type.PROMO_SUBSIDY", "ns": "seller", "defaultValue": "Pegasus ชดเชยส่วนลด"}
// @tolgee-key {"key": "payout.ledger.type.REFUND_OUT", "ns": "seller", "defaultValue": "คืนเงินผู้ซื้อ"}
// @tolgee-key {"key": "payout.ledger.type.PAYOUT_OUT", "ns": "seller", "defaultValue": "ถอนเงิน"}
// @tolgee-key {"key": "payout.ledger.type.ADJUSTMENT", "ns": "seller", "defaultValue": "ปรับยอดโดยแอดมิน"}
