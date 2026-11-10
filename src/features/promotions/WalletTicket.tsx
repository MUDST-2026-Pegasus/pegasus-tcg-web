import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { checkoutMoney, formatPromotionDate, formatPromotionValue } from "@/features/cart/checkout.format";
import { cn } from "@/lib/utils";
import { PromotionTicketFrame } from "./PromotionTicketFrame";
import { daysUntil, isExpiringSoon, walletRuleSummary } from "./claim.format";
import type { WalletCode, WalletTab } from "./claim.types";
import { useTranslate, translate } from "@/lib/i18n";

// @tolgee-key {"key":"buyer.walletTicket.EXPIRED","ns":"promotions","defaultValue":"หมดอายุแล้ว"}
// @tolgee-key {"key":"buyer.walletTicket.PAUSED","ns":"promotions","defaultValue":"ถูกระงับชั่วคราว"}
// @tolgee-key {"key":"buyer.walletTicket.USEDUP","ns":"promotions","defaultValue":"สิทธิ์เต็มแล้ว"}

const STATUS_LABELS: Partial<Record<WalletCode["status"], string>> = {
  get EXPIRED() { return translate("promotions", "buyer.walletTicket.EXPIRED", "หมดอายุแล้ว"); },
  get PAUSED() { return translate("promotions", "buyer.walletTicket.PAUSED", "ถูกระงับชั่วคราว"); },
  get USED_UP() { return translate("promotions", "buyer.walletTicket.USEDUP", "สิทธิ์เต็มแล้ว"); },
};

export interface WalletTicketProps {
  code: WalletCode;
  tab: WalletTab;
  onOpenTerms?: () => void;
}

/** W1: a code in "โค้ดของฉัน" with ช้อปเลย (Pegasus) or ไปที่ร้าน (shop code). */
export function WalletTicket({ code, tab, onOpenTerms }: WalletTicketProps) {
  const { t } = useTranslate("promotions");
  const platform = code.ownerType === "PLATFORM";
  const muted = tab !== "AVAILABLE";
  const soon = tab === "AVAILABLE" && isExpiringSoon(code.endsAt);
  const days = daysUntil(code.endsAt);
  const target = platform ? "/products" : code.shop ? `/u/${encodeURIComponent(code.shop.username)}` : null;

  const footnote = (() => {
    if (tab === "USED") {
      const use = code.uses[0];
      return use
        ? t("buyer.walletTicket.text2", "ใช้กับ {orderNumber} · ลด {value}{value3}", { orderNumber: use.orderNumber, value: checkoutMoney(use.amount), value3: code.uses.length > 1 ? t("buyer.walletTicket.text", " (+{value} คำสั่งซื้อ)", { value: code.uses.length - 1 }) : "" })
        : t("buyer.walletTicket.text3", "ใช้แล้ว");
    }
    if (tab === "EXPIRED") return `${STATUS_LABELS[code.status] ?? t("buyer.walletTicket.text4", "ใช้ไม่ได้แล้ว")} · ${formatPromotionDate(code.endsAt)}`;
    if (code.status === "SCHEDULED") return t("buyer.walletTicket.text5", "เริ่มใช้ได้ {value}", { value: formatPromotionDate(code.startsAt) });
    if (soon && days != null) return t("buyer.walletTicket.text6", "หมดอายุใน {days} วัน", { days });
    return t("buyer.walletTicket.text8", "ใช้ได้ถึง {value}{value2}", { value: formatPromotionDate(code.endsAt), value2: code.usesLeft > 0 ? t("buyer.walletTicket.text7", " · ใช้ได้อีก {usesLeft} ครั้ง", { usesLeft: code.usesLeft }) : "" });
  })();

  return (
    <PromotionTicketFrame
      variant={platform ? "platform" : "shop"}
      scallopOffsets={[-29, -11, 7, 25]}
      onClick={onOpenTerms}
      className={cn(onOpenTerms && "cursor-pointer", muted && "bg-muted/30")}
      stubClassName={muted ? "from-zinc-500 via-zinc-400 to-zinc-300" : undefined}
      stub={
        <>
          {code.discountType !== "FREE_SHIPPING" && <span className="text-[10px] text-white/80">{t("buyer.walletTicket.span", "ลด")}</span>}
          <strong className="text-[22px] font-black leading-7">{formatPromotionValue(code)}</strong>
          <small className="text-[8px] font-semibold uppercase tracking-[0.12em] text-white/80">
            {platform ? "PEGASUS" : "SHOP"}
          </small>
        </>
      }
      bodyClassName="gap-0.5 pr-4"
      body={
        <>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={!onOpenTerms}
              onClick={(event: MouseEvent) => { event.stopPropagation(); onOpenTerms?.(); }}
              aria-label={t("buyer.walletTicket.ariaLabel", "เงื่อนไขโค้ด {code}", { code: code.code })}
              className={cn(
                "truncate text-left text-sm font-bold tracking-[0.04em] disabled:cursor-default",
                muted ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {code.code}
            </button>
            {tab === "AVAILABLE" && target && (
              <Button
                size="xs"
                variant="outline"
                nativeButton={false}
                onClick={(event: MouseEvent) => event.stopPropagation()}
                render={<Link to={target} />}
                className={cn(
                  "h-5 shrink-0 rounded-full px-2.5 text-[10px] font-semibold",
                  platform ? "border-primary text-primary" : "border-teal-600 text-teal-700",
                )}
              >
                {platform ? t("buyer.walletTicket.button", "ช้อปเลย") : t("buyer.walletTicket.button2", "ไปที่ร้าน")}
              </Button>
            )}
          </div>
          <span className={cn("truncate text-xs", muted ? "text-muted-foreground" : "text-foreground/75")}>
            {walletRuleSummary(code)}
          </span>
          <span className={cn("truncate text-[11px]", soon ? "font-medium text-orange-600" : "text-muted-foreground")}>
            {footnote}
          </span>
        </>
      }
    />
  );
}
