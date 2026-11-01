import { Store, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { formatBaht } from "../catalog.format";
import {
  formatItemCount,
  orderContextLabel,
  partyName,
  type OrderTone,
} from "../orders.format";
import type { AdminOrderSummary, OrderBoardColumnKey } from "../orders.types";
import { ORDER_TONE_BADGE } from "./orders.styles";

type OrderColumnCardProps = {
  order: AdminOrderSummary;
  column: OrderBoardColumnKey;
  tone: OrderTone;
  onSelect: (order: AdminOrderSummary) => void;
};

/**
 * การ์ดใบสั่งซื้อหนึ่งใบใน Kanban — กดแล้วเปิดรายละเอียด
 * ดีไซน์ 156.8 × 116 (padding 12) ในกริด 180.8px — คอลัมน์คุมความกว้างเอง
 */
export function OrderColumnCard({
  order,
  column,
  tone,
  onSelect,
}: OrderColumnCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      className="flex w-full flex-col gap-3 rounded-[10px] border border-muted bg-background p-3 text-left shadow-none transition-colors hover:border-[#d5dbdd] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-medium text-foreground">
          {order.sellerOrderNumber}
        </span>
        <span className="shrink-0 font-medium text-foreground">
          {formatBaht(order.grandTotal)}
        </span>
      </div>

      <div className="flex flex-col gap-[3px] text-[11px] text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <Store aria-hidden="true" className="size-4 shrink-0 text-[#9aa5ad]" />
          <span className="truncate">{partyName(order.seller)}</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <User aria-hidden="true" className="size-4 shrink-0 text-[#9aa5ad]" />
          <span className="truncate">{partyName(order.buyer)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Badge
          className={cn(
            "max-w-[70%] truncate rounded-[5px] px-2 text-[10px] font-medium",
            ORDER_TONE_BADGE[tone],
          )}
        >
          {orderContextLabel(column, order)}
        </Badge>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {formatItemCount(order.itemCount)}
        </span>
      </div>
    </button>
  );
}
