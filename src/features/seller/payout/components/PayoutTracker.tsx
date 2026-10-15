import { Card } from "@/components/ui/card";
import type { Payout } from "@/features/finance/finance.types";
import { formatThaiDateTime, money, payoutDetail } from "../payout.format";
import { PayoutStatusBadge } from "./PayoutStatusBadge";

const labels = ["ส่งคำขอ", "แอดมินอนุมัติ", "กำลังโอน", "โอนสำเร็จ"];

export function PayoutTracker({ payouts, onSelect }: { payouts: Payout[]; onSelect: (payout: Payout) => void }) {
  if (!payouts.length) return null;
  const total = payouts.reduce((sum, payout) => sum + Number(payout.amount), 0);

  return (
    <Card className="gap-0 rounded-xl border bg-white py-0">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">คำขอที่ยังไม่โอน</h2>
        <p className="text-xs text-muted-foreground">ยอดรวม {money(total)} ถูกกันไว้ ยังไม่ถูกตัดจากกระเป๋า</p>
      </div>
      <div className="space-y-3 p-5">
        {payouts.map((payout) => {
          const step = payout.status === "REQUESTED" ? 1 : payout.status === "APPROVED" ? 2 : 3;
          return (
            <button key={payout.id} type="button" onClick={() => onSelect(payout)} className="grid w-full items-center gap-4 rounded-lg border p-4 text-left hover:bg-slate-50 md:grid-cols-[190px_minmax(0,1fr)_80px]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{payout.id}</span>
                  <PayoutStatusBadge status={payout.status} />
                </div>
                <strong className="block">{money(payout.amount)}</strong>
                <p className="text-xs text-muted-foreground">{payoutDetail(payout)}</p>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[11px]">
                {labels.map((label, index) => (
                  <div key={label} className="relative">
                    {index < 3 && <span className={`absolute left-[calc(50%+8px)] right-[calc(-50%+8px)] top-[5px] h-px ${index < step - 1 ? "bg-teal-600" : "bg-slate-200"}`} />}
                    <div className={`relative z-10 mx-auto mb-1 flex size-3 items-center justify-center rounded-full ${index < step - 1 ? "bg-teal-600" : index === step - 1 ? "border-2 border-teal-600 bg-white" : "border border-slate-200 bg-slate-100"}`}>
                      {index === step - 1 && <span className="size-1 rounded-full bg-teal-600" />}
                    </div>
                    <span className={index < step ? "font-medium text-teal-700" : "text-muted-foreground"}>{label}</span>
                    {index === 0 && <p className="text-muted-foreground">{formatThaiDateTime(payout.requestedAt)}</p>}
                    {index === 1 && payout.approvedAt && <p className="text-muted-foreground">{formatThaiDateTime(payout.approvedAt)}</p>}
                  </div>
                ))}
              </div>
              <span className="text-right text-xs text-teal-700">รายละเอียด ›</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
