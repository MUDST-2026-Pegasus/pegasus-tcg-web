import { ChevronRight, TicketPercent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShippingOptionPicker } from "./ShippingOptionPicker";
import type { CartItemResponse } from "../cart.types";
import type { ShippingQuote, ShippingQuoteOption } from "../checkout.types";
import { checkoutMoney } from "../checkout.format";

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
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="checkout-seller gap-4 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-none ring-0" aria-label={`ร้าน ${sellerName}`}>
      <header className="flex items-center gap-2.5">
        <span aria-hidden="true" className="checkout-seller-avatar">
          {sellerName.trim().slice(0, 2).toUpperCase()}
        </span>
        <h2 className="min-w-0 flex-1 text-sm font-semibold">{sellerName}</h2>
        <span className="shrink-0 text-xs text-muted-foreground">{items.length} รายการ</span>
      </header>

      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <div className="checkout-item-thumb">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.productName || "สินค้า"}
                className="h-full w-full object-contain"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-snug">
              {item.productName || `Listing #${item.listingId}`}
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
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-promotion-shop-selected-border bg-promotion-shop-selected px-3 py-2.5 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <TicketPercent className="size-[18px] shrink-0 text-promotion-shop" />
                <div className="min-w-0">
                  <span className="block truncate font-semibold text-promotion-shop">
                    โค้ดร้าน · {promotionCode}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {promotionDiscount > 0 && (
                  <strong className="font-semibold text-promotion-shop">
                    − {checkoutMoney(promotionDiscount)}
                  </strong>
                )}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium cursor-pointer"
                  onClick={onOpenPromotions}
                >
                  เปลี่ยน
                </button>
              </div>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={onOpenPromotions}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenPromotions?.();
                }
              }}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs transition-colors hover:border-promotion-shop"
            >
              <div className="flex min-w-0 items-center gap-2">
                <TicketPercent className="size-[18px] shrink-0 text-promotion-shop" />
                <span className="font-medium text-foreground">โค้ดร้าน</span>
                {promotionCount > 0 && (
                  <span className="rounded-full bg-promotion-shop/10 px-2 py-0.5 text-[11px] font-medium text-promotion-shop">
                    มี {promotionCount} โค้ดที่ใช้ได้
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-primary">
                <span className="text-xs font-medium">เลือกหรือกรอกโค้ด</span>
                <ChevronRight className="size-4" />
              </div>
            </div>
          )}
        </>
      )}

      {promotionError && (
        <p role="alert" className="text-xs text-destructive">
          {promotionError}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-xs text-muted-foreground">รวมร้านนี้ ({count} ใบ)</span>
        <span className="text-sm font-semibold">
          {!loading && !failed && selected && sellerId != null && previewReady && sellerGrandTotal != null
            ? checkoutMoney(sellerGrandTotal)
            : "—"}
        </span>
      </div>
    </Card>
  );
}
