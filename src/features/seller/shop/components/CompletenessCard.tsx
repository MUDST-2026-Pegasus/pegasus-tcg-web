import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { ShopData } from "../shop.types";

type CompletenessCardProps = ShopData["completeness"];

export function CompletenessCard({
  percent,
  title,
  remainingLabel,
  description,
}: CompletenessCardProps) {
  return (
    <Card className="w-full flex-row items-center gap-5 rounded-xl border border-border p-4 shadow-none ring-0">
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-zinc-950">{title}</p>
          <Badge className="h-5 rounded-full bg-[#fdf0dd] px-2 text-xs text-[#b45309]">
            {remainingLabel}
          </Badge>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      <div className="h-1.5 w-56 shrink-0 overflow-hidden rounded-full bg-gray-100">
        <div
          style={{ width: `${percent}%` }}
          className="h-full rounded-full bg-teal-600"
        />
      </div>
    </Card>
  );
}
