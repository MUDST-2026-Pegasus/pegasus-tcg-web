import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { checkoutMoney } from "../checkout.format";
import type { CartItemResponse } from "../cart.types";
import type { ShippingQuote, ShippingQuoteOption } from "../checkout.types";
import type { PromoPreview, PromotionSelection } from "../promotions.types";

interface SellerSummaryGroup {
  sellerId: number | null;
  items: CartItemResponse[];
  quote: ShippingQuote | undefined;
}

interface CheckoutOrderSummaryProps {
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  shippingReady: boolean;
  previewReady: boolean;
  preview: PromoPreview | undefined;
  sellerGroups: SellerSummaryGroup[];
  selectedOptions: Array<ShippingQuoteOption | undefined>;
  promotionSelection: PromotionSelection;
  appliedPlatformCode: string | undefined;
  canPurchase: boolean;
  isSubmitting: boolean;
  quotesSettledWithoutShipping: boolean;
  onPurchase: () => void;
  onReturnToCart: () => void;
}

export function CheckoutOrderSummary({
  itemCount,
  subtotal,
  shippingFee,
  shippingReady,
  previewReady,
  preview,
  sellerGroups,
  selectedOptions,
  promotionSelection,
  appliedPlatformCode,
  canPurchase,
  isSubmitting,
  quotesSettledWithoutShipping,
  onPurchase,
  onReturnToCart,
}: CheckoutOrderSummaryProps) {
  return (
    <Card className="checkout-panel gap-3">
      <h2 className="text-[15px] font-semibold">สรุปคำสั่งซื้อ</h2>

      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="text-muted-foreground">ยอดสินค้า ({itemCount} ใบ)</span>
        <span>
          {previewReady ? checkoutMoney(preview!.itemsSubtotal) : checkoutMoney(subtotal)}
        </span>
      </div>

      <div
        className="flex items-center justify-between gap-3 text-[13px]"
        aria-live="polite"
      >
        <span className="text-muted-foreground">ค่าจัดส่ง</span>
        <span>
          {previewReady && preview?.shippingTotal != null
            ? checkoutMoney(preview.shippingTotal)
            : shippingReady
              ? checkoutMoney(shippingFee)
              : "—"}
        </span>
      </div>

      <div className="grid gap-1.5 pl-3">
        {sellerGroups.map(({ sellerId, items, quote }, index) => {
          const option = selectedOptions[index];
          const sellerPreview =
            sellerId == null
              ? null
              : preview?.sellers.find(
                  (seller) => seller.sellerProfileId === sellerId,
                ) ?? null;
          const authoritativeFee = previewReady
            ? sellerPreview?.shippingFee ?? null
            : option?.fee ?? null;

          return (
            <div
              key={sellerId ?? "unknown"}
              className="flex items-start justify-between gap-3 text-xs"
            >
              <span className="min-w-0 text-muted-foreground">
                {quote?.sellerName || items[0]?.sellerName || "ร้านค้า"}
                {option ? ` · ${option.name}` : ""}
              </span>
              <span
                className={`shrink-0 ${
                  authoritativeFee === 0 ? "checkout-free" : "text-muted-foreground"
                }`}
              >
                {shippingReady && option && authoritativeFee != null
                  ? authoritativeFee === 0
                    ? "ส่งฟรี"
                    : checkoutMoney(authoritativeFee)
                  : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {!!preview?.sellerDiscountTotal && preview.sellerDiscountTotal > 0 && (
        <div className="flex justify-between text-[13px] text-teal-700">
          <span>ส่วนลดร้าน</span>
          <span>− {checkoutMoney(preview.sellerDiscountTotal)}</span>
        </div>
      )}

      {!!preview?.sellers && preview.sellerDiscountTotal > 0 && (
        <div className="grid gap-1 pl-3 text-xs text-teal-700">
          {preview.sellers
            .filter((seller) => seller.sellerDiscount > 0)
            .map((seller) => {
              const code = promotionSelection.sellerCodes[seller.sellerProfileId];
              return (
                <div key={seller.sellerProfileId} className="flex justify-between">
                  <span className="min-w-0 truncate text-teal-800">
                    {seller.sellerName}
                    {code ? ` (${code})` : ""}
                  </span>
                  <span className="shrink-0 font-medium">
                    − {checkoutMoney(seller.sellerDiscount)}
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {!!preview?.platformDiscountTotal && preview.platformDiscountTotal > 0 && (
        <div className="flex justify-between text-[13px] text-blue-700">
          <span>
            ส่วนลด Pegasus
            {appliedPlatformCode ? ` · ${appliedPlatformCode}` : ""}
          </span>
          <span>− {checkoutMoney(preview.platformDiscountTotal)}</span>
        </div>
      )}

      <Separator className="checkout-divider" />

      <div className="flex items-center justify-between gap-3 text-lg" aria-live="polite">
        <span className="font-semibold">ยอดรวม</span>
        <strong data-testid="checkout-grand-total">
          {previewReady ? checkoutMoney(preview!.grandTotal) : "—"}
        </strong>
      </div>

      {!!preview && preview.sellerDiscountTotal + preview.platformDiscountTotal > 0 && (
        <p className="text-right text-xs font-semibold text-teal-700">
          ประหยัดไป{" "}
          {checkoutMoney(
            preview.sellerDiscountTotal + preview.platformDiscountTotal,
          )}
        </p>
      )}

      <Button
        className="checkout-primary h-11 w-full cursor-pointer rounded-full text-sm font-semibold"
        disabled={!canPurchase}
        onClick={onPurchase}
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? "กำลังสร้างคำสั่งซื้อ..." : "สั่งซื้อและไปชำระเงิน"}
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        ค่าส่งคิดจากตัวเลือกที่เลือกของแต่ละร้าน และยืนยันอีกครั้งตอนสร้างคำสั่งซื้อ
      </p>

      {quotesSettledWithoutShipping && (
        <button
          type="button"
          className="checkout-link text-center text-xs"
          onClick={onReturnToCart}
        >
          กลับไปแก้ไขรายการที่เลือกในตะกร้า
        </button>
      )}
    </Card>
  );
}
