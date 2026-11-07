import { getLanguage, translate, useLanguage } from "@/lib/language";
import type { MouseEvent } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { checkoutMoney, formatPromotionValue } from "@/features/cart/checkout.format";
import { cn } from "@/lib/utils";
import { PromotionTicketFrame } from "./PromotionTicketFrame";
import { claimTicketState } from "./claim.format";
import type { ClaimableCode } from "./claim.types";

export type ClaimTicketData = Pick<
  ClaimableCode,
  | "code"
  | "name"
  | "ownerType"
  | "shop"
  | "discountType"
  | "discountValue"
  | "maxDiscount"
  | "minSpend"
  | "remainingClaims"
  | "claimed"
>;


export interface ClaimTicketProps {
  promotion: ClaimTicketData;
  onClaim?: () => void;
  /** Clicking the ticket (not the button) opens "เงื่อนไขโค้ด". */
  onOpenTerms?: () => void;
  claiming?: boolean;
  /** A shop looking at its own store page: no button at all. */
  hideAction?: boolean;
  className?: string;
}

/** Figma `PRM / Claim Ticket`: Owner Pegasus/ร้าน × State Claimable/Claimed/SoldOut. */
export function ClaimTicket({
  promotion,
  onClaim,
  onOpenTerms,
  claiming = false,
  hideAction = false,
  className,
}: ClaimTicketProps) {
  useLanguage();
  const state = claimTicketState(promotion);
  const platform = promotion.ownerType === "PLATFORM";
  const soldOut = state === "soldOut";

  const stubNote = promotion.maxDiscount
    ? translate(`สูงสุด ${checkoutMoney(promotion.maxDiscount)}`, `Up to ${checkoutMoney(promotion.maxDiscount)}`)
    : platform ? null : promotion.shop?.name ?? translate("โค้ดร้าน", "Shop coupon");
  const conditions = translate(`${promotion.minSpend > 0 ? `ขั้นต่ำ ${checkoutMoney(promotion.minSpend)}` : translate("ไม่มีขั้นต่ำ", "No minimum spend")}${platform ? "" : translate(" จากร้านนี้", " from this shop")}`, `${promotion.minSpend > 0 ? `Minimum spend ${checkoutMoney(promotion.minSpend)}` : translate("ไม่มีขั้นต่ำ", "No minimum spend")}${platform ? "" : translate(" จากร้านนี้", " from this shop")}`);
  const footnote = state === "claimed"
    ? translate("ใช้ได้ในตะกร้า", "Available in cart")
    : soldOut ? translate("ถูกเก็บครบแล้ว", "Fully claimed")
      : promotion.remainingClaims == null ? translate("ไม่จำกัดจำนวน", "Unlimited claims") : translate(`เหลือ ${promotion.remainingClaims.toLocaleString(getLanguage() === "th" ? "th-TH" : "en-US")} สิทธิ์`, `${promotion.remainingClaims.toLocaleString("en-US")} claims left`);

  const stop = (handler?: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler?.();
  };

  return (
    <PromotionTicketFrame
      variant={platform ? "platform" : "shop"}
      scallopOffsets={[-38, -20, -2, 16, 34]}
      onClick={onOpenTerms}
      className={cn(
        "h-[100px] shrink-0",
        onOpenTerms && "cursor-pointer",
        soldOut && "bg-muted/30",
        className,
      )}
      stubClassName={soldOut ? "from-zinc-500 via-zinc-400 to-zinc-300" : undefined}
      stub={
        <>
          <small className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/80">
            {platform ? "PEGASUS" : "SHOP"}
          </small>
          <strong className="text-[24px] font-black leading-7">{formatPromotionValue(promotion)}</strong>
          {stubNote && <span className="max-w-full truncate text-[9px] text-white/85">{stubNote}</span>}
        </>
      }
      bodyClassName="gap-0.5"
      body={
        <>
          <Badge
            variant="secondary"
            className={cn(
              "h-4 w-fit rounded-full px-2 text-[9px] font-semibold",
              soldOut ? "bg-muted text-muted-foreground"
                : platform ? "bg-primary/10 text-primary" : "bg-teal-50 text-teal-700",
            )}
          >
            {platform ? "Pegasus" : translate("โค้ดร้าน", "Shop coupon")}
          </Badge>
          <button
            type="button"
            onClick={stop(onOpenTerms)}
            disabled={!onOpenTerms}
            aria-label={translate(`เงื่อนไขโค้ด ${promotion.code}`, `Terms for coupon ${promotion.code}`)}
            className={cn(
              "truncate text-left text-sm font-semibold disabled:cursor-default",
              soldOut ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {promotion.name}
          </button>
          <span className={cn("truncate text-[11px]", soldOut ? "text-muted-foreground" : "text-foreground/75")}>
            {conditions}
          </span>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-[10px]",
                state === "claimed" ? "font-medium text-emerald-700" : "text-muted-foreground",
              )}
            >
              {footnote}
            </span>
            {!hideAction && (
              state === "claimed" ? (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={stop()}
                  aria-disabled
                  className="h-7 shrink-0 cursor-default gap-1 rounded-md px-3 text-xs text-emerald-700 hover:bg-transparent hover:text-emerald-700"
                >
                  <Check className="size-3.5" /> {translate("เก็บแล้ว", "Collected")}</Button>
              ) : soldOut ? (
                <Button type="button" size="xs" variant="secondary" disabled className="h-7 shrink-0 rounded-md px-3 text-xs">
                  {translate("หมดแล้ว", "Fully claimed")}</Button>
              ) : (
                <Button
                  type="button"
                  size="xs"
                  onClick={stop(onClaim)}
                  disabled={claiming || !onClaim}
                  aria-label={translate(`เก็บโค้ด ${promotion.code}`, `Collect coupon ${promotion.code}`)}
                  className={cn(
                    "h-7 shrink-0 rounded-md px-3 text-xs font-semibold",
                    !platform && "bg-teal-600 hover:bg-teal-700",
                  )}
                >
                  {claiming ? <Spinner /> : translate("เก็บโค้ด", "Collect coupon")}
                </Button>
              )
            )}
          </div>
        </>
      }
    />
  );
}
