import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { PromotionOwnerType } from "./order.types";

type PromotionOwnerTagProps = {
  owner: PromotionOwnerType;
  tone?: "admin" | "order" | "return";
};

/** Shared code-owner badge for admin, order, and return-promotion views. */
export function PromotionOwnerTag({ owner, tone = "admin" }: PromotionOwnerTagProps) {
  const style = tone === "return"
    ? "bg-primary/10 text-primary"
    : tone === "order"
      ? owner === "PLATFORM"
        ? "bg-primary/10 text-primary"
        : "bg-orange-50 text-orange-800"
      : owner === "PLATFORM"
        ? "bg-[#e8f1fc] text-[#0058bc]"
        : "bg-[#e6f6f4] text-[#0f766e]";

  return (
    <Badge className={cn("h-5 rounded px-2 text-[11px] font-semibold", style)}>
      {owner === "PLATFORM" ? "Pegasus" : "โค้ดร้าน"}
    </Badge>
  );
}
