import { getLanguage, translate } from "@/lib/language";
import type { Payout } from "@/features/finance/finance.types";

// The seller API does not expose payout.minimum_amount yet.
export const PAYOUT_MINIMUM = 100;

export const payoutStatuses: Record<string, { label: string; className: string }> = {
  REQUESTED: { get label() { return translate("รอตรวจสอบ", "Pending review"); }, className: "bg-secondary text-slate-600" },
  APPROVED: { get label() { return translate("อนุมัติแล้ว", "Approved"); }, className: "bg-sky-100 text-primary" },
  PROCESSING: { get label() { return translate("กำลังโอน", "Transferring"); }, className: "bg-amber-100 text-amber-700" },
  PAID: { get label() { return translate("โอนสำเร็จ", "Transfer completed"); }, className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { get label() { return translate("ไม่อนุมัติ", "Reject"); }, className: "bg-red-100 text-red-700" },
  FAILED: { get label() { return translate("โอนไม่สำเร็จ", "Transfer failed"); }, className: "bg-red-100 text-red-700" },
};

export const payoutStatus = (status: string) => payoutStatuses[status] ?? { label: status, className: "bg-secondary text-slate-600" };
export const money = (value: number | string) => `฿${Number(value).toLocaleString(getLanguage() === "th" ? "th-TH" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const formatThaiDateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat(getLanguage() === "th" ? "th-TH" : "en-GB", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Bangkok",
}).format(new Date(value)).replace(/\s+(\d{2}:\d{2})$/, " · $1") : "—";
export const maskAccount = (value: string) => value.length > 4 ? `••••${value.slice(-4)}` : value;

export function validatePayoutAmount(amount: string, withdrawable: number, min = PAYOUT_MINIMUM): string | null {
  if (!amount) return translate("กรุณาระบุจำนวนเงิน", "Enter an amount");
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || !Number.isFinite(Number(amount))) return translate("กรุณาระบุจำนวนเงินเป็นตัวเลขและทศนิยมไม่เกิน 2 ตำแหน่ง", "Enter a number with no more than two decimal places");
  if (Number(amount) < min) return translate(`ขั้นต่ำต่อครั้ง ${money(min)}`, `Minimum withdrawal: ${money(min)}`);
  if (Number(amount) > withdrawable) return translate(`เกินยอดถอนได้ ${money(withdrawable)} — กด 'ถอนทั้งหมด' เพื่อใส่ยอดสูงสุด`, `Exceeds the withdrawable balance of ${money(withdrawable)} — select 'Withdraw all' to enter the maximum`);
  return null;
}

export function payoutDetail(payout: Payout): string {
  switch (payout.status) {
    case "REQUESTED": return translate("รอแอดมินตรวจสอบ", "Awaiting administrator review");
    case "APPROVED":
    case "PROCESSING": return translate(`อนุมัติเมื่อ ${formatThaiDateTime(payout.approvedAt)}`, `Approved on ${formatThaiDateTime(payout.approvedAt)}`);
    case "PAID": return translate(`โอนเมื่อ ${formatThaiDateTime(payout.paidAt)}${payout.transferReference ? ` · อ้างอิง ${payout.transferReference}` : ""}`, `Transferred on ${formatThaiDateTime(payout.paidAt)}${payout.transferReference ? ` · Reference ${payout.transferReference}` : ""}`);
    case "REJECTED":
    case "FAILED": return translate(`${payout.rejectionReason ?? "ไม่ระบุเหตุผล"} · ยอดกลับมาถอนได้แล้ว`, `${payout.rejectionReason ?? "No reason provided"} · Funds are available to withdraw again`);
    default: return payout.status;
  }
}

const walletEntryLabels: Record<string, string> = {
  get SELLER_EARNING() { return translate("รายได้จากออเดอร์", "Order earnings"); },
  get PROMO_SUBSIDY() { return translate("Pegasus ชดเชยส่วนลด", "Pegasus discount subsidy"); },
  get REFUND_OUT() { return translate("คืนเงินผู้ซื้อ", "Buyer refund"); },
  get PAYOUT_OUT() { return translate("ถอนเงิน", "Withdraw"); },
  get ADJUSTMENT() { return translate("ปรับยอดโดยแอดมิน", "Administrator adjustment"); },
};
export const walletEntryLabel = (type: string) => walletEntryLabels[type] ?? type;
