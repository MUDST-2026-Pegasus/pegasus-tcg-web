import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "./cart.api";
import { checkoutApi } from "./checkout.api";
import type { AddCartItemRequest, CartItemResponse, UpdateCartItemRequest } from "./cart.types";
import type { PromotionSelection } from "./promotions.types";

export const cartKeys = {
  all: ["cart"] as const,
};

export function useCart() {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: cartApi.getCart,
  });
}

export function useShippingQuotes(cartItemIds: number[], context: {
  userId?: number;
  cartId?: number;
  items?: CartItemResponse[];
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: ["checkout-shipping-quotes", context.userId, context.cartId, cartItemIds,
      context.items?.map((item) => [item.id, item.quantity, item.currentPrice, item.unitPriceAtAdd])],
    queryFn: () => checkoutApi.getShippingQuotes(cartItemIds),
    enabled: (context.enabled ?? true) && cartItemIds.length > 0,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useCheckoutPromotionList(cartItemIds: number[], context: {
  userId?: number;
  cartId?: number;
  enabled: boolean;
  /** Quantities and prices, so applicability is rechecked when they change in the cart. */
  itemsKey?: unknown;
}) {
  return useQuery({
    queryKey: ["checkout-promotions", context.userId, context.cartId, cartItemIds, context.itemsKey ?? null],
    queryFn: () => checkoutApi.getPromotions(cartItemIds),
    enabled: context.enabled,
    // The cart re-asks on every tick; keep the last list so badges and "collected" don't blink.
    placeholderData: context.itemsKey === undefined ? undefined : keepPreviousData,
  });
}

export function useCheckoutPromotionPreview(context: {
  cartItemIds: number[];
  shippingOptionBySeller: Record<number, number>;
  selection: PromotionSelection;
  userId?: number;
  cartId?: number;
  enabled: boolean;
  /** Ignore the selection and let the BE return its bestPick (cart, until the buyer picks). */
  autoPick?: boolean;
  /** Quantities and prices — the cart re-previews whenever they change. */
  itemsKey?: unknown;
  /** Keep showing the last totals while the next preview loads. */
  keepPrevious?: boolean;
}) {
  return useQuery({
    queryKey: ["checkout-promo-preview", context.userId, context.cartId,
      context.cartItemIds, context.shippingOptionBySeller, context.selection,
      context.autoPick ?? false, context.itemsKey ?? null],
    queryFn: ({ signal }) => checkoutApi.previewPromotions({
      cartItemIds: context.cartItemIds,
      shippingOptionBySeller: context.shippingOptionBySeller,
      ...context.selection,
      ...(context.autoPick ? { autoPick: true } : {}),
    }, signal),
    enabled: context.enabled,
    placeholderData: context.keepPrevious ? keepPreviousData : undefined,
    retry: false,
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCartItemRequest) => cartApi.addItem(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useBatchAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ listingId: number; quantity: number }>) =>
      cartApi.addBatchItems(items),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useAcceptCartPrices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemIds: number[]) => cartApi.acceptPrices(cartItemIds),
    onSuccess: async (cart) => {
      queryClient.setQueryData(cartKeys.all, cart);
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: UpdateCartItemRequest }) =>
      cartApi.updateQuantity(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => cartApi.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useMiniCartQuery() {
  return useQuery({ queryKey: cartKeys.all, queryFn: cartApi.getCart, refetchOnMount: "always", refetchInterval: 15000 });
}
