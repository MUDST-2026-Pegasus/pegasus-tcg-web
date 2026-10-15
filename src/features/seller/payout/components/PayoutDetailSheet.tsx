import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import type { Payout } from "@/features/finance/finance.types";
import { formatThaiDateTime, money, payoutStatus } from "../payout.format";

function steps(payout: Payout) {
  const base = [{ label: "ส่งคำขอ", date: payout.requestedAt, done: true }];
  if (payout.status === "REJECTED") return [...base, { label: "ไม่อนุมัติ", date: null, done: true }];
  return [...base,
    { label: "แอดมินอนุมัติ", date: payout.approvedAt, done: !!payout.approvedAt },
    { label: "กำลังโอน", date: null, done: ["PROCESSING", "PAID", "FAILED"].includes(payout.status) },
    { label: payout.status === "FAILED" ? "โอนไม่สำเร็จ" : "โอนสำเร็จ", date: payout.paidAt, done: ["PAID", "FAILED"].includes(payout.status) },
  ];
}

export function PayoutDetailSheet({ payout, onClose, onRetry }: { payout: Payout | null; onClose: () => void; onRetry: (amount: number) => void }) {
  const status = payout ? payoutStatus(payout.status) : null;
  return <Sheet open={!!payout} onOpenChange={(open) => { if (!open) onClose(); }}><SheetContent className="w-full overflow-y-auto p-0 sm:max-w-[420px]"><SheetHeader className="pr-14"><SheetTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">คำขอถอน #{payout?.id} {status && <span className={`rounded-full px-2 py-1 text-xs ${status.className}`}>● {status.label}</span>}</SheetTitle><SheetDescription>รายละเอียดและความคืบหน้าของคำขอถอนเงิน</SheetDescription></SheetHeader>{payout && <div className="space-y-6 px-6 pb-8"><div><p className="text-xs text-muted-foreground">จำนวนเงิน</p><p className="text-2xl font-bold">{money(payout.amount)}</p></div><ol className="space-y-0">{steps(payout).map((step, index) => <li key={index} className="flex gap-3"><div className="flex flex-col items-center"><span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${step.done ? step.label === "ไม่อนุมัติ" || step.label === "โอนไม่สำเร็จ" ? "bg-red-600 text-white" : "bg-teal-600 text-white" : "border border-slate-300 text-slate-400"}`}>{step.done ? step.label.includes("ไม่") ? <X className="size-3"/> : <Check className="size-3"/> : null}</span>{index < steps(payout).length - 1 && <span className={`min-h-9 w-0.5 ${step.done ? "bg-teal-600" : "bg-slate-200"}`}/>}</div><div className="pb-6"><p className="text-sm font-medium">{step.label}</p>{step.date && <p className="text-xs text-muted-foreground">{formatThaiDateTime(step.date)}</p>}</div></li>)}</ol>
    {["PAID", "REJECTED", "FAILED"].includes(payout.status) && <div className={`rounded-lg p-4 text-sm ${payout.status === "PAID" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}><p className="font-semibold">{payout.status === "PAID" ? "โอนเข้าบัญชีแล้ว" : payout.status === "REJECTED" ? "เหตุผลจากแอดมิน" : "เหตุผลที่โอนไม่สำเร็จ — ไม่มีการตัดเงิน"}</p><p className="mt-1 text-xs">{payout.status === "PAID" ? `ยอด ${money(payout.amount)} ถูกตัดจากกระเป๋าเมื่อแอดมินบันทึกการโอน` : `${payout.rejectionReason ?? "ไม่ระบุเหตุผล"} · ยอดกลับมาถอนได้แล้ว`}</p></div>}
    <dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">โอนเข้า</dt><dd className="text-right">ไม่ระบุในข้อมูลคำขอ</dd></div>{payout.status === "PAID" && payout.transferReference && <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">เลขอ้างอิงการโอน</dt><dd className="flex items-center gap-1">{payout.transferReference}<Button variant="ghost" size="icon-sm" aria-label="คัดลอกเลขอ้างอิง" onClick={() => { void navigator.clipboard.writeText(payout.transferReference!).then(() => toast.add({ type: "success", title: "คัดลอกเลขอ้างอิงแล้ว" })); }}><Copy className="size-4"/></Button></dd></div>}</dl>
    {["REJECTED", "FAILED"].includes(payout.status) && <div className="flex flex-wrap gap-2">{payout.status === "FAILED" && <a className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-slate-50" href="/seller/verification">ส่งยืนยันบัญชีใหม่</a>}<Button className="bg-teal-600 text-white" onClick={() => onRetry(Number(payout.amount))}>ขอถอนใหม่</Button></div>}</div>}</SheetContent></Sheet>;
}
