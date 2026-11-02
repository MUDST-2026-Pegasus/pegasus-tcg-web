import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormPageSkeleton } from "@/components/common/PageSkeletons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/features/auth/auth.queries";
import { useAddresses, addressKeys } from "@/features/account/address.queries";
import { formatAddressLines } from "@/features/account/address.format";
import { useCart, useShippingQuotes, cartKeys } from "../cart.queries";
import { checkoutApi } from "../checkout.api";
import { CheckoutSellerCard } from "../components/CheckoutSellerCard";
import {
  findPromotionOwnerForCode,
  formatPromotionError,
  normalizePromotionCode,
} from "../checkout.format";
import { CheckoutAddressPicker } from "../components/CheckoutAddressPicker";
import { CodePickerDialog } from "../components/CodePickerDialog";
import { PromotionChangedDialog } from "../components/PromotionChangedDialog";
import { CheckoutPlatformPromotionCard } from "../components/CheckoutPlatformPromotionCard";
import { CheckoutOrderSummary } from "../components/CheckoutOrderSummary";
import {
  readPromotionSelection,
  savePromotionSelection,
  type PromotionSelection,
} from "../promotions.types";
import type { CartItemResponse } from "../cart.types";
import "./checkout.css";

interface CheckoutLocationState {
  selectedCartItemIds?: number[];
}

export function CheckoutPage() {
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

  // Read initial selection from session storage with schema guard
  const [promotionSelection, setPromotionSelection] = useState<PromotionSelection>(
    readPromotionSelection,
  );
  const [debouncedSelection, setDebouncedSelection] = useState(promotionSelection);

  // Sanitize seller codes to only sellers present in this checkout
  useEffect(() => {
    if (!checkoutItems.length) return;
    const currentSellerIds = new Set(
      checkoutItems
        .map((item) => item.sellerProfileId)
        .filter((id): id is number => id != null),
    );
    setPromotionSelection((prev) => {
      const filteredSellerCodes: Record<number, string> = {};
      let changed = false;
      for (const [key, val] of Object.entries(prev.sellerCodes)) {
        const numKey = Number(key);
        if (currentSellerIds.has(numKey)) {
          filteredSellerCodes[numKey] = val;
        } else {
          changed = true;
        }
      }
      return changed ? { ...prev, sellerCodes: filteredSellerCodes } : prev;
    });
  }, [checkoutItems]);

  const [promotionPicker, setPromotionPicker] = useState<"PLATFORM" | number | null>(null);
  const [typedPlatformCode, setTypedPlatformCode] = useState("");
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [sellerErrors, setSellerErrors] = useState<Record<number, string>>({});
  const [pendingTypedCode, setPendingTypedCode] = useState<{
    owner: "PLATFORM" | number;
    code: string;
  } | null>(null);
  const [promotionChanged, setPromotionChanged] = useState<{
    previous: number;
    next: number;
    code?: string;
    owner?: "PLATFORM" | number;
  } | null>(null);

  // Save to session storage and debounce preview requests (180ms)
  useEffect(() => {
    savePromotionSelection(promotionSelection);
    const timer = window.setTimeout(() => setDebouncedSelection(promotionSelection), 180);
    return () => window.clearTimeout(timer);
  }, [promotionSelection]);

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

  const promotionList = useQuery({
    queryKey: ["checkout-promotions", cartItemIds],
    queryFn: () => checkoutApi.getPromotions(cartItemIds),
    enabled: checkoutItems.length > 0 && !cartNeedsReview,
  });

  const promoPreview = useQuery({
    queryKey: [
      "checkout-promo-preview",
      cartItemIds,
      shippingOptionBySeller,
      debouncedSelection,
    ],
    queryFn: ({ signal }) =>
      checkoutApi.previewPromotions(
        { cartItemIds, shippingOptionBySeller, ...debouncedSelection },
        signal,
      ),
    enabled: shippingReady && debouncedSelection === promotionSelection,
    retry: false,
  });

  const preview = promoPreview.data;
  const previewReady =
    !!preview &&
    !promoPreview.isFetching &&
    !promoPreview.isError &&
    debouncedSelection === promotionSelection;

  const appliedPlatformCode = preview?.codes.find(
    (code) => code.ownerType === "PLATFORM" && code.status === "APPLIED",
  )?.code;

  const appliedPlatformPromotion = useMemo(() => {
    if (!promotionSelection.platformCode) return null;
    return promotionList.data?.find(
      (p) =>
        p.code === promotionSelection.platformCode && p.ownerType === "PLATFORM",
    );
  }, [promotionSelection.platformCode, promotionList.data]);

  const sellerDiscounts = new Map(
    preview?.sellers.map((seller) => [
      seller.sellerProfileId,
      seller.sellerDiscount,
    ]),
  );

  const clearOwnerError = (owner: "PLATFORM" | number) => {
    if (owner === "PLATFORM") {
      setPlatformError(null);
    } else {
      setSellerErrors((prev) => {
        const next = { ...prev };
        delete next[owner];
        return next;
      });
    }
  };

  const setCode = (owner: "PLATFORM" | number, code: string | null) => {
    clearOwnerError(owner);
    const normalized = code ? normalizePromotionCode(code) : null;
    setPromotionSelection((previous) => {
      if (owner === "PLATFORM") {
        return { ...previous, platformCode: normalized };
      }
      const nextSellerCodes = { ...previous.sellerCodes };
      if (normalized) {
        nextSellerCodes[owner] = normalized;
      } else {
        delete nextSellerCodes[owner];
      }
      return { ...previous, sellerCodes: nextSellerCodes };
    });
  };

  // Reconcile the authoritative result. Invalid codes are removed individually;
  // a typed code closes its picker only after the API confirms it was applied.
  useEffect(() => {
    if (!preview || !previewReady) return;
    const invalidOutcomes = preview.codes.filter(
      (code) => code.status !== "APPLIED" && !code.pendingShipping,
    );

    if (invalidOutcomes.length) {
      let removePlatform = false;
      const sellerIdsToRemove = new Set<number>();
      const nextSellerErrors: Record<number, string> = {};

      for (const invalid of invalidOutcomes) {
        const message = formatPromotionError(invalid.status, {
          sellerName: invalid.sellerName,
          shortfall: invalid.shortfall,
        });
        if (
          invalid.ownerType === "PLATFORM" &&
          promotionSelection.platformCode === invalid.code
        ) {
          removePlatform = true;
          setPlatformError(message);
        } else if (
          invalid.sellerProfileId != null &&
          promotionSelection.sellerCodes[invalid.sellerProfileId] === invalid.code
        ) {
          sellerIdsToRemove.add(invalid.sellerProfileId);
          nextSellerErrors[invalid.sellerProfileId] = message;
        }
      }

      if (removePlatform || sellerIdsToRemove.size) {
        setSellerErrors((previous) => ({ ...previous, ...nextSellerErrors }));
        setPromotionSelection((previous) => {
          const sellerCodes = { ...previous.sellerCodes };
          for (const sellerId of sellerIdsToRemove) delete sellerCodes[sellerId];
          return {
            platformCode: removePlatform ? null : previous.platformCode,
            sellerCodes,
          };
        });
      }

      if (
        pendingTypedCode &&
        invalidOutcomes.some(
          (outcome) => outcome.code === pendingTypedCode.code,
        )
      ) {
        setPendingTypedCode(null);
      }
      return;
    }

    if (pendingTypedCode) {
      const applied = preview.codes.some((outcome) => {
        if (outcome.code !== pendingTypedCode.code || outcome.status !== "APPLIED") {
          return false;
        }
        return pendingTypedCode.owner === "PLATFORM"
          ? outcome.ownerType === "PLATFORM"
          : outcome.sellerProfileId === pendingTypedCode.owner;
      });
      if (applied) {
        setPendingTypedCode(null);
        setPromotionPicker(null);
      }
    }
  }, [pendingTypedCode, preview, previewReady, promotionSelection]);

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
            ? "ราคาสินค้ามีการเปลี่ยนแปลง"
            : "สินค้าบางรายการไม่พร้อมจำหน่าย",
        description:
          hasPriceChanges || quotePriceChanged
            ? "กรุณากลับไปตรวจสอบและยอมรับราคาใหม่ในตะกร้าก่อนสั่งซื้อ"
            : "กรุณานำสินค้าออกหรือยกเลิกเลือกในตะกร้าก่อนสั่งซื้อ",
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
        title: "ไม่พบสินค้าที่เลือกสั่งซื้อ",
        description: "กรุณาเลือกสินค้าที่ต้องการสั่งซื้อจากตะกร้า",
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
      toast.add({
        title: "สร้างคำสั่งซื้อสำเร็จ",
        description: `คำสั่งซื้อ ${response.orderNumber}`,
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
              "ร้านค้า"
            : sellerGroups
                .map(
                  (group) =>
                    group.quote?.sellerName ||
                    group.items[0]?.sellerName ||
                    "ร้านค้า",
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
        } else if (error.code === "PROMO_CHANGED") {
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
            title: "กรุณาเลือกที่อยู่จัดส่งอีกครั้ง",
            description: "ที่อยู่เดิมไม่พร้อมใช้งาน",
            type: "warning",
          });
        } else if (
          error.code === "PRICE_CHANGED" ||
          error.code === "CART_PRICE_CHANGED"
        ) {
          void queryClient.invalidateQueries({ queryKey: cartKeys.all });
          hasRedirected.current = true;
          toast.add({
            title: "ราคาสินค้ามีการเปลี่ยนแปลง",
            description: "กรุณาตรวจสอบและยอมรับราคาใหม่ในตะกร้าอีกครั้ง",
            type: "warning",
          });
          navigate("/cart");
        } else {
          toast.add({
            title:
              error.code === "INSUFFICIENT_STOCK"
                ? "สินค้าไม่เพียงพอ"
                : "สั่งซื้อไม่สำเร็จ",
            description: error.message,
            type: "error",
          });
        }
      } else {
        toast.add({
          title: "สั่งซื้อไม่สำเร็จ",
          description: "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง",
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
        <FormPageSkeleton label="กำลังเตรียมคำสั่งซื้อ" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (cartNeedsReview || quotePriceChanged) return null;
  if (cartError) {
    return (
      <div className="checkout-page">
        <div role="alert" className="checkout-container checkout-alert checkout-alert-error">
          <p>โหลดตะกร้าไม่สำเร็จ</p>
          <Button
            variant="outline"
            onClick={() => void queryClient.invalidateQueries({ queryKey: cartKeys.all })}
          >
            ลองอีกครั้ง
          </Button>
        </div>
      </div>
    );
  }
  if (!checkoutItems.length) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <h1 className="text-xl font-bold">ไม่พบสินค้าที่เลือกสั่งซื้อ</h1>
          <Button onClick={() => navigate("/cart")} className="mt-4">
            กลับไปยังตะกร้า
          </Button>
        </div>
      </div>
    );
  }

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
              <div role="alert" className="checkout-alert checkout-alert-error">
                <p className="font-semibold">โหลดตัวเลือกจัดส่งไม่สำเร็จ</p>
                <p>
                  {quotes.error instanceof ApiError
                    ? quotes.error.message
                    : "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง"}
                </p>
                <button
                  type="button"
                  className="checkout-link justify-self-start"
                  onClick={() => void quotes.refetch()}
                >
                  ลองอีกครั้ง
                </button>
                <button
                  type="button"
                  className="checkout-link justify-self-start"
                  onClick={() => navigate("/cart")}
                >
                  กลับไปตรวจสอบตะกร้า
                </button>
              </div>
            )}

            {promoPreview.isError && (
              <div role="alert" className="checkout-alert checkout-alert-error">
                <p className="font-semibold">คำนวณส่วนลดและยอดรวมไม่สำเร็จ</p>
                <p>
                  {promoPreview.error instanceof ApiError
                    ? promoPreview.error.message
                    : "กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง"}
                </p>
                <button
                  type="button"
                  className="checkout-link justify-self-start"
                  onClick={() => void promoPreview.refetch()}
                >
                  ลองอีกครั้ง
                </button>
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
                  sellerName={quote?.sellerName || items[0]?.sellerName || "ร้านค้า"}
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

          <aside className="flex min-w-0 flex-col gap-4" aria-label="สรุปคำสั่งซื้อ">
            <Card className="checkout-panel">
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <h2 className="font-semibold">ที่อยู่จัดส่ง</h2>
                <button
                  type="button"
                  className="checkout-link font-medium"
                  disabled={isSubmitting || !!addressError || isAddressLoading}
                  onClick={() => setAddressPickerOpen(true)}
                >
                  {activeAddress ? "เปลี่ยน" : "เพิ่มที่อยู่"}
                </button>
              </div>
              {isAddressLoading ? (
                <div
                  role="status"
                  aria-label="กำลังโหลดที่อยู่จัดส่ง"
                  className="grid gap-2"
                >
                  <div className="checkout-shipping-skeleton" />
                  <div className="checkout-shipping-skeleton" />
                </div>
              ) : addressError ? (
                <div role="alert" className="text-xs text-destructive">
                  โหลดที่อยู่ไม่สำเร็จ{" "}
                  <button
                    type="button"
                    className="checkout-link"
                    onClick={() => void refetchAddresses()}
                  >
                    ลองอีกครั้ง
                  </button>
                </div>
              ) : activeAddress ? (
                <div className="text-xs leading-[18px] text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {activeAddress.recipientName} · {activeAddress.phone}
                  </p>
                  <p>{formatAddressLines(activeAddress).join(" ")}</p>
                </div>
              ) : (
                <p role="alert" className="text-xs text-destructive">
                  เพิ่มที่อยู่จัดส่งเพื่อดำเนินการต่อ
                </p>
              )}
            </Card>

            <Card className="checkout-panel">
              <div className="flex items-center justify-between gap-3 text-[13px]">
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
