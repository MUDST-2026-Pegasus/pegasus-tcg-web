import { Badge } from "@/components/ui/badge";
import type { PromotionOwnerType } from "./PromotionDiscountLines";

const OWNER_LABEL: Record<PromotionOwnerType, string> = {
  SELLER: "โค้ดร้าน",
  PLATFORM: "Pegasus",
};

export function PromotionOwnerBadge({ ownerType }: { ownerType: PromotionOwnerType }) {
  return (
    <Badge
      variant="secondary"
      className={
        ownerType === "SELLER"
          ? "h-4 rounded px-1.5 py-0 text-[10px] font-semibold bg-emerald-50 text-emerald-700"
          : "h-4 rounded px-1.5 py-0 text-[10px] font-semibold bg-zinc-950 text-white"
      }
    >
      {OWNER_LABEL[ownerType]}
    </Badge>
  );
}
