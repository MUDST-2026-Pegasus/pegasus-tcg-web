import { Button } from "@/components/ui/button";
import type {
  OrderColumn,
  OrderStatusTone,
} from "@/features/admin/admin.types";
import { OrderColumnCard } from "@/features/admin/components/OrderColumnCard";
import { cn } from "@/lib/utils";

/**
 * สีจุดหัวคอลัมน์ Kanban — เดียวกันทั้ง 5 สถานะ
 */
const DOT_COLOR: Record<OrderStatusTone, string> = {
  pending: "bg-[#f59e0b]",
  packing: "bg-[#0058bc]",
  shipping: "bg-[#6366f1]",
  success: "bg-[#12805c]",
  dispute: "bg-[#d0342c]",
};

type OrderKanbanColumnProps = {
  column: OrderColumn;
  moreLabel: string;
};

/**
 * หนึ่งคอลัมน์ Kanban = header (จุด+ชื่อ+จำนวน) + การ์ดหลายใบ + ปุ่ม "ดูเพิ่มเติม"
 * ดีไซน์ตายตัวที่ 180.8px แต่ทำเป็นความกว้างเต็ม 0 min เพื่อให้กริดจัดหลายคอลัมน์ได้
 */
export function OrderKanbanColumn({
  column,
  moreLabel,
}: OrderKanbanColumnProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn("size-[7px] shrink-0 rounded-full", DOT_COLOR[column.tone])}
          />
          <span className="text-xs font-medium text-foreground">
            {column.title}
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {column.count}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {column.cards.map((card) => (
          <OrderColumnCard key={card.id} card={card} tone={column.tone} />
        ))}
      </div>

      {column.showMore ? (
        <Button
          variant="outline"
          className="h-[31px] rounded-[10px] border-dashed border-[#e3e7e8] bg-transparent text-[11px] font-medium text-muted-foreground shadow-none hover:bg-[#fafbfb]"
        >
          {moreLabel}
        </Button>
      ) : null}
    </div>
  );
}
