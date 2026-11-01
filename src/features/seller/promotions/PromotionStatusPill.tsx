import { cn } from "@/lib/utils";
import { PROMOTION_STATUS_LABEL, PROMOTION_STATUS_STYLE, type PromotionStatus } from "./status";

/** Figma PRM / Status Pill for seller promotion cards. */
export function PromotionStatusPill({ status }: { status: PromotionStatus }) {
  return <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-[3px] text-xs font-medium whitespace-nowrap", PROMOTION_STATUS_STYLE[status])}><span className="size-1.5 rounded-full bg-current" aria-hidden />{PROMOTION_STATUS_LABEL[status]}</span>;
}
