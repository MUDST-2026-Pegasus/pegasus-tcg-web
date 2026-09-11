import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { SalesSummary } from "../dashboard.types";

export function SalesCard({
  label,
  amount,
  delta,
  description,
  bars,
  rangeStart,
  rangeEnd,
}: SalesSummary) {
  return (
    <Card className="flex-1 gap-5 rounded-2xl border-0 bg-[#0d9488] p-6 text-white shadow-none ring-0">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-teal-100">{label}</p>
        <div className="flex items-center gap-2.5">
          <p className="text-4xl font-bold">{amount}</p>
          <Badge className="h-5 rounded-full bg-[#0f766e] px-2 text-xs text-white">
            {delta}
          </Badge>
        </div>
        <p className="text-xs text-teal-100">{description}</p>
      </div>

      <div className="flex h-16 items-end gap-1.5" aria-hidden="true">
        {bars.map((bar, index) => (
          <span
            key={index}
            style={{ height: bar.height }}
            className={cn(
              "w-6 rounded-sm",
              bar.highlighted ? "bg-white/95" : "bg-white/40",
            )}
          />
        ))}
      </div>

      <div className="flex items-start justify-between">
        <p className="text-[10px] text-teal-100">{rangeStart}</p>
        <p className="text-[10px] font-medium text-white">{rangeEnd}</p>
      </div>
    </Card>
  );
}
