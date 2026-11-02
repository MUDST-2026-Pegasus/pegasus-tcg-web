import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { TimelineEntry } from "../../orders.format";

type OrderTimelineCardProps = {
  title: string;
  entries: TimelineEntry[];
};

export function OrderTimelineCard({ title, entries }: OrderTimelineCardProps) {
  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-base font-semibold text-foreground">{title}</p>

      <ol className="flex flex-col">
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1;

          return (
            <li key={entry.id} className={cn("flex items-start gap-3.5", !isLast && "pb-3.5")}>
              <div aria-hidden="true" className="flex w-4 flex-col items-center">
                <span
                  className={cn(
                    "size-2.5 rounded-full border-2",
                    entry.done ? "border-teal-600 bg-teal-600" : "border-border bg-card",
                  )}
                />
                {isLast ? null : (
                  <span className={cn("h-7 w-0.5", entry.done ? "bg-border" : "bg-secondary")} />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-[3px]">
                <p
                  className={cn(
                    "text-xs",
                    entry.done ? "font-medium text-foreground" : "font-normal text-gray-400",
                  )}
                >
                  {entry.label}
                </p>
                <p className="text-xs text-gray-500">{entry.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
