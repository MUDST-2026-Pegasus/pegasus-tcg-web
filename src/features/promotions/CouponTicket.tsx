import { PromotionTicketFrame } from "@/features/promotions/PromotionTicketFrame";
import { RadioGroupItem } from "@/components/ui/radio-group";
import type { SellerPromotion, SellerPromotionInput } from "@/features/seller/promotions/promotions.types";
import { discountCapLabel, minSpendLabel, money, thaiDate } from "@/features/seller/promotions/promotions.format";
import {
  checkoutMoney,
  formatPromotionDate,
  formatPromotionUnavailableReason,
  formatPromotionValue,
} from "@/features/cart/checkout.format";
import type { AvailablePromotion } from "@/features/cart/promotions.types";
import { cn } from "@/lib/utils";

const SCALLOP_OFFSETS = [-29, -11, 7, 25];

export interface CouponTicketProps {
  promotion: AvailablePromotion | SellerPromotion | SellerPromotionInput;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
  disabled?: boolean;
  preview?: boolean;
}

export function CouponTicket({
  promotion,
  selected = false,
  onSelect,
  className,
  disabled: propDisabled,
  preview = false,
}: CouponTicketProps) {
  if (!("ownerType" in promotion)) {
    const value = promotion.discountType === "PERCENT"
      ? `${promotion.discountValue || 0}%` : money(promotion.discountValue || 0);
    const isScheduled = "status" in promotion && promotion.status === "SCHEDULED";
    const isAdminPaused = "pausedBy" in promotion && promotion.pausedBy === "ADMIN";
    const visibility = promotion.visibility === "PUBLIC" ? "สาธารณะ" : "ส่วนตัว";
    const details = promotion.discountType === "PERCENT"
      ? `${discountCapLabel(promotion)} · ${minSpendLabel(promotion.minSpend)}`
      : `${minSpendLabel(promotion.minSpend)} · ${promotion.usageLimitPerUser} สิทธิ์/คน`;
    const period = isAdminPaused ? "หยุดโดยทีมงาน Pegasus"
      : `${isScheduled ? "เริ่ม" : "ใช้ได้ถึง"} ${promotion.endsAt
        ? thaiDate(isScheduled ? promotion.startsAt : promotion.endsAt) : "—"} · ${visibility}`;

    return (
      <PromotionTicketFrame variant="shop" scallopOffsets={[-29, -11, 7, 25]}
        stub={<>
          <span className="text-[10px] opacity-80">ลด</span>
          <strong className="text-[22px] leading-7 font-black">{value}</strong>
          <small className="text-[9px] font-semibold tracking-widest opacity-80">SHOP</small>
        </>}
        body={<>
          <div className="flex min-w-0 items-center justify-between gap-1">
            <strong className="truncate text-sm tracking-wide">{promotion.code || "YOURCODE"}</strong>
            {preview && <span aria-hidden className="size-[18px] shrink-0 rounded-full border border-muted-foreground/60" />}
          </div>
          <span className="truncate text-[11px] text-foreground/75">{details}</span>
          <span className="truncate text-[10px] text-muted-foreground">{period}</span>
        </>} />
    );
  }

  const needsClaim = promotion.source === "CLAIMABLE";
  const disabled = propDisabled ?? (!promotion.applicable || needsClaim);
  const platform = promotion.ownerType === "PLATFORM";
  const value = formatPromotionValue(promotion);

  const disabledReason = formatPromotionUnavailableReason(promotion);

  return (
    <PromotionTicketFrame
      onClick={!disabled ? onSelect : undefined}
      variant={platform ? "platform" : "shop"}
      scallopOffsets={SCALLOP_OFFSETS}
      className={cn(
        "w-full text-left transition-colors",
        selected
          ? "border-[1.5px] border-primary bg-primary/5"
          : "bg-card hover:border-primary/60",
        disabled && "bg-muted/20 cursor-not-allowed hover:border-border",
        !disabled && onSelect && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      stubClassName={disabled ? "!bg-none !bg-muted-foreground text-white/90" : undefined}
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
            <span className="block truncate text-xs text-foreground/75">
              {promotion.name}
            </span>
            <span className="block text-xs text-foreground/75">
              ขั้นต่ำ {checkoutMoney(promotion.minSpend)}
              {promotion.maxDiscount ? ` · สูงสุด ${checkoutMoney(promotion.maxDiscount)}` : ""}
            </span>
            {!disabled && (
              <span className="block truncate text-[11px] text-muted-foreground">
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
          <RadioGroupItem
            value={promotion.code}
            disabled={disabled || !onSelect}
            aria-label={promotion.code}
            className="size-[18px] border border-muted-foreground/60 data-checked:border-primary"
          />
        </div>
      }
    />
  );
}
