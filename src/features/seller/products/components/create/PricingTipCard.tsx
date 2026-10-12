import { Star } from "lucide-react";

import type { ProductCreateData } from "../../product-create.types";

type PricingTipCardProps = ProductCreateData["tip"];

export function PricingTipCard({ title, description }: PricingTipCardProps) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-xl bg-emerald-50 p-4">
      <div className="flex items-center gap-2">
        <Star aria-hidden="true" className="size-4 text-teal-600" />
        <p className="text-xs font-semibold text-teal-600">{title}</p>
      </div>
      <p className="text-xs leading-4 text-teal-600">{description}</p>
    </div>
  );
}
