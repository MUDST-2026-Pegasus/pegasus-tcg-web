import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { OrderDetail } from "../../order-detail.types";

type OrderTimelineCardProps = OrderDetail["timeline"];

export function OrderTimelineCard({ title, entries }: OrderTimelineCardProps) {
  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-base font-semibold text-zinc-950">{title}</p>

      <ol className="flex flex-col">
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1;

          return (
            <li
              key={entry.id}
              className={cn("flex items-start gap-3.5", !isLast && "pb-3.5")}
            >
              <div aria-hidden="true" className="flex w-4 flex-col items-center">
                <span
                  className={cn(
                    "size-2.5 rounded-full border-2",
                    entry.done
                      ? "border-teal-600 bg-teal-600"
                      : "border-zinc-200 bg-white",
                  )}
                />
                {isLast ? null : (
                  <span
                    className={cn(
                      "h-7 w-0.5",
                      entry.done ? "bg-zinc-200" : "bg-gray-100",
                    )}
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-[3px]">
                <p
                  className={cn(
                    "text-xs",
                    entry.done
                      ? "font-medium text-zinc-950"
                      : "font-normal text-gray-400",
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
