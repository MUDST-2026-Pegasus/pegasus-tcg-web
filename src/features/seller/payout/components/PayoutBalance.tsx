import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Wallet } from "@/features/finance/finance.types";
import { money, PAYOUT_MINIMUM } from "../payout.format";
import { useTranslate } from "@/lib/i18n";

export function PayoutBalance({ wallet, pendingCount, blockedReason, onWithdraw }: { wallet: Wallet | null; pendingCount: number | null; blockedReason: string | null; onWithdraw: () => void }) {
  const { t } = useTranslate("seller");
  return <section className="flex min-w-0 flex-col gap-5 rounded-xl bg-[#161b1d] p-6 text-white">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="space-y-1.5"><p className="text-xs font-medium text-[#9ca8ab]">{t("payout.balance.withdrawable", "ยอดถอนได้ตอนนี้")}</p><p className="text-4xl font-bold">{wallet ? money(wallet.withdrawable) : "—"}</p><p className="text-xs text-[#9ca8ab]">{t("payout.balance.withdrawableHint", "ยอดในกระเป๋า − ยอดที่กันไว้สำหรับคำขอถอนที่ยังไม่โอน")}</p></div><Button className="bg-teal-600 text-white hover:bg-teal-700" disabled={!!blockedReason} onClick={onWithdraw}>{t("payout.balance.withdraw", "ขอถอนเงิน")}</Button></div>
    <div className="grid gap-4 border-t border-[#22292b] pt-5 sm:grid-cols-3">{[
      [t("payout.balance.wallet", "ยอดในกระเป๋า"), wallet?.balanceAvailable, t("payout.balance.walletHint", "รวมยอดที่กันไว้แล้ว")],
      [t("payout.balance.reserved", "กันไว้สำหรับคำขอถอน"), wallet?.reservedForPayout, t("payout.balance.reservedHint", "{count} คำขอที่ยังไม่โอน", { count: pendingCount ?? "—" })],
      [t("payout.balance.pending", "รอผู้ซื้อยืนยันรับสินค้า"), wallet?.balancePending, t("payout.balance.pendingHint", "เข้ายอดถอนได้เมื่อออเดอร์สำเร็จ")],
    ].map(([label, value, note]) => <div key={String(label)} className="space-y-1"><p className="text-xs text-[#9ca8ab]">{label}</p><p className="font-semibold">{value == null ? "—" : money(Number(value))}</p><p className="text-xs text-[#9ca8ab]">{note}</p></div>)}</div>
    <div className={`flex items-start gap-2.5 rounded-lg bg-[#22292b] px-4 py-3 text-xs ${blockedReason ? "text-amber-200" : "text-white"}`}><Info className="size-4 shrink-0"/><p>{blockedReason ?? t("payout.balance.note", "ขั้นต่ำต่อครั้ง {min} · ยอดที่ขอถอนจะถูกกันไว้ทันที และตัดจากกระเป๋าเมื่อแอดมินโอนสำเร็จ · ถ้าไม่อนุมัติหรือโอนไม่สำเร็จ ยอดจะกลับมาถอนได้", { min: money(PAYOUT_MINIMUM) })}</p></div>
  </section>;
}
