import { Button } from "@/components/ui/button";
import { SellerShopCompletenessCard } from "@/features/seller/components/SellerShopCompletenessCard";
import { SellerShopInfoCard } from "@/features/seller/components/SellerShopInfoCard";
import { SellerShopPoliciesCard } from "@/features/seller/components/SellerShopPoliciesCard";
import { SellerShopPreviewCard } from "@/features/seller/components/SellerShopPreviewCard";
import { SellerShopVerificationCard } from "@/features/seller/components/SellerShopVerificationCard";
import type { SellerShopData } from "@/features/seller/seller.types";

type SellerShopContentProps = {
  data: SellerShopData;
};

export function SellerShopContent({ data }: SellerShopContentProps) {
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

      <SellerShopCompletenessCard {...data.completeness} />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <SellerShopInfoCard {...data.info} />
          <SellerShopPoliciesCard {...data.policies} />
        </div>

        <div className="flex w-80 shrink-0 flex-col gap-4">
          <SellerShopPreviewCard {...data.preview} />
          <SellerShopVerificationCard {...data.verification} />
        </div>
      </div>
    </div>
  );
}
