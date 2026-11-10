import { TicketPercent } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslate } from "@/lib/i18n";

type PromotionOrderIndicatorProps = {
  codes?: readonly string[];
};

/** Accessible code indicator for discounted seller orders in the order list. */
export function PromotionOrderIndicator({ codes = [] }: PromotionOrderIndicatorProps) {
  const { t } = useTranslate("promotions");
  const description = codes.length
    ? t("buyer.promotionOrderIndicator.description", "ใช้งานโค้ดส่วนลด {value}", { value: codes.join(", ") })
    : t("buyer.promotionOrderIndicator.description2", "ออเดอร์นี้ใช้โค้ดส่วนลด");

  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} aria-label={description} className="inline-flex rounded-sm text-teal-700 outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
        <TicketPercent aria-hidden="true" className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
}
