import radio from "@/assets/promotions/radio.svg";
import check from "@/assets/promotions/check.svg";
import { PromotionTicketFrame } from "@/features/promotions/PromotionTicketFrame";
import {
  checkoutMoney,
  formatPromotionDate,
  formatPromotionUnavailableReason,
  formatPromotionValue,
} from "../checkout.format";
import type { AvailablePromotion } from "../promotions.types";
import { cn } from "@/lib/utils";

const SCALLOP_OFFSETS = [-29, -11, 7, 25];

export interface CouponTicketProps {
  promotion: AvailablePromotion;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
  disabled?: boolean;
}

export function CouponTicket({
  promotion,
  selected = false,
  onSelect,
  className,
  disabled: propDisabled,
}: CouponTicketProps) {
  const needsClaim = promotion.source === "CLAIMABLE";
  const disabled = propDisabled ?? (!promotion.applicable || needsClaim);
  const platform = promotion.ownerType === "PLATFORM";
  const value = formatPromotionValue(promotion);

  const disabledReason = formatPromotionUnavailableReason(promotion);

  return (
    <PromotionTicketFrame
      as="button"
      type="button"
      disabled={disabled || !onSelect}
      onClick={onSelect}
      aria-pressed={selected}
      variant={platform ? "platform" : "shop"}
      scallopOffsets={SCALLOP_OFFSETS}
      className={cn(
        "h-[90px] w-full text-left transition-colors",
        selected
          ? "border-[1.5px] border-promotion-selected-border bg-promotion-selected"
          : "bg-card hover:border-primary/60",
        disabled && "bg-muted/20 cursor-not-allowed hover:border-border",
        !disabled && onSelect && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      stubClassName={disabled ? "!bg-none !bg-promotion-muted text-white/90" : undefined}
      stub={
        <>
          {promotion.discountType === "FREE_SHIPPING" ? null : (
            <span className="text-[11px] text-white/80">ลด</span>
          )}
          <strong className="text-[22px] font-black leading-none">{value}</strong>
          <small className="text-[8px] font-semibold uppercase tracking-[0.1em] text-white/80">
            {platform ? "PEGASUS" : "SHOP"}
          </small>
        </>
      }
      body={
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-sm font-bold tracking-[0.04em] text-foreground">
              {promotion.code}
            </strong>
            <span className="block truncate text-xs text-promotion-label">
              {promotion.name}
            </span>
            <span className="block text-xs text-promotion-label">
              ขั้นต่ำ {checkoutMoney(promotion.minSpend)}
              {promotion.maxDiscount ? ` · สูงสุด ${checkoutMoney(promotion.maxDiscount)}` : ""}
            </span>
            {!disabled && (
              <span className="block truncate text-[11px] text-promotion-muted">
                ใช้ได้ถึง {formatPromotionDate(promotion.endsAt)}
                {promotion.remainingClaims != null ? ` · เหลือ ${promotion.remainingClaims} สิทธิ์` : ""}
              </span>
            )}
            {disabled && (
              <span className="block truncate text-[11px] font-medium text-amber-700">
                {disabledReason}
              </span>
            )}
          </div>
          <img
            src={selected ? check : radio}
            alt=""
            className="size-[18px] shrink-0"
          />
        </div>
      }
    />
  );
}
