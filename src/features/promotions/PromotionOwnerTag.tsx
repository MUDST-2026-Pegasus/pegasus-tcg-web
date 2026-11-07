import { translate, useLanguage } from "@/lib/language";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { PromotionOwnerType } from "./order.types";

type PromotionOwnerTagProps = {
  owner: PromotionOwnerType;
  tone?: "admin" | "order";
};

/** Shared code-owner badge: admin list colours, or the O1 order tags (black Pegasus, teal shop). */
export function PromotionOwnerTag({ owner, tone = "admin" }: PromotionOwnerTagProps) {
  useLanguage();
  const style = tone === "order"
    ? owner === "PLATFORM"
      ? "bg-foreground text-background"
      : "bg-teal-50 text-teal-700"
    : owner === "PLATFORM"
      ? "bg-[#e8f1fc] text-[#0058bc]"
      : "bg-[#e6f6f4] text-[#0f766e]";

  return (
    <Badge className={cn("h-5 rounded px-2 text-[11px] font-semibold", style)}>
      {owner === "PLATFORM" ? "Pegasus" : translate("โค้ดร้าน", "Shop coupon")}
    </Badge>
  );
}
