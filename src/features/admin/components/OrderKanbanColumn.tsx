import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatCount } from "../catalog.format";
import { ORDER_COLUMN_META } from "../orders.format";
import type { AdminOrderSummary, OrderBoardColumn } from "../orders.types";
import { OrderColumnCard } from "./OrderColumnCard";
import { ORDER_TONE_DOT } from "./orders.styles";

type OrderKanbanColumnProps = {
  column: OrderBoardColumn;
  onSelect: (order: AdminOrderSummary) => void;
  onShowMore: (column: OrderBoardColumn) => void;
};

/**
 * หนึ่งคอลัมน์ Kanban = header (จุด+ชื่อ+จำนวน) + การ์ดหลายใบ + ปุ่ม "ดูเพิ่มเติม"
 * ปุ่มขึ้นเฉพาะตอนที่จำนวนทั้งหมดมากกว่าการ์ดที่โชว์อยู่
 */
export function OrderKanbanColumn({
  column,
  onSelect,
  onShowMore,
}: OrderKanbanColumnProps) {
  const meta = ORDER_COLUMN_META[column.key];
  const hasMore = column.count > column.items.length;

  return (
    <section
      aria-label={meta.title}
      className="flex min-w-0 flex-col gap-2.5"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn("size-[7px] shrink-0 rounded-full", ORDER_TONE_DOT[meta.tone])}
          />
          <h2 className="text-xs font-medium text-foreground">{meta.title}</h2>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {formatCount(column.count)}
        </span>
      </div>

      {column.items.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
          ยังไม่มีคำสั่งซื้อในสถานะนี้
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {column.items.map((order) => (
            <OrderColumnCard
              key={order.sellerOrderId}
              order={order}
              column={column.key}
              tone={meta.tone}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <Button
          variant="outline"
          onClick={() => onShowMore(column)}
          className="h-[31px] rounded-[10px] border-dashed border-border bg-transparent text-[11px] font-medium text-muted-foreground shadow-none hover:bg-[#fafbfb]"
        >
          ดูเพิ่มเติม
        </Button>
      ) : null}
    </section>
  );
}
