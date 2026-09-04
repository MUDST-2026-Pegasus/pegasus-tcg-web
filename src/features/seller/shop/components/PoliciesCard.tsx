import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import type { ShopData } from "../shop.types";

type PoliciesCardProps = ShopData["policies"];

export function PoliciesCard({
  title,
  description,
  items,
}: PoliciesCardProps) {
  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <p className="text-base font-semibold text-zinc-950">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3.5 rounded-lg border border-gray-100 bg-neutral-50 px-3.5 py-3"
        >
          <div className="flex flex-1 flex-col gap-[3px]">
            <p className="text-xs font-medium text-zinc-950">{item.title}</p>
            <p className="text-xs text-gray-500">{item.description}</p>
          </div>
          <Switch defaultChecked={item.enabled} aria-label={item.title} />
        </div>
      ))}
    </Card>
  );
}
