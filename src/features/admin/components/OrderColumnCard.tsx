import { Store, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  OrderCard,
  OrderStatusTone,
} from "@/features/admin/admin.types";
import { cn } from "@/lib/utils";

/**
 * โทนสีของ badge บริบท (มุมล่างซ้าย) ในการ์ด — โทนเดียวกับจุดหัวคอลัมน์
 * รอชำระเงินใช้ส้ม, รอส่ง+จัดส่งใช้น้ำเงิน/ม่วง, สำเร็จเขียว, ข้อพิพาทแดง
 */
const CONTEXT_BADGE: Record<OrderStatusTone, string> = {
  pending: "bg-[#fdf0dd] text-[#b45309]",
  packing: "bg-[#e8f1fc] text-[#0058bc]",
  shipping: "bg-[#ecebff] text-[#4f46e5]",
  success: "bg-[#e3f4ec] text-[#12805c]",
  dispute: "bg-[#fbe9e8] text-[#d0342c]",
};

type OrderColumnCardProps = {
  card: OrderCard;
  tone: OrderStatusTone;
};

/**
 * การ์ดใบสั่งซื้อหนึ่งใบใน Kanban
 * ดีไซน์ 156.8 × 116 (padding 12) ในกริด 180.8px — คอลัมน์คุมความกว้างเอง
 */
export function OrderColumnCard({ card, tone }: OrderColumnCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-[10px] border border-[#eef1f2] bg-background p-3 shadow-none">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-foreground">{card.code}</span>
        <span className="font-medium text-foreground">{card.amount}</span>
      </div>

      <div className="flex flex-col gap-[3px] text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Store aria-hidden="true" className="size-4 shrink-0 text-[#9aa5ad]" />
          <span>{card.seller}</span>
        </div>
        <div className="flex items-center gap-2">
          <User aria-hidden="true" className="size-4 shrink-0 text-[#9aa5ad]" />
          <span>{card.buyer}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Badge
          className={cn(
            "rounded-[5px] px-2 text-[10px] font-medium",
            CONTEXT_BADGE[tone],
          )}
        >
          {card.contextLabel}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {card.itemsLabel}
        </span>
      </div>
    </article>
  );
}
