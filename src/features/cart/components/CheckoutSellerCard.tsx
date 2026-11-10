import { ChevronRight, TicketPercent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShippingOptionPicker } from "./ShippingOptionPicker";
import type { CartItemResponse } from "../cart.types";
import type { ShippingQuote, ShippingQuoteOption } from "../checkout.types";
import { checkoutMoney } from "../checkout.format";
import { useTranslate } from "@/lib/i18n";

interface Props {
  sellerId: number | null;
  sellerName: string;
  items: CartItemResponse[];
  quote?: ShippingQuote;
  selected?: ShippingQuoteOption;
  loading: boolean;
  failed: boolean;
  disabled: boolean;
  onSelect: (optionId: number) => void;
  promotionCode?: string | null;
  promotionDiscount?: number;
  promotionCount?: number;
  sellerGrandTotal?: number | null;
  previewReady?: boolean;
  promotionError?: string | null;
  onOpenPromotions?: () => void;
}

export function CheckoutSellerCard({
  sellerId,
  sellerName,
  items,
  quote,
  selected,
  loading,
  failed,
  disabled,
  onSelect,
  promotionCode,
  promotionDiscount = 0,
  promotionCount = 0,
  sellerGrandTotal,
  previewReady = false,
  promotionError,
  onOpenPromotions,
}: Props) {
  const { t } = useTranslate("buyer");
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="checkout-seller gap-4 rounded-xl border border-border bg-card p-5 shadow-none ring-0" aria-label={t("checkout.seller.aria", "ร้าน {name}", { name: sellerName })}>
      <header className="flex items-center gap-2.5">
        <span aria-hidden="true" className="checkout-seller-avatar">
          {sellerName.trim().slice(0, 2).toUpperCase()}
        </span>
        <h2 className="min-w-0 flex-1 text-sm font-semibold">{sellerName}</h2>
        <span className="shrink-0 text-xs text-muted-foreground">{t("checkout.seller.itemCount", "{count} รายการ", { count: items.length })}</span>
      </header>

      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <div className="checkout-item-thumb">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.productName || t("checkout.seller.productAlt", "สินค้า")}
                className="h-full w-full object-contain"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-snug">
              {item.productName || t("cart.common.listingFallback", "Listing #{id}", { id: item.listingId })}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {[item.variantLabel, item.condition, `×${item.quantity}`].filter(Boolean).join(" · ")}
            </p>
          </div>
          <span className="shrink-0 text-[13px] font-semibold">
            {checkoutMoney((item.currentPrice ?? item.unitPriceAtAdd) * item.quantity)}
          </span>
        </div>
      ))}

      <Separator className="checkout-divider" />

      <ShippingOptionPicker
        sellerName={sellerName}
        itemCount={quote?.itemCount ?? count}
        quote={quote}
        selected={selected}
        loading={loading}
        failed={failed}
        disabled={disabled}
        onSelect={onSelect}
      />

      {onOpenPromotions && (
        <>
          {promotionCode ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-teal-600/40 bg-teal-50 dark:bg-teal-950/30 px-3 py-2.5 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <TicketPercent className="size-[18px] shrink-0 text-teal-700 dark:text-teal-400" />
                <div className="min-w-0">
                  <span className="block truncate font-semibold text-teal-700 dark:text-teal-400">
                    {t("cart.code.shopCode", "โค้ดร้าน · {code}", { code: promotionCode })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {promotionDiscount > 0 && (
                  <strong className="font-semibold text-teal-700 dark:text-teal-400">
                    − {checkoutMoney(promotionDiscount)}
                  </strong>
                )}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={onOpenPromotions}
                >
                  {t("cart.code.change", "เปลี่ยน")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onOpenPromotions}
              className="h-auto w-full justify-between gap-2 rounded-lg px-3 py-2.5 text-xs font-normal hover:border-teal-700"
            >
              <div className="flex min-w-0 items-center gap-2">
                <TicketPercent className="size-[18px] shrink-0 text-teal-700 dark:text-teal-400" />
                <span className="font-medium text-foreground">{t("cart.code.shop", "โค้ดร้าน")}</span>
                {promotionCount > 0 && (
                  <Badge variant="secondary" className="rounded-full bg-teal-700/10 text-[11px] text-teal-700 dark:text-teal-400">
                    {t("checkout.seller.codeCount", "มี {count} โค้ดที่ใช้ได้", { count: promotionCount })}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-primary">
                <span className="text-xs font-medium">{t("cart.code.pickOrType", "เลือกหรือกรอกโค้ด")}</span>
                <ChevronRight className="size-4" />
              </div>
            </Button>
          )}
        </>
      )}

      {promotionError && (
        <p role="alert" className="text-xs text-destructive">
          {promotionError}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-xs text-muted-foreground">{t("checkout.seller.total", "รวมร้านนี้ ({count} ใบ)", { count })}</span>
        <span className="text-sm font-semibold">
          {!loading && !failed && selected && sellerId != null && previewReady && sellerGrandTotal != null
            ? checkoutMoney(sellerGrandTotal)
            : "—"}
        </span>
      </div>
    </Card>
  );
}
