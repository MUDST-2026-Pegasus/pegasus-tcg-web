import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBaht } from "@/features/seller/shared/seller.format";

import { itemMeta } from "../../orders.format";
import type { OrderItem } from "../../orders.types";

type PackingListCardProps = {
  title: string;
  countLabel: string;
  items: OrderItem[];
  /** true = โชว์ช่องติ๊กไว้เช็กว่าหยิบชิ้นไหนใส่กล่องแล้ว (จำไว้ฝั่งหน้าจอเท่านั้น) */
  packable: boolean;
  packedIds: number[];
  onTogglePacked: (id: number) => void;
};

/** รายการสินค้าในออเดอร์ — ตอนรอแพ็คมีช่องติ๊กไว้เช็กของที่หยิบใส่กล่องแล้ว */
export function PackingListCard({
  title,
  countLabel,
  items,
  packable,
  packedIds,
  onTogglePacked,
}: PackingListCardProps) {
  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3.5">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <Badge className="h-5 rounded-full bg-secondary px-2 text-xs text-gray-500">
          {countLabel}
        </Badge>
      </div>

      <ul className="flex flex-col">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3.5 border-t border-muted px-5 py-3.5"
          >
            {packable ? (
              <Checkbox
                checked={packedIds.includes(item.id)}
                onCheckedChange={() => onTogglePacked(item.id)}
                aria-label={`แพ็คแล้ว: ${item.productName}`}
              />
            ) : null}

            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon aria-hidden="true" className="size-5 text-slate-500" />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <p className="truncate text-xs font-medium text-foreground">{item.productName}</p>
              <p className="truncate text-xs text-gray-400">
                {[item.gameName, itemMeta(item)].filter(Boolean).join(" · ")}
              </p>
            </div>

            <p className="shrink-0 text-xs text-gray-700">×{item.quantity}</p>

            <p className="w-24 shrink-0 text-right text-xs font-semibold text-foreground">
              {formatBaht(item.unitPrice)}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
