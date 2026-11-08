import { useEffect, useMemo, type RefObject } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/features/auth/auth.queries";
import { useCart, useShippingQuotes, cartKeys } from "./cart.queries";

interface CheckoutLocationState {
  selectedCartItemIds?: number[];
}

/**
 * Cart checkout data: the signed-in buyer, the cart, which items are being bought
 * (`?items=`, router state, or `?productId=&listingId=`) and their shipping quotes.
 */
export function useCheckoutData() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const {
    data: cart,
    isLoading: isCartLoading,
    isFetching: isCartFetching,
    error: cartError,
  } = useCart();

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

  const quotePriceChanged =
    quotes.error instanceof ApiError &&
    (quotes.error.code === "CART_PRICE_CHANGED" ||
      quotes.error.code === "PRICE_CHANGED");

  return {
    user,
    isAuthenticated,
    isAuthLoading,
    cart,
    isCartLoading,
    isCartFetching,
    cartError,
    checkoutItems,
    cartItemIds,
    hasPriceChanges,
    cartNeedsReview,
    quotes,
    quotePriceChanged,
  };
}

type CheckoutData = ReturnType<typeof useCheckoutData>;

/**
 * Leaves checkout when it cannot go on: signed out → login (with return URL),
 * changed/unavailable items or nothing selected → cart. `hasRedirectedRef` keeps it to one
 * cart redirect; `completedRef` stops the bounce once an order was placed and the cart empties.
 */
export function useCheckoutRedirects({
  data,
  hasRedirectedRef,
  completedRef,
}: {
  data: CheckoutData;
  hasRedirectedRef: RefObject<boolean>;
  completedRef: RefObject<boolean>;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const {
    isAuthLoading,
    isAuthenticated,
    isCartLoading,
    isCartFetching,
    cartError,
    cartNeedsReview,
    hasPriceChanges,
    quotePriceChanged,
  } = data;
  const checkoutItemCount = data.checkoutItems.length;

  useEffect(() => {
    if (
      !isAuthLoading &&
      isAuthenticated &&
      !isCartLoading &&
      !isCartFetching &&
      !cartError &&
      (cartNeedsReview || quotePriceChanged) &&
      !hasRedirectedRef.current &&
      !completedRef.current
    ) {
      hasRedirectedRef.current = true;
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
    hasRedirectedRef,
    completedRef,
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
      checkoutItemCount === 0 &&
      !hasRedirectedRef.current &&
      !completedRef.current
    ) {
      hasRedirectedRef.current = true;
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
    checkoutItemCount,
    navigate,
    hasRedirectedRef,
    completedRef,
  ]);
}
