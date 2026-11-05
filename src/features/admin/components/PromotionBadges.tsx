import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  REDEMPTION_STATUS_LABEL,
  REDEMPTION_STATUS_STYLE,
  STATUS_LABEL,
  STATUS_STYLE,
} from "../promotions.format";
import type { PromotionStatus, RedemptionStatus } from "../promotions.types";

export { PromotionOwnerTag } from "@/features/promotions/PromotionOwnerTag";

/** Figma PRM / Status Pill — จุดสีนำหน้าข้อความ */
export function PromotionStatusPill({ status }: { status: PromotionStatus }) {
  return (
    <Badge className={cn("h-5 gap-1.5 rounded-full px-2 text-xs font-medium", STATUS_STYLE[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function RedemptionStatusPill({ status }: { status: RedemptionStatus }) {
  return (
    <Badge className={cn("h-5 rounded px-2 text-[11px] font-medium", REDEMPTION_STATUS_STYLE[status])}>
      {REDEMPTION_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
