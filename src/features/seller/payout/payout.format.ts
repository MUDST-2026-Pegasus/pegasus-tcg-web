import type { Payout } from "@/features/finance/finance.types";

// The seller API does not expose payout.minimum_amount yet.
export const PAYOUT_MINIMUM = 100;

export const payoutStatuses: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: "รอตรวจสอบ", className: "bg-slate-100 text-slate-600" },
  APPROVED: { label: "อนุมัติแล้ว", className: "bg-sky-100 text-sky-700" },
  PROCESSING: { label: "กำลังโอน", className: "bg-amber-100 text-amber-700" },
  PAID: { label: "โอนสำเร็จ", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "ไม่อนุมัติ", className: "bg-red-100 text-red-700" },
  FAILED: { label: "โอนไม่สำเร็จ", className: "bg-red-100 text-red-700" },
};

export const payoutStatus = (status: string) => payoutStatuses[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
export const money = (value: number | string) => `฿${Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const formatThaiDateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("th-TH", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Bangkok",
}).format(new Date(value)).replace(/\s+(\d{2}:\d{2})$/, " · $1") : "—";
export const maskAccount = (value: string) => value.length > 4 ? `••••${value.slice(-4)}` : value;

export function validatePayoutAmount(amount: string, withdrawable: number, min = PAYOUT_MINIMUM): string | null {
  if (!amount) return "กรุณาระบุจำนวนเงิน";
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || !Number.isFinite(Number(amount))) return "กรุณาระบุจำนวนเงินเป็นตัวเลขและทศนิยมไม่เกิน 2 ตำแหน่ง";
  if (Number(amount) < min) return `ขั้นต่ำต่อครั้ง ${money(min)}`;
  if (Number(amount) > withdrawable) return `เกินยอดถอนได้ ${money(withdrawable)} — กด 'ถอนทั้งหมด' เพื่อใส่ยอดสูงสุด`;
  return null;
}

export function payoutDetail(payout: Payout): string {
  switch (payout.status) {
    case "REQUESTED": return "รอแอดมินตรวจสอบ";
    case "APPROVED":
    case "PROCESSING": return `อนุมัติเมื่อ ${formatThaiDateTime(payout.approvedAt)}`;
    case "PAID": return `โอนเมื่อ ${formatThaiDateTime(payout.paidAt)}${payout.transferReference ? ` · อ้างอิง ${payout.transferReference}` : ""}`;
    case "REJECTED":
    case "FAILED": return `${payout.rejectionReason ?? "ไม่ระบุเหตุผล"} · ยอดกลับมาถอนได้แล้ว`;
    default: return payout.status;
  }
}

const walletEntryLabels: Record<string, string> = {
  SELLER_EARNING: "รายได้จากออเดอร์",
  REFUND_OUT: "คืนเงินผู้ซื้อ",
  PAYOUT_OUT: "ถอนเงิน",
  ADJUSTMENT: "ปรับยอดโดยแอดมิน",
};
export const walletEntryLabel = (type: string) => walletEntryLabels[type] ?? type;
