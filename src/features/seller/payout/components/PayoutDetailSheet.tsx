import { translate, useLanguage } from "@/lib/language";
import { Check, Copy, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import type { Payout } from "@/features/finance/finance.types";
import { formatThaiDateTime, money, payoutStatus } from "../payout.format";

type Step = { label: string; date: string | null; done: boolean };

type Props = {
  payout: Payout | null;
  onClose: () => void;
  onRetry: (amount: number) => void;
  canRetry: boolean;
};

function steps(payout: Payout): Step[] {
  const base = [{ label: translate("ส่งคำขอ", "Submit request"), date: payout.requestedAt, done: true }];
  if (payout.status === "REJECTED") {
    return [...base, { label: translate("ไม่อนุมัติ", "Reject"), date: null, done: true }];
  }
  return [
    ...base,
    { label: translate("แอดมินอนุมัติ", "Administrator approval"), date: payout.approvedAt, done: !!payout.approvedAt },
    { label: translate("กำลังโอน", "Transferring"), date: null, done: ["PROCESSING", "PAID", "FAILED"].includes(payout.status) },
    { label: payout.status === "FAILED" ? translate("โอนไม่สำเร็จ", "Transfer failed") : translate("โอนสำเร็จ", "Transfer completed"), date: payout.paidAt, done: ["PAID", "FAILED"].includes(payout.status) },
  ];
}

export function PayoutDetailSheet({ payout, onClose, onRetry, canRetry }: Props) {
  useLanguage();
  const status = payout ? payoutStatus(payout.status) : null;
  const timeline = payout ? steps(payout) : [];
  const terminal = payout && ["PAID", "REJECTED", "FAILED"].includes(payout.status);
  const retryable = payout && ["REJECTED", "FAILED"].includes(payout.status);

  return (
    <Sheet open={!!payout} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-[420px]">
        <SheetHeader className="pr-14">
          <SheetTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            {translate("คำขอถอน #", "Withdrawal request #")}{payout?.id}
            {status && <span className={`rounded-full px-2 py-1 text-xs ${status.className}`}>● {status.label}</span>}
          </SheetTitle>
          <SheetDescription>{translate("รายละเอียดและความคืบหน้าของคำขอถอนเงิน", "Withdrawal request details and progress")}</SheetDescription>
        </SheetHeader>
        {payout && (
          <div className="space-y-6 px-6 pb-8">
            <div>
              <p className="text-xs text-muted-foreground">{translate("จำนวนเงิน", "Amount")}</p>
              <p className="text-2xl font-bold">{money(payout.amount)}</p>
            </div>

            <ol className="space-y-0">
              {timeline.map((step, index) => {
                const failed = step.label === translate("ไม่อนุมัติ", "Reject") || step.label === translate("โอนไม่สำเร็จ", "Transfer failed");
                return (
                  <li key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${step.done ? failed ? "bg-destructive text-white" : "bg-teal-600 text-white" : "border border-slate-300 text-slate-400"}`}>
                        {step.done && (failed ? <X className="size-3" /> : <Check className="size-3" />)}
                      </span>
                      {index < timeline.length - 1 && <span className={`min-h-9 w-0.5 ${step.done ? "bg-teal-600" : "bg-slate-200"}`} />}
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-medium">{step.label}</p>
                      {step.date && <p className="text-xs text-muted-foreground">{formatThaiDateTime(step.date)}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>

            {terminal && (
              <div className={`rounded-lg p-4 text-sm ${payout.status === "PAID" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                <p className="font-semibold">
                  {payout.status === "PAID" ? translate("โอนเข้าบัญชีแล้ว", "Transferred to your account") : payout.status === "REJECTED" ? translate("เหตุผลจากแอดมิน", "Administrator's reason") : translate("เหตุผลที่โอนไม่สำเร็จ — ไม่มีการตัดเงิน", "Transfer failure reason — no funds were deducted")}
                </p>
                <p className="mt-1 text-xs">
                  {payout.status === "PAID"
                    ? translate(`ยอด ${money(payout.amount)} ถูกตัดจากกระเป๋าเมื่อแอดมินบันทึกการโอน`, `${money(payout.amount)} was deducted from your wallet when the administrator recorded the transfer`)
                    : translate(`${payout.rejectionReason ?? "ไม่ระบุเหตุผล"} · ยอดกลับมาถอนได้แล้ว`, `${payout.rejectionReason ?? "No reason provided"} · Funds are available to withdraw again`)}
                </p>
              </div>
            )}

            {payout.status === "PAID" && payout.transferReference && (
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{translate("เลขอ้างอิงการโอน", "Transfer reference")}</dt>
                  <dd className="flex items-center gap-1">
                    {payout.transferReference}
                    <Button variant="ghost" size="icon-sm" aria-label={translate("คัดลอกเลขอ้างอิง", "Copy reference number")} onClick={() => { void navigator.clipboard.writeText(payout.transferReference!).then(() => toast.add({ type: "success", title: translate("คัดลอกเลขอ้างอิงแล้ว", "Reference number copied") })); }}>
                      <Copy className="size-4" />
                    </Button>
                  </dd>
                </div>
              </dl>
            )}

            {retryable && (payout.status === "FAILED" || canRetry) && (
              <div className="flex flex-wrap gap-2">
                {payout.status === "FAILED" && (
                  <Link className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-slate-50" to="/seller/verification">
                    {translate("ส่งยืนยันบัญชีใหม่", "Resubmit bank account verification")}</Link>
                )}
                {canRetry && <Button className="bg-teal-600 text-white" onClick={() => onRetry(Number(payout.amount))}>{translate("ขอถอนใหม่", "Request another withdrawal")}</Button>}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
