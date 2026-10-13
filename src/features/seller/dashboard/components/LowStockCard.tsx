import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { LowStock, StockSeverity } from "../dashboard.types";

const BAR_COLOR: Record<StockSeverity, string> = {
  critical: "bg-[#d0342c]",
  warning: "bg-[#b45309]",
};

const TEXT_COLOR: Record<StockSeverity, string> = {
  critical: "text-[#d0342c]",
  warning: "text-[#b45309]",
};

/** แต่ละแถวพาไปหน้าเติมสต็อกของประกาศนั้นตรง ๆ */
export function LowStockCard({
  title,
  count,
  items,
  actionLabel,
  emptyLabel,
}: LowStock) {
  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0 lg:w-80">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-semibold text-zinc-950">{title}</p>
        {count > 0 ? (
          <Badge className="h-auto rounded-full bg-[#fdf0dd] px-2 py-[3px] text-xs text-[#b45309]">
            {count}
          </Badge>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-gray-500">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {items.map((item) => (
            <li key={item.listingId}>
              <Link
                to={`/seller/products/${item.listingId}/restock`}
                className="flex flex-col gap-1.5 rounded-sm outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-gray-700">{item.name}</p>
                  <p
                    className={cn(
                      "shrink-0 text-xs font-semibold",
                      TEXT_COLOR[item.severity],
                    )}
                  >
                    {item.remainingLabel}
                  </p>
                </div>
                <div className="h-[5px] w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    style={{ width: `${item.percent}%` }}
                    className={cn("h-full rounded-full", BAR_COLOR[item.severity])}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="outline"
        className="w-full rounded-md px-2.5"
        render={<Link to="/seller/products" />}
        nativeButton={false}
      >
        {actionLabel}
      </Button>
    </Card>
  );
}
