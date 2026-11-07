import { translate, useLanguage } from "@/lib/language";
import { CHECKOUT_CARD_CLASS } from "@/features/cart/checkout.styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FormPageSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/features/auth/auth.queries";
import { useAddresses, addressKeys } from "@/features/account/address.queries";
import { useCart, useShippingQuotes, cartKeys, useAcceptCartPrices, useRemoveCartItem } from "../cart.queries";
import { SaleQuotaDialog } from "@/features/sale/components/SaleBuyerDialogs";
import { cartSaleTotals } from "@/features/sale/sale.cart";
import { notifyBuyerLimit, quotaListingId } from "@/features/sale/sale.notify";
import { checkoutApi } from "../checkout.api";
import { CheckoutSellerCard } from "../components/CheckoutSellerCard";
import { CheckoutAddressSummary } from "../components/CheckoutAddressSummary";
import { findPromotionOwnerForCode } from "../checkout.format";
import { CheckoutAddressPicker } from "../components/CheckoutAddressPicker";
import { CodePickerDialog } from "@/features/promotions/CodePickerDialog";
import { PromotionChangedDialog } from "../components/PromotionChangedDialog";
import { CheckoutPlatformPromotionCard } from "../components/CheckoutPlatformPromotionCard";
import { CheckoutOrderSummary } from "../components/CheckoutOrderSummary";
import { useCheckoutPromotions } from "../useCheckoutPromotions";
import { clearPromotionSelection } from "../promotions.storage";
import type { CartItemResponse } from "../cart.types";
import { AuctionCheckout } from "@/features/auction/components/AuctionCheckout";
import "./checkout.css";

interface CheckoutLocationState {
  selectedCartItemIds?: number[];
}

/**
 * `/checkout` — `?auction={id}` เป็นโหมดประมูล (การ์ดใบเดียวที่ชนะ) [TCG-631]
 * ไม่มี = checkout จากตะกร้าแบบเดิม ทั้งสองแบบแยก component กันเพื่อให้ flow ตะกร้าไม่เปลี่ยน
 */
export function CheckoutPage() {
  useLanguage();
  const [searchParams] = useSearchParams();
  const auctionId = Number(searchParams.get("auction"));
  if (searchParams.has("auction") && Number.isSafeInteger(auctionId) && auctionId > 0) {
    return <AuctionCheckout auctionId={auctionId} />;
  }
  return <CartCheckout />;
}

function CartCheckout() {
  useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const hasRedirected = useRef(false);
  const completed = useRef(false);
  const submitting = useRef(false);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const {
    data: cart,
    isLoading: isCartLoading,
    isFetching: isCartFetching,
    error: cartError,
  } = useCart();
  const {
    data: addresses = [],
    isLoading: isAddressLoading,
    error: addressError,
    refetch: refetchAddresses,
  } = useAddresses();

  const targetItemIds = useMemo(() => {
    const params = searchParams.getAll("items");
    const state = location.state as CheckoutLocationState | null;
    const raw = params.length
      ? params.flatMap((p) => p.split(",").map(Number))
      : state?.selectedCartItemIds ?? [];
    return [...new Set(raw.filter((id) => Number.isInteger(id) && id > 0))];
  }, [searchParams, location.state]);

  const targetProductId = Number(searchParams.get("productId"));
  const targetListingId = Number(searchParams.get("listingId"));

  const [quotaItem, setQuotaItem] = useState<CartItemResponse | null>(null);
  const removeCartItem = useRemoveCartItem();
  const acceptPrices = useAcceptCartPrices();
  const checkoutItems = useMemo(() => {
    const items = cart?.items ?? [];
    if (targetItemIds.length) {
      return items.filter((item) => targetItemIds.includes(item.id));
    }
    if (targetProductId > 0 && targetListingId > 0) {
      return items.filter(
        (item) =>
          item.productId === targetProductId && item.listingId === targetListingId,
      );
    }
    return [];
  }, [cart, targetItemIds, targetProductId, targetListingId]);

  const hasPriceChanges = checkoutItems.some((item) => item.priceChanged);
  const hasUnavailableItems = checkoutItems.some((item) => !item.purchasable);
  const cartNeedsReview = hasPriceChanges || hasUnavailableItems;
  const cartItemIds = useMemo(() => checkoutItems.map((item) => item.id), [checkoutItems]);

  const quotes = useShippingQuotes(cartItemIds, {
    userId: user?.id,
    cartId: cart?.id,
    items: checkoutItems,
    enabled:
      isAuthenticated &&
      !isAuthLoading &&
      !isCartLoading &&
      !isCartFetching &&
      !cartError &&
      !cartNeedsReview &&
      checkoutItems.length > 0,
  });

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [shippingChoices, setShippingChoices] = useState<Record<number, number>>({});
  const [selectionQuotes, setSelectionQuotes] = useState(quotes.data);

  // Reconcile only fresh quotes: a removed choice must not reappear on a later refresh.
  if (quotes.data !== selectionQuotes && !quotes.isPlaceholderData) {
    setSelectionQuotes(quotes.data);
    const nextChoices: Record<number, number> = {};
    for (const quote of quotes.data ?? []) {
      const selected =
        quote.options.find(
          (option) => option.id === shippingChoices[quote.sellerProfileId],
        ) ??
        quote.options.find((option) => option.id === quote.defaultOptionId);
      if (selected) nextChoices[quote.sellerProfileId] = selected.id;
    }
    setShippingChoices(nextChoices);
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingNotice, setShippingNotice] = useState<string | null>(null);

  const [promotionChanged, setPromotionChanged] = useState<{
    previous: number;
    next: number;
    code?: string;
    owner?: "PLATFORM" | number;
  } | null>(null);

  const activeAddress =
    addresses.find((address) => address.id === selectedAddressId) ??
    addresses.find((address) => address.defaultShipping) ??
    addresses[0] ??
    null;

  const sellerGroups = useMemo(() => {
    const groups = new Map<number | null, CartItemResponse[]>();
    for (const item of checkoutItems) {
      const group = groups.get(item.sellerProfileId) ?? [];
      group.push(item);
      groups.set(item.sellerProfileId, group);
    }
    return [...groups].map(([sellerId, items]) => ({
      sellerId,
      items,
      quote: quotes.data?.find((quote) => quote.sellerProfileId === sellerId),
    }));
  }, [checkoutItems, quotes.data]);

  const selectedOptions = sellerGroups.map(
    ({ sellerId, quote }) =>
      quote?.options.find(
        (option) =>
          option.id === (sellerId == null ? undefined : shippingChoices[sellerId]),
      ) ??
      quote?.options.find((option) => option.id === quote.defaultOptionId) ??
      quote?.options[0],
  );

  const shippingReady =
    !quotes.isPending &&
    !quotes.isFetching &&
    !quotes.isPlaceholderData &&
    !quotes.isError &&
    sellerGroups.length > 0 &&
    selectedOptions.every(Boolean);

  const shippingFee = selectedOptions.reduce(
    (sum, option) => sum + (option?.fee ?? 0),
    0,
  );

  const shippingOptionBySeller: Record<number, number> = useMemo(() => {
    const map: Record<number, number> = {};
    sellerGroups.forEach(({ sellerId }, index) => {
      if (sellerId != null && selectedOptions[index]) {
        map[sellerId] = selectedOptions[index]!.id;
      }
    });
    return map;
  }, [sellerGroups, selectedOptions]);

  const {
    promotionSelection,
    promotionPicker,
    setPromotionPicker,
    typedPlatformCode,
    setTypedPlatformCode,
    platformError,
    setPlatformError,
    sellerErrors,
    pendingTypedCode,
    setPendingTypedCode,
    promotionList,
    promoPreview,
    preview,
    previewReady,
    appliedPlatformCode,
    appliedPlatformPromotion,
    sellerDiscounts,
    setCode,
  } = useCheckoutPromotions({
    checkoutItems,
    cartItemIds,
    cartNeedsReview,
    shippingOptionBySeller,
    shippingReady,
    userId: user?.id,
    cartId: cart?.id,
  });

  const promotionStoreUsername =
    promotionPicker == null || promotionPicker === "PLATFORM"
      ? undefined
      : sellerGroups
          .find((group) => group.sellerId === promotionPicker)
          ?.items.find((item) => item.sellerUsername)?.sellerUsername ?? undefined;

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

  const canPurchase =
    shippingReady &&
    previewReady &&
    !promoPreview.isError &&
    !promoPreview.isFetching &&
    !!activeAddress &&
    !isAddressLoading &&
    !addressError &&
    !cartError &&
    !isCartFetching &&
    !isSubmitting &&
    isAuthenticated &&
    !cartNeedsReview;

  const quotePriceChanged =
    quotes.error instanceof ApiError &&
    (quotes.error.code === "CART_PRICE_CHANGED" ||
      quotes.error.code === "PRICE_CHANGED");

  useEffect(() => {
    if (
      !isAuthLoading &&
      isAuthenticated &&
      !isCartLoading &&
      !isCartFetching &&
      !cartError &&
      (cartNeedsReview || quotePriceChanged) &&
      !hasRedirected.current &&
      !completed.current
    ) {
      hasRedirected.current = true;
      if (quotePriceChanged) void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      toast.add({
        title:
          hasPriceChanges || quotePriceChanged
            ? translate("ราคาสินค้ามีการเปลี่ยนแปลง", "Item prices have changed")
            : translate("สินค้าบางรายการไม่พร้อมจำหน่าย", "Some items are unavailable"),
        description:
          hasPriceChanges || quotePriceChanged
            ? translate("กรุณากลับไปตรวจสอบและยอมรับราคาใหม่ในตะกร้าก่อนสั่งซื้อ", "Review and accept the new prices in your cart before ordering")
            : translate("กรุณานำสินค้าออกหรือยกเลิกเลือกในตะกร้าก่อนสั่งซื้อ", "Remove or deselect the items in your cart before ordering"),
        type: "warning",
      });
      navigate("/cart", { replace: true });
    }
  }, [
    isAuthLoading,
    isAuthenticated,
    isCartLoading,
    isCartFetching,
    cartError,
    cartNeedsReview,
    hasPriceChanges,
    quotePriceChanged,
    queryClient,
    navigate,
  ]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate(
        `/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`,
        { replace: true },
      );
    }
  }, [isAuthLoading, isAuthenticated, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (
      !isAuthLoading &&
      isAuthenticated &&
      !isCartLoading &&
      !isCartFetching &&
      !cartError &&
      checkoutItems.length === 0 &&
      !hasRedirected.current &&
      !completed.current
    ) {
      hasRedirected.current = true;
      toast.add({
        title: translate("ไม่พบสินค้าที่เลือกสั่งซื้อ", "No items selected for checkout"),
        description: translate("กรุณาเลือกสินค้าที่ต้องการสั่งซื้อจากตะกร้า", "Select the items you want to order in your cart"),
        type: "warning",
      });
      navigate("/cart", { replace: true });
    }
  }, [
    isAuthLoading,
    isAuthenticated,
    isCartLoading,
    isCartFetching,
    cartError,
    checkoutItems.length,
    navigate,
  ]);

  const handlePurchase = async () => {
    if (!canPurchase || submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    const payload = {
      cartItemIds,
      shippingAddressId: activeAddress.id,
      shippingOptionBySeller,
      platformCode: promotionSelection.platformCode,
      sellerCodes: promotionSelection.sellerCodes,
      expectedGrandTotal: preview!.grandTotal,
    };
    const signature = JSON.stringify(payload);

    // Preserve the key after uncertain network failures so retrying cannot place a duplicate order.
    if (attempt.current?.signature !== signature) {
      attempt.current = { signature, key: crypto.randomUUID() };
    }

    try {
      const response = await checkoutApi.checkout(payload, attempt.current.key);
      completed.current = true;
      clearPromotionSelection();
      toast.add({
        title: translate("สร้างคำสั่งซื้อสำเร็จ", "Order placed successfully"),
        description: translate(`คำสั่งซื้อ ${response.orderNumber}`, `Order ${response.orderNumber}`),
        type: "success",
      });
      navigate(`/payment?orderId=${response.orderId}`, {
        state: { orderId: response.orderId, order: response },
      });
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status > 0 && error.status < 500) attempt.current = null;
        if (
          error.code === "SHIPPING_OPTION_INVALID" ||
          error.code === "SELLER_SHIPPING_UNAVAILABLE"
        ) {
          const changedSeller = sellerGroups.find(
            (group) => group.sellerId === Number(error.details?.sellerProfileId),
          );
          const sellerNames = changedSeller
            ? changedSeller.quote?.sellerName ||
              changedSeller.items[0]?.sellerName ||
              translate("ร้านค้า", "Shop")
            : sellerGroups
                .map(
                  (group) =>
                    group.quote?.sellerName ||
                    group.items[0]?.sellerName ||
                    translate("ร้านค้า", "Shop"),
                )
                .join(", ");
          setShippingNotice(
            error.code === "SHIPPING_OPTION_INVALID" ? sellerNames : null,
          );
          setShippingChoices((previous) => {
            if (changedSeller?.sellerId == null) return {};
            const next = { ...previous };
            delete next[changedSeller.sellerId];
            return next;
          });
          await quotes.refetch();
        } else if (
          error.code === "PROMO_CHANGED" ||
          error.code === "PROMO_USED_UP"
        ) {
          const details = error.details as Record<string, unknown> | undefined;
          const droppedCode =
            typeof details?.code === "string" ? details.code : undefined;
          const targetOwner =
            findPromotionOwnerForCode(droppedCode, promotionSelection) ?? "PLATFORM";

          setPromotionChanged({
            previous: payload.expectedGrandTotal,
            next: Number(details?.grandTotal) || payload.expectedGrandTotal,
            code: droppedCode,
            owner: targetOwner,
          });
          await promoPreview.refetch();
        } else if (
          error.code === "SHIPPING_ADDRESS_REQUIRED" ||
          error.code === "ADDRESS_NOT_FOUND"
        ) {
          setSelectedAddressId(null);
          await queryClient.invalidateQueries({ queryKey: addressKeys.all });
          setAddressPickerOpen(true);
          toast.add({
            title: translate("กรุณาเลือกที่อยู่จัดส่งอีกครั้ง", "Select your shipping address again"),
            description: translate("ที่อยู่เดิมไม่พร้อมใช้งาน", "The previous address is unavailable"),
            type: "warning",
          });
        } else if (error.code === "SALE_QUOTA_REACHED") {
          // โควตาราคา Flash เต็มระหว่างทาง → modal ให้เลือกนำออกหรือซื้อราคาปกติ (Figma SAL-M1)
          const listingId = quotaListingId(error);
          setQuotaItem(
            checkoutItems.find((item) => item.listingId === listingId) ??
              checkoutItems.find((item) => item.pricing?.sale?.type === "FLASH_SALE") ??
              null,
          );
          void queryClient.invalidateQueries({ queryKey: cartKeys.all });
        } else if (error.code === "SALE_BUYER_LIMIT_REACHED") {
          const item =
            checkoutItems.find((row) => row.listingId === quotaListingId(error)) ??
            checkoutItems.find((row) => row.pricing?.sale?.perBuyerLimit != null);
          notifyBuyerLimit(item?.pricing?.sale?.perBuyerLimit ?? 1, item?.pricing?.listPrice ?? 0);
          void queryClient.invalidateQueries({ queryKey: cartKeys.all });
        } else if (
          error.code === "PRICE_CHANGED" ||
          error.code === "CART_PRICE_CHANGED"
        ) {
          void queryClient.invalidateQueries({ queryKey: cartKeys.all });
          hasRedirected.current = true;
          toast.add({
            title: translate("ราคาสินค้ามีการเปลี่ยนแปลง", "Item prices have changed"),
            description: translate("กรุณาตรวจสอบและยอมรับราคาใหม่ในตะกร้าอีกครั้ง", "Review and accept the new prices in your cart again"),
            type: "warning",
          });
          navigate("/cart");
        } else {
          toast.add({
            title:
              error.code === "INSUFFICIENT_STOCK"
                ? translate("สินค้าไม่เพียงพอ", "Not enough stock")
                : translate("สั่งซื้อไม่สำเร็จ", "Could not place order"),
            description: error.message,
            type: "error",
          });
        }
      } else {
        toast.add({
          title: translate("สั่งซื้อไม่สำเร็จ", "Could not place order"),
          description: translate("กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง", "Check your connection and try again"),
          type: "error",
        });
      }
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isCartLoading) {
    return (
      <div className="checkout-page">
        <FormPageSkeleton label={translate("กำลังเตรียมคำสั่งซื้อ", "Preparing your order")} />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (cartNeedsReview || quotePriceChanged) return null;
  if (cartError) {
    return (
      <div className="checkout-page">
        <div role="alert" className="checkout-container checkout-alert checkout-alert-error">
          <p>{translate("โหลดตะกร้าไม่สำเร็จ", "Could not load cart")}</p>
          <Button
            variant="outline"
            onClick={() => void queryClient.invalidateQueries({ queryKey: cartKeys.all })}
          >
            {translate("ลองอีกครั้ง", "Try again")}</Button>
        </div>
      </div>
    );
  }
  if (!checkoutItems.length) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <h1 className="text-xl font-bold">{translate("ไม่พบสินค้าที่เลือกสั่งซื้อ", "No items selected for checkout")}</h1>
          <Button onClick={() => navigate("/cart")} className="mt-4">
            {translate("กลับไปยังตะกร้า", "Back to cart")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <header className="mb-6">
          <h1 className="text-[26px] font-bold leading-tight">{translate("ตรวจสอบและสั่งซื้อ", "Review and place order")}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {translate("เลือกวิธีจัดส่งและโค้ดส่วนลดของแต่ละร้าน", "Select shipping and discount codes for each shop")}</p>
        </header>

        <div className="checkout-columns">
          <div className="flex min-w-0 flex-col gap-4">
            {shippingNotice && (
              <div role="alert" className="checkout-alert checkout-alert-warning">
                <p className="font-semibold">
                  {translate("ตัวเลือกการจัดส่งของ", "Shipping options for")}{shippingNotice} {translate("มีการเปลี่ยนแปลง", "have changed")}</p>
                <p>{translate("เราเลือกวิธีจัดส่งให้ใหม่แล้ว โปรดตรวจสอบค่าส่งและยอดรวมอีกครั้ง", "A new shipping method has been selected. Review the shipping cost and total")}</p>
              </div>
            )}

            {quotes.isError && (
              <div role="alert" className="checkout-alert checkout-alert-error">
                <p className="font-semibold">{translate("โหลดตัวเลือกจัดส่งไม่สำเร็จ", "Could not load shipping options")}</p>
                <p>
                  {quotes.error instanceof ApiError
                    ? quotes.error.message
                    : translate("กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง", "Check your connection and try again")}
                </p>
                <button
                  type="button"
                  className="checkout-link justify-self-start"
                  onClick={() => void quotes.refetch()}
                >
                  {translate("ลองอีกครั้ง", "Try again")}</button>
                <button
                  type="button"
                  className="checkout-link justify-self-start"
                  onClick={() => navigate("/cart")}
                >
                  {translate("กลับไปตรวจสอบตะกร้า", "Review your cart")}</button>
              </div>
            )}

            {promoPreview.isError && (
              <div role="alert" className="checkout-alert checkout-alert-error">
                <p className="font-semibold">{translate("คำนวณส่วนลดและยอดรวมไม่สำเร็จ", "Could not calculate discounts and total")}</p>
                <p>
                  {promoPreview.error instanceof ApiError
                    ? promoPreview.error.message
                    : translate("กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง", "Check your connection and try again")}
                </p>
                <button
                  type="button"
                  className="checkout-link justify-self-start"
                  onClick={() => void promoPreview.refetch()}
                >
                  {translate("ลองอีกครั้ง", "Try again")}</button>
              </div>
            )}

            {sellerGroups.map(({ sellerId, items, quote }, index) => {
              const count =
                promotionList.data?.filter(
                  (promotion) =>
                    promotion.sellerProfileId === sellerId && promotion.applicable,
                ).length || 0;
              const sellerGrandTotal =
                sellerId == null
                  ? null
                  : preview?.sellers.find((s) => s.sellerProfileId === sellerId)
                      ?.grandTotal ?? null;

              return (
                <CheckoutSellerCard
                  key={sellerId ?? "unknown"}
                  sellerId={sellerId}
                  sellerName={quote?.sellerName || items[0]?.sellerName || translate("ร้านค้า", "Shop")}
                  items={items}
                  quote={quote}
                  selected={selectedOptions[index]}
                  loading={quotes.isPending || quotes.isFetching}
                  failed={quotes.isError}
                  disabled={isSubmitting}
                  onSelect={(id) => {
                    if (sellerId != null) {
                      setShippingChoices((previous) => ({
                        ...previous,
                        [sellerId]: id,
                      }));
                    }
                  }}
                  promotionCode={
                    sellerId == null ? null : promotionSelection.sellerCodes[sellerId]
                  }
                  promotionDiscount={
                    sellerId == null ? 0 : sellerDiscounts.get(sellerId) || 0
                  }
                  promotionCount={count}
                  sellerGrandTotal={sellerGrandTotal}
                  previewReady={previewReady}
                  promotionError={
                    sellerId == null ? null : sellerErrors[sellerId] ?? null
                  }
                  onOpenPromotions={
                    sellerId == null ? undefined : () => setPromotionPicker(sellerId)
                  }
                />
              );
            })}
          </div>

          <aside className="flex min-w-0 flex-col gap-4" aria-label={translate("สรุปคำสั่งซื้อ", "Order summary")}>
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
                <h2 className="font-semibold">{translate("วิธีชำระเงิน", "Payment method")}</h2>
                <span className="text-muted-foreground">{translate("โอนผ่าน PromptPay", "PromptPay bank transfer")}</span>
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
            productName={quotaItem?.productName || translate("สินค้านี้", "this item")}
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

        <CodePickerDialog
          open={promotionPicker !== null}
          onOpenChange={(open) => {
            if (!open) setPromotionPicker(null);
          }}
          owner={promotionPicker ?? "PLATFORM"}
          sellerName={
            sellerGroups.find((group) => group.sellerId === promotionPicker)?.quote
              ?.sellerName ||
            sellerGroups.find((group) => group.sellerId === promotionPicker)?.items[0]
              ?.sellerName ||
            undefined
          }
          promotions={promotionList.data || []}
          selectedCode={
            promotionPicker === "PLATFORM"
              ? promotionSelection.platformCode
              : promotionPicker == null
                ? null
                : promotionSelection.sellerCodes[promotionPicker] ?? null
          }
          onSelect={(code) => {
            if (promotionPicker !== null) {
              setCode(promotionPicker, code);
            }
          }}
          onTryCode={(code) => {
            if (promotionPicker !== null) {
              setPendingTypedCode({ owner: promotionPicker, code });
              setCode(promotionPicker, code);
            }
          }}
          error={
            promotionPicker === "PLATFORM"
              ? platformError
              : promotionPicker != null
                ? sellerErrors[promotionPicker]
                : null
          }
          onNavigateHome={() => navigate("/")}
          onNavigateToStore={
            promotionStoreUsername
              ? () => navigate(`/u/${encodeURIComponent(promotionStoreUsername)}`)
              : undefined
          }
          loading={
            pendingTypedCode?.owner === promotionPicker &&
            (!previewReady || promoPreview.isFetching)
          }
        />

        <PromotionChangedDialog
          open={promotionChanged !== null}
          onOpenChange={(open) => {
            if (!open) setPromotionChanged(null);
          }}
          previousTotal={promotionChanged?.previous ?? 0}
          newTotal={preview?.grandTotal ?? promotionChanged?.next ?? 0}
          droppedCode={promotionChanged?.code}
          droppedOwner={promotionChanged?.owner}
          droppedReason={
            promotionChanged?.owner === "PLATFORM"
              ? platformError
              : promotionChanged?.owner != null
                ? sellerErrors[promotionChanged.owner]
                : null
          }
          sellerDiscountTotal={preview?.sellerDiscountTotal ?? 0}
          platformDiscountTotal={preview?.platformDiscountTotal ?? 0}
          loading={promoPreview.isFetching}
          onChooseAnotherCode={(owner) => {
            setPromotionChanged(null);
            setPromotionPicker(owner ?? "PLATFORM");
          }}
          onConfirmNewTotal={() => {
            setPromotionChanged(null);
            void handlePurchase();
          }}
        />
      </div>
    </div>
  );
}
