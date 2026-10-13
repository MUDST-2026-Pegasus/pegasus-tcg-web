import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { PAYMENT_STATE_LABEL, type PaymentState } from "../../orders.format";

const STATUS_BADGE: Record<PaymentState, string> = {
  paid: "bg-[#e3f4ec] text-[#12805c]",
  pending: "bg-[#fdf0dd] text-[#b45309]",
  refunded: "bg-[#eef1f2] text-[#6b7280]",
};

type PaymentCardProps = {
  state: PaymentState;
  rows: { id: string; label: string; value: string }[];
};

/** สลิปอยู่กับแอดมินที่เป็นคนตรวจ ร้านเห็นแค่ผลการชำระ */
export function PaymentCard({ state, rows }: PaymentCardProps) {
  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-950">การชำระเงิน</p>
        <Badge className={cn("h-5 rounded-full px-2 text-xs", STATUS_BADGE[state])}>
          {PAYMENT_STATE_LABEL[state]}
        </Badge>
      </div>

      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">{row.label}</p>
          <p className="text-right text-xs font-medium text-zinc-950">{row.value}</p>
        </div>
      ))}
    </Card>
  );
}
