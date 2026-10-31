import { cn } from "@/lib/utils";

import {
  REDEMPTION_STATUS_LABEL,
  REDEMPTION_STATUS_STYLE,
  STATUS_LABEL,
  STATUS_STYLE,
} from "../promotions.format";
import type { PromotionOwnerType, PromotionStatus, RedemptionStatus } from "../promotions.types";

/** Figma PRM / Status Pill — จุดสีนำหน้าข้อความ */
export function PromotionStatusPill({ status }: { status: PromotionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-[3px] text-xs font-medium whitespace-nowrap",
        STATUS_STYLE[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PromotionOwnerTag({ owner }: { owner: PromotionOwnerType }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold",
        owner === "PLATFORM" ? "bg-[#e8f1fc] text-[#0058bc]" : "bg-[#e6f6f4] text-[#0f766e]",
      )}
    >
      {owner === "PLATFORM" ? "Pegasus" : "โค้ดร้าน"}
    </span>
  );
}

export function RedemptionStatusPill({ status }: { status: RedemptionStatus }) {
  return (
    <span className={cn("rounded px-2 py-0.5 text-[11px] font-medium", REDEMPTION_STATUS_STYLE[status])}>
      {REDEMPTION_STATUS_LABEL[status] ?? status}
    </span>
  );
}
