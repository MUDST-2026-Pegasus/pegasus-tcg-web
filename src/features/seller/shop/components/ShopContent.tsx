import { Button } from "@/components/ui/button";

import type { ShopData } from "../shop.types";

import { CompletenessCard } from "./CompletenessCard";
import { InfoCard } from "./InfoCard";
import { PoliciesCard } from "./PoliciesCard";
import { PreviewCard } from "./PreviewCard";
import { VerificationCard } from "./VerificationCard";

type ShopContentProps = {
  data: ShopData;
};

export function ShopContent({ data }: ShopContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-950">{data.title}</h1>
          <p className="text-xs text-gray-500">{data.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-md px-2.5">
            {data.actions.cancelLabel}
          </Button>
          <Button size="sm" className="rounded-md px-2.5">
            {data.actions.saveLabel}
          </Button>
        </div>
      </div>

      <CompletenessCard {...data.completeness} />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <InfoCard {...data.info} />
          <PoliciesCard {...data.policies} />
        </div>

        <div className="flex w-80 shrink-0 flex-col gap-4">
          <PreviewCard {...data.preview} />
          <VerificationCard {...data.verification} />
        </div>
      </div>
    </div>
  );
}
