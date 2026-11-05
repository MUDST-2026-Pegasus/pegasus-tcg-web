import {
  ChevronRight,
  Clock,
  type LucideIcon,
  ShoppingBag,
  Star,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { TodoAccent, TodoItem, TodoKind, TodoList } from "../dashboard.types";

const ICONS: Record<TodoKind, LucideIcon> = {
  pack: ShoppingBag,
  returns: Undo2,
  restock: TriangleAlert,
  payment: Clock,
  reviews: Star,
};

const ICON_BG: Record<TodoAccent, string> = {
  red: "bg-[#fbe9e8]",
  amber: "bg-[#fdf0dd]",
  primary: "bg-[#e8f1fc]",
  gray: "bg-muted",
};

const ICON_COLOR: Record<TodoAccent, string> = {
  red: "text-[#d0342c]",
  amber: "text-[#b45309]",
  primary: "text-[#0058bc]",
  gray: "text-[#6b7280]",
};

function TodoRow({ item }: { item: TodoItem }) {
  const Icon = ICONS[item.id];
  const body = (
    <>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          ICON_BG[item.accent],
        )}
      >
        <Icon aria-hidden="true" className={cn("size-3.5", ICON_COLOR[item.accent])} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p className="text-xs font-medium text-foreground">{item.title}</p>
        <p className="text-xs text-gray-500">{item.description}</p>
      </div>

      {item.to ? (
        <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-gray-400" />
      ) : null}
    </>
  );
  const rowClass = "flex items-center gap-3 px-4 py-3";

  return (
    <li className="border-t border-muted first:border-t-0">
      {item.to ? (
        <Link
          to={item.to}
          className={cn(
            rowClass,
            "outline-none hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:ring-3 focus-visible:ring-ring/30",
          )}
        >
          {body}
        </Link>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </li>
  );
}

export function TodoCard({ title, description, count, items, emptyLabel }: TodoList) {
  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-none ring-0 lg:w-96">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        {count > 0 ? (
          <Badge className="h-auto rounded-full bg-[#fbe9e8] px-2 py-[3px] text-xs text-[#d0342c]">
            {count}
          </Badge>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="border-t border-muted px-4 py-6 text-center text-xs text-gray-500">
          {emptyLabel}
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <TodoRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </Card>
  );
}
