import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type ReadinessItem = {
  id: string;
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
  /** ไม่บังคับ — ไม่ติ๊กก็ลงขายได้ (เช่น รูป) */
  optional?: boolean;
};

type ReadinessCardProps = {
  items: ReadinessItem[];
};

/** "พร้อมลงขายหรือยัง" — คำนวณจากค่าในฟอร์ม ติ๊กเองไม่ได้ */
export function ReadinessCard({ items }: ReadinessCardProps) {
  const required = items.filter((item) => !item.optional);
  const doneCount = required.filter((item) => item.done).length;
  const isAllDone = doneCount === required.length;

  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">พร้อมลงขายหรือยัง</p>
        <Badge
          className={cn(
            "h-5 rounded-full px-2 text-xs",
            isAllDone
              ? "bg-green-100 text-emerald-700"
              : "bg-orange-100 text-amber-700",
          )}
        >
          {doneCount} / {required.length}
        </Badge>
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <Checkbox
              checked={item.done}
              disabled
              aria-hidden="true"
              tabIndex={-1}
              className="rounded-sm border-input bg-background disabled:cursor-default disabled:opacity-100"
            />
            <p
              className={cn(
                "flex-1 text-xs",
                item.done ? "text-gray-700" : "text-gray-400",
              )}
            >
              {item.done ? item.doneLabel : item.pendingLabel}
              {item.optional && !item.done ? " (ไม่บังคับ)" : ""}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
