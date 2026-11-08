import { CHECKOUT_CARD_CLASS } from "@/features/cart/checkout.styles";
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useAddresses } from "@/features/account/address.queries";
import { cartKeys, useAcceptCartPrices, useRemoveCartItem } from "../cart.queries";
import { SaleQuotaDialog } from "@/features/sale/components/SaleBuyerDialogs";
import { cartSaleTotals } from "@/features/sale/sale.cart";
import { CheckoutAddressSummary } from "../components/CheckoutAddressSummary";
import { CheckoutAddressPicker } from "../components/CheckoutAddressPicker";
import { CheckoutPlatformPromotionCard } from "../components/CheckoutPlatformPromotionCard";
import { CheckoutOrderSummary } from "../components/CheckoutOrderSummary";
import { CheckoutErrorAlert } from "../components/CheckoutErrorAlert";
import { CheckoutSellerList } from "../components/CheckoutSellerList";
import { CheckoutPromotionDialogs } from "../components/CheckoutPromotionDialogs";
import { CheckoutCartError, CheckoutEmpty, CheckoutLoading } from "../components/CheckoutStatusScreens";
import { useCheckoutPromotions } from "../useCheckoutPromotions";
import { useCheckoutData, useCheckoutRedirects } from "../useCheckoutData";
import { useShippingSelection } from "../useShippingSelection";
import { useCheckoutSubmit } from "../useCheckoutSubmit";
import { useCheckoutErrorHandler } from "../useCheckoutErrorHandler";
import { AuctionCheckout } from "@/features/auction/components/AuctionCheckout";
import "./checkout.css";

/**
 * `/checkout` — `?auction={id}` เป็นโหมดประมูล (การ์ดใบเดียวที่ชนะ) [TCG-631]
 * ไม่มี = checkout จากตะกร้าแบบเดิม ทั้งสองแบบแยก component กันเพื่อให้ flow ตะกร้าไม่เปลี่ยน
 */
export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const auctionId = Number(searchParams.get("auction"));
  if (searchParams.has("auction") && Number.isSafeInteger(auctionId) && auctionId > 0) {
    return <AuctionCheckout auctionId={auctionId} />;
  }
  return <CartCheckout />;
}

function CartCheckout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasRedirected = useRef(false);
  const completed = useRef(false);
  const data = useCheckoutData();
  const {
    user,
    isAuthenticated,
    isAuthLoading,
    cart,
    isCartLoading,
    isCartFetching,
    cartError,
    checkoutItems,
    cartItemIds,
    cartNeedsReview,
    quotes,
    quotePriceChanged,
  } = data;
  const {
    data: addresses = [],
    isLoading: isAddressLoading,
    error: addressError,
    refetch: refetchAddresses,
  } = useAddresses();

  const removeCartItem = useRemoveCartItem();
  const acceptPrices = useAcceptCartPrices();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const {
    sellerGroups,
    selectedOptions,
    shippingReady,
    shippingFee,
    shippingOptionBySeller,
    setShippingChoices,
  } = useShippingSelection(checkoutItems, quotes);

  const activeAddress =
    addresses.find((address) => address.id === selectedAddressId) ??
    addresses.find((address) => address.defaultShipping) ??
    addresses[0] ??
    null;

  const promotions = useCheckoutPromotions({
    checkoutItems,
    cartItemIds,
    cartNeedsReview,
    shippingOptionBySeller,
    shippingReady,
    userId: user?.id,
    cartId: cart?.id,
  });
  const {
    promotionSelection,
    setPromotionPicker,
    typedPlatformCode,
    setTypedPlatformCode,
    platformError,
    setPlatformError,
    promotionList,
    promoPreview,
    preview,
    previewReady,
    appliedPlatformCode,
    appliedPlatformPromotion,
    setCode,
  } = promotions;

  const subtotal = sellerGroups.reduce(
    (sum, { items, quote }) =>
      sum +
      (quote?.itemsSubtotal ??
        items.reduce(
          (total, item) =>
            total +
            (item.currentPrice ?? item.unitPriceAtAdd) * item.quantity,
          0,
        )),
    0,
  );

  const itemCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  // ราคาสินค้า (ก่อนลด) / ส่วนลดราคาสินค้า แยกจากโค้ด (Figma SAL-B3 D)
  const saleTotals = cartSaleTotals(checkoutItems);

  const {
    handleError,
    shippingNotice,
    promotionChanged,
    setPromotionChanged,
    quotaItem,
    setQuotaItem,
  } = useCheckoutErrorHandler({
    sellerGroups,
    checkoutItems,
    promotionSelection,
    setShippingChoices,
    refetchQuotes: quotes.refetch,
    refetchPreview: promoPreview.refetch,
    setSelectedAddressId,
    setAddressPickerOpen,
    hasRedirectedRef: hasRedirected,
  });

  const readyToPurchase =
    shippingReady &&
    previewReady &&
    !promoPreview.isError &&
    !promoPreview.isFetching &&
    !!activeAddress &&
    !isAddressLoading &&
    !addressError &&
    !cartError &&
    !isCartFetching &&
    isAuthenticated &&
    !cartNeedsReview;

  const { submit: handlePurchase, isSubmitting } = useCheckoutSubmit({
    canPurchase: readyToPurchase,
    buildPayload: () => ({
      cartItemIds,
      shippingAddressId: activeAddress!.id,
      shippingOptionBySeller,
      platformCode: promotionSelection.platformCode,
      sellerCodes: promotionSelection.sellerCodes,
      expectedGrandTotal: preview!.grandTotal,
    }),
    completedRef: completed,
    onError: handleError,
  });
  const canPurchase = readyToPurchase && !isSubmitting;

  useCheckoutRedirects({
    data,
    hasRedirectedRef: hasRedirected,
    completedRef: completed,
  });

  if (isAuthLoading || isCartLoading) return <CheckoutLoading />;
  if (!isAuthenticated) return null;
  if (cartNeedsReview || quotePriceChanged) return null;
  if (cartError) {
    return (
      <CheckoutCartError
        onRetry={() => void queryClient.invalidateQueries({ queryKey: cartKeys.all })}
      />
    );
  }
  if (!checkoutItems.length) return <CheckoutEmpty onBackToCart={() => navigate("/cart")} />;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <header className="mb-6">
          <h1 className="text-[26px] font-bold leading-tight">ตรวจสอบและสั่งซื้อ</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            เลือกวิธีจัดส่งและโค้ดส่วนลดของแต่ละร้าน
          </p>
        </header>

        <div className="checkout-columns">
          <div className="flex min-w-0 flex-col gap-4">
            {shippingNotice && (
              <div role="alert" className="checkout-alert checkout-alert-warning">
                <p className="font-semibold">
                  ตัวเลือกการจัดส่งของ {shippingNotice} มีการเปลี่ยนแปลง
                </p>
                <p>เราเลือกวิธีจัดส่งให้ใหม่แล้ว โปรดตรวจสอบค่าส่งและยอดรวมอีกครั้ง</p>
              </div>
            )}

            {quotes.isError && (
              <CheckoutErrorAlert
                title="โหลดตัวเลือกจัดส่งไม่สำเร็จ"
                error={quotes.error}
                actions={[
                  { label: "ลองอีกครั้ง", onClick: () => void quotes.refetch() },
                  { label: "กลับไปตรวจสอบตะกร้า", onClick: () => navigate("/cart") },
                ]}
              />
            )}

            {promoPreview.isError && (
              <CheckoutErrorAlert
                title="คำนวณส่วนลดและยอดรวมไม่สำเร็จ"
                error={promoPreview.error}
                actions={[
                  { label: "ลองอีกครั้ง", onClick: () => void promoPreview.refetch() },
                ]}
              />
            )}

            <CheckoutSellerList
              sellerGroups={sellerGroups}
              selectedOptions={selectedOptions}
              shippingLoading={quotes.isPending || quotes.isFetching}
              shippingFailed={quotes.isError}
              disabled={isSubmitting}
              onSelectShipping={(sellerId, id) =>
                setShippingChoices((previous) => ({ ...previous, [sellerId]: id }))
              }
              promotions={promotions}
            />
          </div>

          <aside className="flex min-w-0 flex-col gap-4" aria-label="สรุปคำสั่งซื้อ">
            <CheckoutAddressSummary
              address={activeAddress}
              loading={isAddressLoading}
              error={!!addressError}
              disabled={isSubmitting}
              onChange={() => setAddressPickerOpen(true)}
              onRetry={() => void refetchAddresses()}
            />

            <Card className={`${CHECKOUT_CARD_CLASS} text-[13px]`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">วิธีชำระเงิน</h2>
                <span className="text-muted-foreground">โอนผ่าน PromptPay</span>
              </div>
            </Card>

            <CheckoutPlatformPromotionCard
              selectedCode={promotionSelection.platformCode}
              selectedPromotion={appliedPlatformPromotion ?? null}
              discount={preview?.platformDiscountTotal ?? 0}
              availableCount={
                promotionList.data?.filter(
                  (promotion) => promotion.ownerType === "PLATFORM",
                ).length ?? 0
              }
              typedCode={typedPlatformCode}
              error={platformError}
              loading={promoPreview.isFetching}
              onTypedCodeChange={(code) => {
                setTypedPlatformCode(code);
                if (platformError) setPlatformError(null);
              }}
              onApplyTypedCode={() => {
                if (!typedPlatformCode.trim()) return;
                setCode("PLATFORM", typedPlatformCode);
                setTypedPlatformCode("");
              }}
              onRemoveCode={() => setCode("PLATFORM", null)}
              onOpenPicker={() => setPromotionPicker("PLATFORM")}
            />

            <CheckoutOrderSummary
              itemCount={itemCount}
              subtotal={subtotal}
              saleTotals={saleTotals}
              shippingFee={shippingFee}
              shippingReady={shippingReady}
              previewReady={previewReady}
              preview={preview}
              sellerGroups={sellerGroups}
              selectedOptions={selectedOptions}
              promotionSelection={promotionSelection}
              appliedPlatformCode={appliedPlatformCode}
              canPurchase={canPurchase}
              isSubmitting={isSubmitting}
              quotesSettledWithoutShipping={
                !quotes.isPending &&
                !quotes.isFetching &&
                !quotes.isError &&
                !shippingReady
              }
              onPurchase={() => void handlePurchase()}
              onReturnToCart={() => navigate("/cart")}
            />
          </aside>
          <SaleQuotaDialog
            open={quotaItem !== null}
            productName={quotaItem?.productName || "สินค้านี้"}
            salePrice={quotaItem?.pricing?.salePrice ?? null}
            listPrice={quotaItem?.pricing?.listPrice ?? null}
            pending={removeCartItem.isPending || acceptPrices.isPending}
            onClose={() => setQuotaItem(null)}
            onRemove={() => quotaItem && removeCartItem.mutate(quotaItem.id, { onSettled: () => setQuotaItem(null) })}
            onBuyAtListPrice={() => quotaItem && acceptPrices.mutate([quotaItem.id], { onSettled: () => setQuotaItem(null) })}
          />
        </div>

        <CheckoutAddressPicker
          addresses={addresses}
          selectedId={activeAddress?.id ?? null}
          onSelect={setSelectedAddressId}
          open={addressPickerOpen}
          onOpenChange={setAddressPickerOpen}
        />

        <CheckoutPromotionDialogs
          promotions={promotions}
          sellerGroups={sellerGroups}
          promotionChanged={promotionChanged}
          onClosePromotionChanged={() => setPromotionChanged(null)}
          onConfirmNewTotal={() => void handlePurchase()}
        />
      </div>
    </div>
  );
}
