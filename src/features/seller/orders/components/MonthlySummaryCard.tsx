import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { MonthlySummary } from "../orders.format";

type MonthlySummaryCardProps = MonthlySummary;

export function MonthlySummaryCard({ title, rows, netLabel, netValue }: MonthlySummaryCardProps) {
  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-xs font-semibold text-foreground">{title}</p>

      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">{row.label}</p>
          <p
            className={cn(
              "text-xs font-medium",
              row.tone === "muted" ? "text-gray-500" : "text-foreground",
            )}
          >
            {row.value}
          </p>
        </div>
      ))}

      <Separator className="bg-secondary" />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">{netLabel}</p>
        <p className="text-lg font-bold text-[#12805c]">{netValue}</p>
      </div>
    </Card>
  );
}
