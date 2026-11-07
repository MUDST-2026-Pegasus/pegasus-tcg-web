import { useLanguage, translate } from "@/lib/language";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Wallet } from "@/features/finance/finance.types";
import { money, PAYOUT_MINIMUM } from "../payout.format";

export function PayoutBalance({ wallet, pendingCount, blockedReason, onWithdraw }: { wallet: Wallet | null; pendingCount: number | null; blockedReason: string | null; onWithdraw: () => void }) {
  useLanguage();
  return <section className="flex min-w-0 flex-col gap-5 rounded-xl bg-[#161b1d] p-6 text-white">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="space-y-1.5"><p className="text-xs font-medium text-[#9ca8ab]">{translate("ยอดถอนได้ตอนนี้", "Available to withdraw")}</p><p className="text-4xl font-bold">{wallet ? money(wallet.withdrawable) : "—"}</p><p className="text-xs text-[#9ca8ab]">{translate("ยอดในกระเป๋า − ยอดที่กันไว้สำหรับคำขอถอนที่ยังไม่โอน", "Wallet balance minus funds reserved for pending withdrawals")}</p></div><Button className="bg-teal-600 text-white hover:bg-teal-700" disabled={!!blockedReason} onClick={onWithdraw}>{translate("ขอถอนเงิน", "Request withdrawal")}</Button></div>
    <div className="grid gap-4 border-t border-[#22292b] pt-5 sm:grid-cols-3">{[
      [translate("ยอดในกระเป๋า", "Wallet balance"), wallet?.balanceAvailable, translate("รวมยอดที่กันไว้แล้ว", "Includes reserved funds")],
      [translate("กันไว้สำหรับคำขอถอน", "Reserved for withdrawals"), wallet?.reservedForPayout, translate(`${pendingCount ?? "—"} คำขอที่ยังไม่โอน`, `${pendingCount ?? "—"} pending withdrawals`)],
      [translate("รอผู้ซื้อยืนยันรับสินค้า", "Awaiting buyer delivery confirmation"), wallet?.balancePending, translate("เข้ายอดถอนได้เมื่อออเดอร์สำเร็จ", "Available to withdraw after the order is completed")],
    ].map(([label, value, note]) => <div key={String(label)} className="space-y-1"><p className="text-xs text-[#9ca8ab]">{label}</p><p className="font-semibold">{value == null ? "—" : money(Number(value))}</p><p className="text-xs text-[#9ca8ab]">{note}</p></div>)}</div>
    <div className={`flex items-start gap-2.5 rounded-lg bg-[#22292b] px-4 py-3 text-xs ${blockedReason ? "text-amber-200" : "text-white"}`}><Info className="size-4 shrink-0"/><p>{blockedReason ?? translate(`ขั้นต่ำต่อครั้ง ${money(PAYOUT_MINIMUM)} · ยอดที่ขอถอนจะถูกกันไว้ทันที และตัดจากกระเป๋าเมื่อแอดมินโอนสำเร็จ · ถ้าไม่อนุมัติหรือโอนไม่สำเร็จ ยอดจะกลับมาถอนได้`, `Minimum withdrawal ${money(PAYOUT_MINIMUM)} · Requested funds are reserved immediately and deducted once transferred. Rejected or failed transfers become available to withdraw again`)}</p></div>
  </section>;
}
