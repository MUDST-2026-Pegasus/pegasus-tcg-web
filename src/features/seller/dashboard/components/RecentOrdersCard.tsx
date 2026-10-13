import { ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ORDER_TONE_BADGE,
  SELLER_ORDER_STATUS_TONE,
} from "@/features/seller/shared/order-status";
import { cn } from "@/lib/utils";

import type { RecentOrders } from "../dashboard.types";

export function RecentOrdersCard({
  title,
  actionLabel,
  emptyLabel,
  items,
}: RecentOrders) {
  return (
    <Card className="w-full flex-1 gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3.5">
        <p className="text-base font-semibold text-zinc-950">{title}</p>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-md px-2.5 text-[#0d9488]"
          render={<Link to="/seller/orders" />}
          nativeButton={false}
        >
          {actionLabel}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="border-t border-gray-100 px-5 py-8 text-center text-xs text-gray-500">
          {emptyLabel}
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((order) => (
            <li key={order.id} className="border-t border-gray-100 first:border-t-0">
              <Link
                to={`/seller/orders/${order.id}`}
                className="flex items-center gap-3.5 px-5 py-3 outline-none hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gray-100">
                  <ImageIcon aria-hidden="true" className="size-3.5 text-gray-400" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p className="shrink-0 text-xs font-semibold text-zinc-950">
                      {order.number}
                    </p>
                    <p className="truncate text-xs text-gray-500">· {order.buyer}</p>
                  </div>
                  <p className="truncate text-xs text-gray-400">{order.item}</p>
                </div>

                <p className="shrink-0 text-xs font-semibold text-zinc-950">
                  {order.price}
                </p>

                <div className="flex w-24 shrink-0 justify-end">
                  <Badge
                    className={cn(
                      "h-5 rounded-full px-2 text-xs",
                      ORDER_TONE_BADGE[SELLER_ORDER_STATUS_TONE[order.status]],
                    )}
                  >
                    {order.statusLabel}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
