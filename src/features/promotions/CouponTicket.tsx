import { PromotionTicketFrame, StubAmount, StubText } from "@/features/promotions/PromotionTicketFrame";
import { RadioGroupItem } from "@/components/ui/radio-group";
import type { SellerPromotion, SellerPromotionInput } from "@/features/seller/promotions/promotions.types";
import { discountCapLabel, minSpendLabel, thaiDate } from "@/features/seller/promotions/promotions.format";
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
import { useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("promotions");
  if ("scopeType" in promotion) {
    const value = promotion.discountType === "FREE_SHIPPING"
      ? <StubText>{t("buyer.couponTicket.value", "ส่งฟรี")}</StubText> : promotion.discountType === "PERCENT"
        ? `${promotion.discountValue || 0}%` : <StubAmount amount={promotion.discountValue} />;
    const endsAt = Number.isFinite(Date.parse(promotion.endsAt))
      ? formatPromoDate(promotion.endsAt) : "—";
    const cap = promotion.discountType === "PERCENT" && promotion.maxDiscount
      ? t("buyer.couponTicket.cap", "ลด {discountValue}% สูงสุด {value} · ", { discountValue: promotion.discountValue, value: formatBaht(promotion.maxDiscount) }) : "";
    return (
      <PromotionTicketFrame variant="platform" scallopOffsets={[-38, -20, -2, 16, 34]}
        stub={<>
          {promotion.discountType === "FREE_SHIPPING" ? null : <span className="text-[10px] opacity-80">{t("buyer.couponTicket.span", "ลด")}</span>}
          <strong className="text-[22px] leading-7 font-black">{value}</strong>
          <span className="text-[9px] font-semibold tracking-widest opacity-80">PEGASUS</span>
        </>} body={<>
          <div className="flex items-center justify-between gap-1">
            <strong className="truncate text-sm tracking-wide">{promotion.code || "PEGASUS10"}</strong>
            <span aria-hidden className="size-[18px] shrink-0 rounded-full border border-muted-foreground/60" />
          </div>
          <span className="truncate text-[11px] text-foreground/75">
            {cap}{promotion.minSpend > 0 ? t("buyer.couponTicket.span2", "ขั้นต่ำ {value}", { value: formatBaht(promotion.minSpend) }) : t("buyer.couponTicket.span3", "ไม่มีขั้นต่ำ")}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">
            {t("buyer.couponTicket.span4", "ใช้ได้ถึง")} {endsAt} · {promotion.claimLimit == null
              ? t("buyer.couponTicket.span5", "เก็บได้ไม่จำกัด") : t("buyer.couponTicket.span6", "เหลือ {claimLimit} สิทธิ์", { claimLimit: promotion.claimLimit })}
          </span>
        </>} />
    );
  }

  if (!("ownerType" in promotion)) {
    const value = promotion.discountType === "PERCENT"
      ? `${promotion.discountValue || 0}%` : <StubAmount amount={promotion.discountValue || 0} />;
    const isScheduled = "status" in promotion && promotion.status === "SCHEDULED";
    const isAdminPaused = "pausedBy" in promotion && promotion.pausedBy === "ADMIN";
    const visibility = promotion.visibility === "PUBLIC" ? t("buyer.couponTicket.visibility", "สาธารณะ") : t("buyer.couponTicket.visibility2", "ส่วนตัว");
    const details = promotion.discountType === "PERCENT"
      ? `${discountCapLabel(promotion)} · ${minSpendLabel(promotion.minSpend)}`
      : t("buyer.couponTicket.details", "{value} · {usageLimitPerUser} สิทธิ์/คน", { value: minSpendLabel(promotion.minSpend), usageLimitPerUser: promotion.usageLimitPerUser });
    const period = isAdminPaused ? t("buyer.couponTicket.period", "หยุดโดยทีมงาน Pegasus")
      : `${isScheduled ? t("buyer.couponTicket.period2", "เริ่ม") : t("buyer.couponTicket.span4", "ใช้ได้ถึง")} ${promotion.endsAt
        ? thaiDate(isScheduled ? promotion.startsAt : promotion.endsAt) : "—"} · ${visibility}`;

    return (
      <PromotionTicketFrame variant="shop" scallopOffsets={[-29, -11, 7, 25]}
        stub={<>
          <span className="text-[10px] opacity-80">{t("buyer.couponTicket.span", "ลด")}</span>
          <strong className="text-[22px] leading-7 font-black">{value}</strong>
          <small className="text-[9px] font-semibold tracking-widest opacity-80">{t("buyer.couponTicket.shopTag", "ร้าน")}</small>
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
  const value = promotion.discountType === "FIXED" ? <StubAmount amount={promotion.discountValue} /> : promotion.discountType === "FREE_SHIPPING" ? <StubText>{formatPromotionValue(promotion)}</StubText> : formatPromotionValue(promotion);

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
            <span className="text-[11px] text-white/80">{t("buyer.couponTicket.span", "ลด")}</span>
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
              {t("buyer.couponTicket.span7", "ขั้นต่ำ")} {checkoutMoney(promotion.minSpend)}
              {promotion.maxDiscount ? t("buyer.couponTicket.span8", " · สูงสุด {value}", { value: checkoutMoney(promotion.maxDiscount) }) : ""}
            </span>
            {!disabled && (
              <span className="block truncate text-[11px] text-muted-foreground">
                {t("buyer.couponTicket.span4", "ใช้ได้ถึง")} {formatPromotionDate(promotion.endsAt)}
                {promotion.remainingClaims != null ? t("buyer.couponTicket.span9", " · เหลือ {remainingClaims} สิทธิ์", { remainingClaims: promotion.remainingClaims }) : ""}
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
