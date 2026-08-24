import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { StatAccent, StatCardData } from "@/features/admin/admin.types";
import { cn } from "@/lib/utils";

const ACCENT_BAR: Record<StatAccent, string> = {
  primary: "bg-primary",
  teal: "bg-[#0d9488]",
  green: "bg-[#12805c]",
};

export function StatCard({
  label,
  value,
  delta,
  footnote,
  bars,
  accent,
}: StatCardData) {
  return (
    <Card className="flex-1 gap-2.5 rounded-xl border border-border p-[18px] shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Badge className="h-5 rounded-full bg-[#e3f4ec] px-2 text-[11px] text-[#12805c]">
          {delta}
        </Badge>
      </div>

      <p className="text-[26px] leading-none font-bold tracking-[-0.6px] text-foreground">
        {value}
      </p>

      {/* sparkline — แท่งสุดท้ายคือเดือนปัจจุบัน จึงเน้นสี */}
      <div className="flex h-[26px] items-end gap-[3px]" aria-hidden="true">
        {bars.map((height, index) => (
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
