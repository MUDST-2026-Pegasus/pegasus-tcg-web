import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import type { OrderDetail } from "../../order-detail.types";

type PackingListCardProps = OrderDetail["items"] & {
  packedIds: string[];
  onTogglePacked: (id: string) => void;
};

/** รายการสินค้าในออเดอร์ — ตอนรอแพ็คมีช่องติ๊กไว้เช็กของที่หยิบใส่กล่องแล้ว */
export function PackingListCard({
  title,
  countLabel,
  packable,
  packedLabel,
  rows,
  packedIds,
  onTogglePacked,
}: PackingListCardProps) {
  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3.5">
        <p className="text-base font-semibold text-zinc-950">{title}</p>
        <Badge className="h-5 rounded-full bg-gray-100 px-2 text-xs text-gray-500">
          {countLabel}
        </Badge>
      </div>

      <ul className="flex flex-col">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-3.5 border-t border-gray-100 px-5 py-3.5"
          >
            {packable ? (
              <Checkbox
                checked={packedIds.includes(row.id)}
                onCheckedChange={() => onTogglePacked(row.id)}
                aria-label={`${packedLabel}: ${row.name}`}
              />
            ) : null}

            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-gray-100">
              <ImageIcon aria-hidden="true" className="size-5 text-slate-500" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <p className="truncate text-xs font-medium text-zinc-950">
                {row.name}
              </p>
              <p className="truncate text-xs text-gray-400">{row.meta}</p>
            </div>

            <p className="shrink-0 text-xs text-gray-700">{row.quantityLabel}</p>

            <p className="w-24 shrink-0 text-right text-xs font-semibold text-zinc-950">
              {row.unitPrice}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
