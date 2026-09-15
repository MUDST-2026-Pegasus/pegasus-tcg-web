import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { RestockData } from "../../restock.types";

type ProductStockCardProps = RestockData["product"];

export function ProductStockCard({
  name,
  tags,
  stockLabel,
  stock,
  unit,
}: ProductStockCardProps) {
  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center gap-3.5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <ImageIcon aria-hidden="true" className="size-6 text-slate-500" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <p className="text-sm font-semibold text-zinc-950">{name}</p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="h-5 rounded-[5px] bg-gray-100 px-2 text-xs text-gray-500"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-[10px] text-gray-400">{stockLabel}</p>
          <p className="text-lg font-bold text-zinc-950">
            {stock} {unit}
          </p>
        </div>
      </div>
    </Card>
  );
}
