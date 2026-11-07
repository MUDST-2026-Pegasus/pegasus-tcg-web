import { translate, useLanguage } from "@/lib/language";
import { PromotionTicketFrame } from "@/features/promotions/PromotionTicketFrame";
import { RadioGroupItem } from "@/components/ui/radio-group";
import type { SellerPromotion, SellerPromotionInput } from "@/features/seller/promotions/promotions.types";
import { discountCapLabel, minSpendLabel, money, thaiDate } from "@/features/seller/promotions/promotions.format";
import type { AdminPromotionInput } from "@/features/admin/promotions.types";
import { formatBaht, formatPromoDate } from "@/features/admin/promotions.format";
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
  promotion: AvailablePromotion | SellerPromotion | SellerPromotionInput | AdminPromotionInput;
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
  useLanguage();
  if ("scopeType" in promotion) {
    const value = promotion.discountType === "FREE_SHIPPING"
      ? translate("ส่งฟรี", "Free shipping") : promotion.discountType === "PERCENT"
        ? `${promotion.discountValue || 0}%` : formatBaht(promotion.discountValue);
    const endsAt = Number.isFinite(Date.parse(promotion.endsAt))
      ? formatPromoDate(promotion.endsAt) : "—";
    const cap = promotion.discountType === "PERCENT" && promotion.maxDiscount
      ? translate(`ลด ${promotion.discountValue}% สูงสุด ${formatBaht(promotion.maxDiscount)} · `, `${promotion.discountValue}% off, up to ${formatBaht(promotion.maxDiscount)} · `) : "";
    return (
      <PromotionTicketFrame variant="platform" scallopOffsets={[-38, -20, -2, 16, 34]}
        stub={<>
          {promotion.discountType === "FREE_SHIPPING" ? null : <span className="text-[10px] opacity-80">{translate("ลด", "Discount")}</span>}
          <strong className="text-[22px] leading-7 font-black">{value}</strong>
          <span className="text-[9px] font-semibold tracking-widest opacity-80">PEGASUS</span>
        </>} body={<>
          <div className="flex items-center justify-between gap-1">
            <strong className="truncate text-sm tracking-wide">{promotion.code || "PEGASUS10"}</strong>
            <span aria-hidden className="size-[18px] shrink-0 rounded-full border border-muted-foreground/60" />
          </div>
          <span className="truncate text-[11px] text-foreground/75">
            {cap}{promotion.minSpend > 0 ? translate(`ขั้นต่ำ ${formatBaht(promotion.minSpend)}`, `Minimum spend ${formatBaht(promotion.minSpend)}`) : translate("ไม่มีขั้นต่ำ", "No minimum spend")}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">
            {translate("ใช้ได้ถึง", "Valid until")}{endsAt} · {promotion.claimLimit == null
              ? translate("เก็บได้ไม่จำกัด", "Unlimited claims") : translate(`เหลือ ${promotion.claimLimit} สิทธิ์`, `${promotion.claimLimit} claims left`)}
          </span>
        </>} />
    );
  }

  if (!("ownerType" in promotion)) {
    const value = promotion.discountType === "PERCENT"
      ? `${promotion.discountValue || 0}%` : money(promotion.discountValue || 0);
    const isScheduled = "status" in promotion && promotion.status === "SCHEDULED";
    const isAdminPaused = "pausedBy" in promotion && promotion.pausedBy === "ADMIN";
    const visibility = promotion.visibility === "PUBLIC" ? translate("สาธารณะ", "Public") : translate("ส่วนตัว", "Private");
    const details = promotion.discountType === "PERCENT"
      ? `${discountCapLabel(promotion)} · ${minSpendLabel(promotion.minSpend)}`
      : translate(`${minSpendLabel(promotion.minSpend)} · ${promotion.usageLimitPerUser} สิทธิ์/คน`, `${minSpendLabel(promotion.minSpend)} · ${promotion.usageLimitPerUser} uses per person`);
    const period = isAdminPaused ? translate("หยุดโดยทีมงาน Pegasus", "Paused by Pegasus")
      : `${isScheduled ? translate("เริ่ม", "Starts") : translate("ใช้ได้ถึง", "Valid until")} ${promotion.endsAt
        ? thaiDate(isScheduled ? promotion.startsAt : promotion.endsAt) : "—"} · ${visibility}`;

    return (
      <PromotionTicketFrame variant="shop" scallopOffsets={[-29, -11, 7, 25]}
        stub={<>
          <span className="text-[10px] opacity-80">{translate("ลด", "Discount")}</span>
          <strong className="text-[22px] leading-7 font-black">{value}</strong>
          <small className="text-[9px] font-semibold tracking-widest opacity-80">{translate("ร้านค้า", "SHOP")}</small>
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
            <span className="text-[11px] text-white/80">{translate("ลด", "Discount")}</span>
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
              {translate("ขั้นต่ำ", "Minimum spend")}{checkoutMoney(promotion.minSpend)}
              {promotion.maxDiscount ? translate(` · สูงสุด ${checkoutMoney(promotion.maxDiscount)}`, ` · Up to ${checkoutMoney(promotion.maxDiscount)}`) : ""}
            </span>
            {!disabled && (
              <span className="block truncate text-[11px] text-muted-foreground">
                {translate("ใช้ได้ถึง", "Valid until")}{formatPromotionDate(promotion.endsAt)}
                {promotion.remainingClaims != null ? translate(` · เหลือ ${promotion.remainingClaims} สิทธิ์`, ` · ${promotion.remainingClaims} claims left`) : ""}
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
