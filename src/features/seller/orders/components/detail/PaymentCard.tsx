import { FileIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { OrderDetail } from "../../order-detail.types";
import type { PaymentStatus } from "../../orders.types";

const STATUS_BADGE: Record<PaymentStatus, string> = {
  paid: "bg-[#e3f4ec] text-[#12805c]",
  pending: "bg-[#fdf0dd] text-[#b45309]",
  refunded: "bg-[#eef1f2] text-[#6b7280]",
};

type PaymentCardProps = OrderDetail["payment"];

export function PaymentCard({
  title,
  status,
  statusLabel,
  slip,
  rows,
}: PaymentCardProps) {
  const slipContent = (
    <>
      <FileIcon aria-hidden="true" className="size-5 text-slate-500" />
      <span className="text-[10px] text-gray-400">{slip.label}</span>
    </>
  );
  const slipClass =
    "flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg bg-gray-100";

  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-950">{title}</p>
        <Badge
          className={cn("h-5 rounded-full px-2 text-xs", STATUS_BADGE[status])}
        >
          {statusLabel}
        </Badge>
      </div>

      {/* ยังไม่มีตัวดูสลิป — ปุ่มนี้รอต่อกับไฟล์สลิปจริงจาก API */}
      {slip.viewable ? (
        <button
          type="button"
          className={cn(
            slipClass,
            "cursor-pointer transition-colors outline-none hover:bg-gray-200/70 focus-visible:ring-3 focus-visible:ring-ring/30",
          )}
        >
          {slipContent}
        </button>
      ) : (
        <div className={slipClass}>{slipContent}</div>
      )}

      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">{row.label}</p>
          <p className="text-right text-xs font-medium text-zinc-950">
            {row.value}
          </p>
        </div>
      ))}
    </Card>
  );
}
