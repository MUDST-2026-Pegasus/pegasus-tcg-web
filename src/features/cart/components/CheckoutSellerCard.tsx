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
}

export function CheckoutSellerCard({ sellerId, sellerName, items, quote, selected, loading, failed, disabled, onSelect }: Props) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = quote?.itemsSubtotal ?? items.reduce((sum, item) => sum + (item.currentPrice ?? item.unitPriceAtAdd) * item.quantity, 0);
  return (
    <Card className="checkout-panel checkout-seller" aria-label={`ร้าน ${sellerName}`}>
      <header className="flex items-center gap-2.5">
        <span aria-hidden="true" className="checkout-seller-avatar">{sellerName.trim().slice(0, 2).toUpperCase()}</span>
        <h2 className="min-w-0 flex-1 text-sm font-semibold">{sellerName}</h2>
        <span className="shrink-0 text-xs text-muted-foreground">{items.length} รายการ</span>
      </header>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <div className="checkout-item-thumb">
            {item.imageUrl && <img src={item.imageUrl} alt={item.productName || "สินค้า"} className="h-full w-full object-contain" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-snug">{item.productName || `Listing #${item.listingId}`}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{[item.variantLabel, item.condition, `×${item.quantity}`].filter(Boolean).join(" · ")}</p>
          </div>
          <span className="shrink-0 text-[13px] font-semibold">{checkoutMoney((item.currentPrice ?? item.unitPriceAtAdd) * item.quantity)}</span>
        </div>
      ))}
      <Separator className="checkout-divider" />
      <ShippingOptionPicker sellerName={sellerName} itemCount={quote?.itemCount ?? count}
        quote={quote} selected={selected} loading={loading} failed={failed} disabled={disabled} onSelect={onSelect} />
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-xs text-muted-foreground">รวมร้านนี้ ({count} ใบ)</span>
        <span className="text-sm font-semibold">{!loading && !failed && selected && sellerId != null ? checkoutMoney(subtotal + selected.fee) : "—"}</span>
      </div>
    </Card>
  );
}
