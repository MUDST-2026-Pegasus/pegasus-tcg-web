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
import { intlLocale, useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("promotions");
  const state = claimTicketState(promotion);
  const platform = promotion.ownerType === "PLATFORM";
  const soldOut = state === "soldOut";

  const stubNote = promotion.maxDiscount
    ? t("buyer.claimTicket.stubNote", "สูงสุด {value}", { value: checkoutMoney(promotion.maxDiscount) })
    : platform ? null : promotion.shop?.name ?? t("buyer.claimTicket.stubNote2", "โค้ดร้าน");
  const conditions = `${promotion.minSpend > 0 ? t("buyer.claimTicket.conditions", "ขั้นต่ำ {value}", { value: checkoutMoney(promotion.minSpend) }) : t("buyer.claimTicket.conditions2", "ไม่มีขั้นต่ำ")}${platform ? "" : t("buyer.claimTicket.conditions3", " จากร้านนี้")}`;
  const footnote = state === "claimed"
    ? t("buyer.claimTicket.footnote", "ใช้ได้ในตะกร้า")
    : soldOut ? t("buyer.claimTicket.footnote2", "ถูกเก็บครบแล้ว")
      : promotion.remainingClaims == null ? t("buyer.claimTicket.footnote3", "ไม่จำกัดจำนวน") : t("buyer.claimTicket.footnote4", "เหลือ {value} สิทธิ์", { value: promotion.remainingClaims.toLocaleString(intlLocale()) });

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
            {platform ? "Pegasus" : t("buyer.claimTicket.stubNote2", "โค้ดร้าน")}
          </Badge>
          <button
            type="button"
            onClick={stop(onOpenTerms)}
            disabled={!onOpenTerms}
            aria-label={t("buyer.claimTicket.ariaLabel", "เงื่อนไขโค้ด {code}", { code: promotion.code })}
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
                  <Check className="size-3.5" /> {t("buyer.claimTicket.button", "เก็บแล้ว")}
                </Button>
              ) : soldOut ? (
                <Button type="button" size="xs" variant="secondary" disabled className="h-7 shrink-0 rounded-md px-3 text-xs">
                  {t("buyer.claimTicket.button2", "หมดแล้ว")}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="xs"
                  onClick={stop(onClaim)}
                  disabled={claiming || !onClaim}
                  aria-label={t("buyer.claimTicket.ariaLabel2", "เก็บโค้ด {code}", { code: promotion.code })}
                  className={cn(
                    "h-7 shrink-0 rounded-md px-3 text-xs font-semibold",
                    !platform && "bg-teal-600 hover:bg-teal-700",
                  )}
                >
                  {claiming ? <Spinner /> : t("buyer.claimTicket.button3", "เก็บโค้ด")}
                </Button>
              )
            )}
          </div>
        </>
      }
    />
  );
}
