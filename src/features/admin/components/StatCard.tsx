import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  SPARK_HEIGHT,
  type StatAccent,
  type StatCardModel,
  type Trend,
} from "../metrics.format";

const ACCENT_BAR: Record<StatAccent, string> = {
  primary: "bg-primary",
  teal: "bg-[#0d9488]",
  green: "bg-[#12805c]",
};

/** ขึ้นเขียว ลงแดง ไม่เปลี่ยนเป็นเทา */
const TREND_BADGE: Record<Trend, string> = {
  up: "bg-[#e3f4ec] text-[#12805c]",
  new: "bg-[#e3f4ec] text-[#12805c]",
  down: "bg-[#fbe9e8] text-[#d0342c]",
  flat: "bg-muted text-muted-foreground",
};

export function StatCard({
  label,
  value,
  delta,
  footnote,
  bars,
  accent,
}: StatCardModel) {
  return (
    <Card className="flex-1 gap-2.5 rounded-xl border border-border p-[18px] shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {delta ? (
          <Badge
            className={cn("h-5 rounded-full px-2 text-[11px]", TREND_BADGE[delta.trend])}
          >
            {delta.label}
          </Badge>
        ) : null}
      </div>

      <p className="text-[26px] leading-none font-bold tracking-[-0.6px] text-foreground">
        {value}
      </p>

      {/* sparkline รายสัปดาห์ — แท่งสุดท้ายคือสัปดาห์ปัจจุบัน จึงเน้นสี
          ตัวเลขที่ไม่มีประวัติเว้นที่ว่างไว้เท่าเดิม การ์ดทั้งแถวจะได้สูงเท่ากัน */}
      <div
        className="flex items-end gap-[3px]"
        style={{ height: SPARK_HEIGHT }}
        aria-hidden="true"
      >
        {bars?.map((height, index) => (
          <span
            key={index}
            style={{ height }}
            className={cn(
              "w-2 rounded-[2px]",
              index === bars.length - 1 ? ACCENT_BAR[accent] : "bg-border",
            )}
          />
        ))}
      </div>

      <p className="text-[11px] text-[#9aa5ad]">{footnote}</p>
    </Card>
  );
}
