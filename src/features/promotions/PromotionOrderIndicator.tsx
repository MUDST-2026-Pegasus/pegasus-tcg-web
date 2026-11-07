import { translate, useLanguage } from "@/lib/language";
import { TicketPercent } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PromotionOrderIndicatorProps = {
  codes?: readonly string[];
};

/** Accessible code indicator for discounted seller orders in the order list. */
export function PromotionOrderIndicator({ codes = [] }: PromotionOrderIndicatorProps) {
  useLanguage();
  const description = codes.length
    ? translate(`ใช้งานโค้ดส่วนลด ${codes.join(", ")}`, `Discount codes used: ${codes.join(", ")}`)
    : translate("ออเดอร์นี้ใช้โค้ดส่วนลด", "Discount codes used on this order");

  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} aria-label={description} className="inline-flex rounded-sm text-teal-700 outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
        <TicketPercent aria-hidden="true" className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
}
