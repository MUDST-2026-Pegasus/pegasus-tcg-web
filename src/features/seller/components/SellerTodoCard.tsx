import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SellerTodoList, TodoAccent } from "@/features/seller/seller.types";
import { cn } from "@/lib/utils";

const ICON_BG: Record<TodoAccent, string> = {
  red: "bg-[#fbe9e8]",
  amber: "bg-[#fdf0dd]",
  primary: "bg-[#e8f1fc]",
  gray: "bg-[#eef1f2]",
};

const ICON_COLOR: Record<TodoAccent, string> = {
  red: "text-[#d0342c]",
  amber: "text-[#b45309]",
  primary: "text-[#0058bc]",
  gray: "text-[#6b7280]",
};

type SellerTodoCardProps = SellerTodoList;

export function SellerTodoCard({
  title,
  description,
  count,
  items,
}: SellerTodoCardProps) {
  return (
    <Card className="w-96 gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold text-zinc-950">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <Badge className="h-auto rounded-full bg-[#fbe9e8] px-2 py-[3px] text-xs text-[#d0342c]">
          {count}
        </Badge>
      </div>

      <ul className="flex flex-col">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <li
              key={item.id}
              className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 first:border-t-0"
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  ICON_BG[item.accent],
                )}
              >
                <Icon className={cn("size-3.5", ICON_COLOR[item.accent])} />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <p className="text-xs font-medium text-zinc-950">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>

              <ChevronRight className="size-3.5 shrink-0 text-gray-400" />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
