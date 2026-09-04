import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  SellerLowStock,
  StockSeverity,
} from "@/features/seller/seller.types";
import { cn } from "@/lib/utils";

const SEVERITY_COLOR: Record<StockSeverity, string> = {
  critical: "bg-[#d0342c] text-[#d0342c]",
  warning: "bg-[#b45309] text-[#b45309]",
};

type SellerLowStockCardProps = SellerLowStock;

export function SellerLowStockCard({
  title,
  count,
  items,
  actionLabel,
}: SellerLowStockCardProps) {
  return (
    <Card className="w-80 gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-semibold text-zinc-950">{title}</p>
        <Badge className="h-auto rounded-full bg-[#fdf0dd] px-2 py-[3px] text-xs text-[#b45309]">
          {count}
        </Badge>
      </div>

      {items.map((item) => {
        const [barColor, textColor] = SEVERITY_COLOR[item.severity].split(" ");

        return (
          <div key={item.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-700">{item.name}</p>
              <p className={cn("text-xs font-semibold", textColor)}>
                {item.remainingLabel}
              </p>
            </div>
            <div className="h-[5px] w-full overflow-hidden rounded-full bg-gray-100">
              <div
                style={{ width: `${item.percent}%` }}
                className={cn("h-full rounded-full", barColor)}
              />
            </div>
          </div>
        );
      })}

      <Button variant="outline" className="w-full rounded-md px-2.5">
        {actionLabel}
      </Button>
    </Card>
  );
}
