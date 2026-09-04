import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  OrderStatus,
  SellerRecentOrders,
} from "@/features/seller/seller.types";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<OrderStatus, string> = {
  awaiting_pack: "bg-[#fbe9e8] text-[#d0342c]",
  shipped: "bg-[#ede9fe] text-[#6d28d9]",
  awaiting_payment: "bg-[#fdf0dd] text-[#b45309]",
  completed: "bg-[#e3f4ec] text-[#12805c]",
};

type SellerRecentOrdersCardProps = SellerRecentOrders;

export function SellerRecentOrdersCard({
  title,
  actionLabel,
  items,
}: SellerRecentOrdersCardProps) {
  return (
    <Card className="flex-1 gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3.5">
        <p className="text-base font-semibold text-zinc-950">{title}</p>
        <Button variant="ghost" size="sm" className="rounded-md px-2.5 text-[#0d9488]">
          {actionLabel}
        </Button>
      </div>

      <ul className="flex flex-col">
        {items.map((order) => (
          <li
            key={order.id}
            className="flex items-center gap-3.5 border-t border-gray-100 px-5 py-3 first:border-t-0"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gray-100">
              <ImageIcon className="size-3.5 text-gray-400" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-zinc-950">
                  {order.id}
                </p>
                <p className="text-xs text-gray-500">· {order.buyer}</p>
              </div>
              <p className="text-xs text-gray-400">{order.item}</p>
            </div>

            <p className="shrink-0 text-xs font-semibold text-zinc-950">
              {order.price}
            </p>

            <div className="flex w-24 shrink-0 justify-end">
              <Badge
                className={cn(
                  "h-5 rounded-full px-2 text-xs",
                  STATUS_BADGE[order.status],
                )}
              >
                {order.statusLabel}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
