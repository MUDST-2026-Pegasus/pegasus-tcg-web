import { Sparkles } from "lucide-react";

import type { OrdersData } from "../orders.types";

type TipCardProps = OrdersData["tip"];

export function TipCard({ title, description }: TipCardProps) {
  return (
    <div className="flex w-full flex-col gap-1.5 rounded-xl bg-[#e6f4f2] p-4">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden="true" className="size-4 text-teal-600" />
        <p className="text-xs font-semibold text-teal-600">{title}</p>
      </div>
      <p className="text-xs leading-4 text-teal-600">{description}</p>
    </div>
  );
}
