import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { OrdersData } from "../orders.types";

type MonthlySummaryCardProps = OrdersData["summary"];

export function MonthlySummaryCard({
  title,
  rows,
  netLabel,
  netValue,
}: MonthlySummaryCardProps) {
  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-xs font-semibold text-zinc-950">{title}</p>

      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">{row.label}</p>
          <p
            className={cn(
              "text-xs font-medium",
              row.tone === "muted" ? "text-gray-500" : "text-zinc-950",
            )}
          >
            {row.value}
          </p>
        </div>
      ))}

      <Separator className="bg-gray-100" />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-950">{netLabel}</p>
        <p className="text-lg font-bold text-[#12805c]">{netValue}</p>
      </div>
    </Card>
  );
}
