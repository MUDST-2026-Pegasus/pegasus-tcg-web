import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { SalesSummary } from "../dashboard.types";

/** เดือนที่ขายได้ 0 ยังเห็นเป็นเส้นบาง ๆ ไม่หายไปจากกราฟ */
const MIN_BAR_PERCENT = 6;

/** ความสูงแต่ละแท่งเทียบกับเดือนที่ขายได้มากสุด (= เต็มกรอบ) */
function barPercents(amounts: number[]): number[] {
  const peak = Math.max(0, ...amounts);
  return amounts.map((amount) =>
    peak === 0
      ? MIN_BAR_PERCENT
      : Math.max(MIN_BAR_PERCENT, Math.round((amount / peak) * 100)),
  );
}

export function SalesCard({
  label,
  amount,
  delta,
  description,
  bars,
  rangeStart,
  rangeEnd,
}: SalesSummary) {
  const heights = barPercents(bars.map((bar) => bar.amount));

  return (
    <Card className="w-full flex-1 gap-5 rounded-2xl border-0 bg-[#0d9488] p-6 text-white shadow-none ring-0">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-teal-100">{label}</p>
        <div className="flex items-center gap-2.5">
          <p className="text-4xl font-bold">{amount}</p>
          {delta ? (
            <Badge className="h-5 rounded-full bg-[#0f766e] px-2 text-xs text-white">
              {delta.label}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-teal-100">{description}</p>
      </div>

      <ol className="flex h-16 items-end gap-1.5" aria-label="ยอดขายรายเดือน">
        {bars.map((bar, index) => (
          <li
            key={bar.month}
            title={bar.label}
            style={{ height: `${heights[index]}%` }}
            className={cn(
              "w-6 rounded-sm",
              bar.highlighted ? "bg-white/95" : "bg-white/40",
            )}
          >
            <span className="sr-only">{bar.label}</span>
          </li>
        ))}
      </ol>

      <div className="flex items-start justify-between">
        <p className="text-[10px] text-teal-100">{rangeStart}</p>
        <p className="text-[10px] font-medium text-white">{rangeEnd}</p>
      </div>
    </Card>
  );
}
