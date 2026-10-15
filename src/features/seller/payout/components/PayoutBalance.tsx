import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Wallet } from "@/features/finance/finance.types";
import { money, PAYOUT_MINIMUM } from "../payout.format";

export function PayoutBalance({ wallet, pendingCount, blockedReason, onWithdraw }: { wallet: Wallet; pendingCount: number; blockedReason: string | null; onWithdraw: () => void }) {
  return <section className="flex min-w-0 flex-col gap-5 rounded-xl bg-[#161b1d] p-6 text-white">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="space-y-1.5"><p className="text-xs font-medium text-[#9ca8ab]">ยอดถอนได้ตอนนี้</p><p className="text-4xl font-bold">{money(wallet.withdrawable)}</p><p className="text-xs text-[#9ca8ab]">ยอดในกระเป๋า − ยอดที่กันไว้สำหรับคำขอถอนที่ยังไม่โอน</p></div><Button className="bg-teal-600 text-white hover:bg-teal-700" disabled={!!blockedReason} onClick={onWithdraw}>ขอถอนเงิน</Button></div>
    <div className="grid gap-4 border-t border-[#22292b] pt-5 sm:grid-cols-3">{[
      ["ยอดในกระเป๋า", wallet.balanceAvailable, "รวมยอดที่กันไว้แล้ว"],
      ["กันไว้สำหรับคำขอถอน", wallet.reservedForPayout, `${pendingCount} คำขอที่ยังไม่โอน`],
      ["รอผู้ซื้อยืนยันรับสินค้า", wallet.balancePending, "เข้ายอดถอนได้เมื่อออเดอร์สำเร็จ"],
    ].map(([label, value, note]) => <div key={String(label)} className="space-y-1"><p className="text-xs text-[#9ca8ab]">{label}</p><p className="font-semibold">{money(Number(value))}</p><p className="text-xs text-[#9ca8ab]">{note}</p></div>)}</div>
    <div className={`flex items-start gap-2.5 rounded-lg bg-[#22292b] px-4 py-3 text-xs ${blockedReason ? "text-amber-200" : "text-white"}`}><Info className="size-4 shrink-0"/><p>{blockedReason ?? `ขั้นต่ำต่อครั้ง ${money(PAYOUT_MINIMUM)} · ยอดที่ขอถอนจะถูกกันไว้ทันที และตัดจากกระเป๋าเมื่อแอดมินโอนสำเร็จ · ถ้าไม่อนุมัติหรือโอนไม่สำเร็จ ยอดจะกลับมาถอนได้`}</p></div>
  </section>;
}
