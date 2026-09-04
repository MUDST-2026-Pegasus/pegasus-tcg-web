import { BadgeCheck, Eye } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SellerShopData } from "@/features/seller/seller.types";

type SellerShopPreviewCardProps = SellerShopData["preview"];

export function SellerShopPreviewCard({
  label,
  shopName,
  description,
  initials,
  stats,
  tags,
}: SellerShopPreviewCardProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <Eye className="size-3.5 text-gray-500" />
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>

      <Card className="w-full gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
        <div className="h-20 rounded-t-xl bg-teal-600" />

        <div className="flex flex-col gap-3 px-4 pb-4">
          <Avatar className="-mt-7 size-14 border-4 border-white">
            <AvatarFallback className="bg-teal-600 text-sm text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-zinc-950">{shopName}</p>
              <BadgeCheck className="size-3.5 text-teal-600" />
            </div>
            <p className="text-xs leading-4 text-gray-500">{description}</p>
          </div>

          <div className="flex items-start">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="flex flex-1 flex-col items-center gap-[3px]"
              >
                <p className="text-xs font-semibold text-zinc-950">
                  {stat.value}
                </p>
                <p className="text-[10px] text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-start gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                className="h-5 rounded-[5px] bg-[#e6f4f2] px-2 text-[10px] text-teal-600"
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
