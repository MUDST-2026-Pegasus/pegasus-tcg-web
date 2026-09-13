import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { OrderDetail } from "../../order-detail.types";

type BuyerCardProps = OrderDetail["buyer"];

export function BuyerCard({
  title,
  username,
  initials,
  purchaseLabel,
  messageLabel,
}: BuyerCardProps) {
  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-xs font-medium text-gray-500">{title}</p>

      <div className="flex items-center gap-2.5">
        <Avatar className="size-9">
          <AvatarFallback className="bg-sky-700 text-sm font-normal text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <p className="truncate text-xs font-semibold text-zinc-950">
            {username}
          </p>
          <p className="text-[10px] text-gray-400">{purchaseLabel}</p>
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full rounded-md px-2.5">
        {messageLabel}
      </Button>
    </Card>
  );
}
