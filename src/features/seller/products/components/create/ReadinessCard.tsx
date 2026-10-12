import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import type {
  ProductCreateData,
  ReadinessId,
} from "../../product-create.types";

type ReadinessCardProps = ProductCreateData["readiness"] & {
  status: Record<ReadinessId, boolean>;
};

export function ReadinessCard({ title, items, status }: ReadinessCardProps) {
  const doneCount = items.filter((item) => status[item.id]).length;
  const isAllDone = doneCount === items.length;

  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-950">{title}</p>
        <Badge
          className={cn(
            "h-5 rounded-full px-2 text-xs",
            isAllDone
              ? "bg-green-100 text-emerald-700"
              : "bg-orange-100 text-amber-700",
          )}
        >
          {doneCount} / {items.length}
        </Badge>
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const isDone = status[item.id];

          return (
            <li key={item.id} className="flex items-center gap-2.5">
              {/* แสดงสถานะอย่างเดียว ติ๊กเองไม่ได้ — คำนวณจากค่าที่กรอกในฟอร์ม */}
              <Checkbox
                checked={isDone}
                disabled
                aria-hidden="true"
                tabIndex={-1}
                className="rounded-sm border-input bg-background disabled:cursor-default disabled:opacity-100"
              />
              <p
                className={cn(
                  "flex-1 text-xs",
                  isDone ? "text-gray-700" : "text-gray-400",
                )}
              >
                {isDone ? item.doneLabel : item.pendingLabel}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
