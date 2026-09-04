import { Card } from "@/components/ui/card";
import type { SellerStatCardData, StatAccent } from "@/features/seller/seller.types";
import { cn } from "@/lib/utils";

const ICON_BG: Record<StatAccent, string> = {
  primary: "bg-[#e8f1fc]",
  violet: "bg-[#ede9fe]",
  amber: "bg-[#fdf0dd]",
  green: "bg-[#e3f4ec]",
};

const ICON_COLOR: Record<StatAccent, string> = {
  primary: "text-[#0058bc]",
  violet: "text-[#6d28d9]",
  amber: "text-[#b45309]",
  green: "text-[#12805c]",
};

export function SellerStatCard({
  icon: Icon,
  accent,
  label,
  value,
  footnote,
}: SellerStatCardData) {
  return (
    <Card className="flex-1 gap-3 rounded-xl border border-border p-4 shadow-none ring-0">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            ICON_BG[accent],
          )}
        >
          <Icon className={cn("size-3.5", ICON_COLOR[accent])} />
        </div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>

      <p className="text-xl font-bold text-zinc-950">{value}</p>
      <p className="text-xs text-gray-400">{footnote}</p>
    </Card>
  );
}
