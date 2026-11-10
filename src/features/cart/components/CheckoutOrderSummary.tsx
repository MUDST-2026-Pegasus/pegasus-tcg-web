import { formatSaleBaht } from "@/components/sale";
import { CHECKOUT_CARD_CLASS } from "@/features/cart/checkout.styles";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { checkoutMoney } from "../checkout.format";
import type { CartItemResponse } from "../cart.types";
import type { ShippingQuote, ShippingQuoteOption } from "../checkout.types";
import type { PromoPreview, PromotionSelection } from "../promotions.types";
import { useTranslate } from "@/lib/i18n";

interface SellerSummaryGroup {
  sellerId: number | null;
  items: CartItemResponse[];
  quote: ShippingQuote | undefined;
}

interface CheckoutOrderSummaryProps {
  itemCount: number;
  subtotal: number;
  /** ราคาสินค้า (ก่อนลด) / ส่วนลดราคาสินค้า จาก pricing ของ API (TCG-683) — แยกจากโค้ด */
  saleTotals?: { listTotal: number; saleDiscount: number };
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
  saleTotals,
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
  const { t } = useTranslate("buyer");
  return (
    <Card className={CHECKOUT_CARD_CLASS}>
      <h2 className="text-[15px] font-semibold">{t("cart.summary.title", "สรุปคำสั่งซื้อ")}</h2>

      {saleTotals && saleTotals.saleDiscount > 0 && (
        <>
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-muted-foreground">{t("cart.summary.listTotal", "ราคาสินค้า (ก่อนลด)")}</span>
            <span>{checkoutMoney(saleTotals.listTotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-muted-foreground">{t("cart.summary.saleDiscount", "ส่วนลดราคาสินค้า")}</span>
            <span className="text-[#dc2626]">−{formatSaleBaht(saleTotals.saleDiscount)}</span>
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="text-muted-foreground">{t("cart.summary.itemsSubtotal", "ยอดสินค้า ({count} ใบ)", { count: itemCount })}</span>
        <span>
          {previewReady ? checkoutMoney(preview!.itemsSubtotal) : checkoutMoney(subtotal)}
        </span>
      </div>

      <div
        className="flex items-center justify-between gap-3 text-[13px]"
        aria-live="polite"
      >
        <span className="text-muted-foreground">{t("cart.summary.shipping", "ค่าจัดส่ง")}</span>
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
                {quote?.sellerName || items[0]?.sellerName || t("cart.common.shop", "ร้านค้า")}
                {option ? ` · ${option.name}` : ""}
              </span>
              <span
                className={`shrink-0 ${
                  authoritativeFee === 0 ? "checkout-free" : "text-muted-foreground"
                }`}
              >
                {shippingReady && option && authoritativeFee != null
                  ? authoritativeFee === 0
                    ? t("cart.common.freeShipping", "ส่งฟรี")
                    : checkoutMoney(authoritativeFee)
                  : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {!!preview?.sellerDiscountTotal && preview.sellerDiscountTotal > 0 && (
        <div className="flex justify-between text-[13px]">
          <span className="text-foreground/75">{t("cart.summary.shopDiscount", "ส่วนลดร้าน")}</span>
          <span className="font-medium text-teal-700 dark:text-teal-400">
            − {checkoutMoney(preview.sellerDiscountTotal)}
          </span>
        </div>
      )}

      {!!preview?.sellers && preview.sellerDiscountTotal > 0 && (
        <div className="grid gap-1 pl-3 text-xs">
          {preview.sellers
            .filter((seller) => seller.sellerDiscount > 0)
            .map((seller) => {
              const code = promotionSelection.sellerCodes[seller.sellerProfileId];
              return (
                <div key={seller.sellerProfileId} className="flex justify-between">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {seller.sellerName}
                    {code ? ` (${code})` : ""}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    − {checkoutMoney(seller.sellerDiscount)}
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {!!preview?.platformDiscountTotal && preview.platformDiscountTotal > 0 && (
        <div className="flex justify-between text-[13px]">
          <span className="text-foreground/75">
            {t("cart.summary.platformDiscount", "ส่วนลด Pegasus")}
            {appliedPlatformCode ? ` · ${appliedPlatformCode}` : ""}
          </span>
          <span className="font-medium text-primary">
            − {checkoutMoney(preview.platformDiscountTotal)}
          </span>
        </div>
      )}

      <Separator className="checkout-divider" />

      <div className="flex items-center justify-between gap-3 text-lg" aria-live="polite">
        <span className="font-semibold">{t("cart.summary.total", "ยอดรวม")}</span>
        <strong data-testid="checkout-grand-total">
          {previewReady ? checkoutMoney(preview!.grandTotal) : "—"}
        </strong>
      </div>

      {!!preview && preview.sellerDiscountTotal + preview.platformDiscountTotal > 0 && (
        <p className="text-right text-xs font-semibold text-teal-700 dark:text-teal-400">
          {t("cart.summary.saving", "ประหยัดไป {amount}", { amount: checkoutMoney(preview.sellerDiscountTotal + preview.platformDiscountTotal) })}
        </p>
      )}

      <Button
        className="checkout-primary h-11 w-full cursor-pointer rounded-full text-sm font-semibold"
        disabled={!canPurchase}
        onClick={onPurchase}
      >
        {isSubmitting && <Spinner />}
        {isSubmitting ? t("checkout.summary.submitting", "กำลังสร้างคำสั่งซื้อ...") : t("checkout.summary.submit", "สั่งซื้อและไปชำระเงิน")}
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        {t("checkout.summary.shippingNote", "ค่าส่งคิดจากตัวเลือกที่เลือกของแต่ละร้าน และยืนยันอีกครั้งตอนสร้างคำสั่งซื้อ")}
      </p>

      {quotesSettledWithoutShipping && (
        <button
          type="button"
          className="checkout-link text-center text-xs"
          onClick={onReturnToCart}
        >
          {t("checkout.summary.backToCart", "กลับไปแก้ไขรายการที่เลือกในตะกร้า")}
        </button>
      )}
    </Card>
  );
}
