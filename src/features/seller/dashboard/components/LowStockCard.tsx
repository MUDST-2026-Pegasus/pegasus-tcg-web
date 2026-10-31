import { ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { LowStock, StockSeverity } from "../dashboard.types";

const PILL_COLOR: Record<StockSeverity, string> = {
  critical: "bg-[#fdecea] text-[#d0342c]",
  warning: "bg-[#fdf0dd] text-[#b45309]",
};

/** แต่ละแถวพาไปหน้าเติมสต็อกของประกาศนั้นตรง ๆ */
export function LowStockCard({ title, subtitle, count, items, actionLabel, actionTo, emptyLabel }: LowStock) {
  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0 lg:w-80">
      <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-3.5">
        <div className="min-w-0">
          <p className="text-base font-semibold text-zinc-950">{title}</p>
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>
        {count > 0 && (
          <Badge className="h-auto shrink-0 rounded-full bg-[#fdf0dd] px-2 py-[3px] text-xs text-[#b45309]">
            {count} รายการ
          </Badge>
        )}
      </div>

      {items.length === 0 ? (
        <p className="border-t border-gray-100 px-5 py-8 text-center text-xs text-gray-500">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.listingId} className="border-t border-gray-100">
              <Link
                to={`/seller/products/${item.listingId}/restock`}
                className="flex min-w-0 items-center gap-3 px-5 py-3 outline-none hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <div className="flex size-[34px] shrink-0 items-center justify-center rounded-md bg-gray-100">
                  <ImageIcon aria-hidden="true" className="size-3.5 text-gray-400" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <p className="truncate text-xs font-semibold text-zinc-950" title={item.name}>{item.name}</p>
                  {item.metaLabel && <p className="truncate text-xs text-gray-400">{item.metaLabel}</p>}
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-1 text-[11px] font-medium", PILL_COLOR[item.severity])}>
                  {item.remainingLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-gray-100 px-5 py-2">
        <Button variant="ghost" size="sm" className="w-full rounded-md text-[#0d9488]" render={<Link to={actionTo} />} nativeButton={false}>
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}
