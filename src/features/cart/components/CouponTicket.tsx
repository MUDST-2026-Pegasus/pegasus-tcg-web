import radio from "@/assets/promotions/radio.svg";
import check from "@/assets/promotions/check.svg";
import { PromotionTicketFrame } from "@/features/promotions/PromotionTicketFrame";
import {
  checkoutMoney,
  formatPromotionDate,
  formatPromotionError,
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
  const disabled = propDisabled ?? !promotion.applicable;
  const platform = promotion.ownerType === "PLATFORM";
  const value = formatPromotionValue(promotion);

  const disabledReason =
    promotion.reason === "PROMO_MIN_SPEND_NOT_MET" && promotion.shortfall
      ? `ซื้อเพิ่มอีก ${checkoutMoney(promotion.shortfall)}`
      : formatPromotionError(promotion.reason, {
          sellerName: promotion.sellerName,
          shortfall: promotion.shortfall,
        });

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
        "h-[92px] w-full text-left transition-colors",
        selected
          ? "ring-2 ring-primary border-primary bg-[#f0f7fc]"
          : "ring-1 ring-border bg-white hover:border-primary/60",
        disabled && "bg-muted/20 cursor-not-allowed hover:border-border",
        !disabled && onSelect && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      stubClassName={disabled ? "!bg-none !bg-[#9ca8ad] text-white/90" : undefined}
      stub={
        <>
          {promotion.discountType === "FREE_SHIPPING" ? null : (
            <span className="text-[10px] text-white/80">ลด</span>
          )}
          <strong className="text-[22px] font-black leading-none">{value}</strong>
          <small className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/80">
            {platform ? "PEGASUS" : "SHOP"}
          </small>
        </>
      }
      body={
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-[13px] font-semibold text-[#090b0c]">
              {promotion.code}
            </strong>
            <span className="block truncate text-[11px] text-[#67787c]">
              {promotion.name}
            </span>
            <span className="block text-[10px] text-[#67787c]">
              ขั้นต่ำ {checkoutMoney(promotion.minSpend)}
              {promotion.maxDiscount ? ` · สูงสุด ${checkoutMoney(promotion.maxDiscount)}` : ""}
            </span>
            {!disabled && (
              <span className="block truncate text-[10px] text-[#9aa5ad]">
                ใช้ได้ถึง {formatPromotionDate(promotion.endsAt)}
                {promotion.remainingClaims != null ? ` · เหลือ ${promotion.remainingClaims} สิทธิ์` : ""}
              </span>
            )}
            {disabled && (
              <span className="block truncate text-[10px] font-medium text-amber-700">
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
