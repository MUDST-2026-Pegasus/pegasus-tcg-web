import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "./cart.api";
import { checkoutApi } from "./checkout.api";
import type { AddCartItemRequest, CartItemResponse, UpdateCartItemRequest } from "./cart.types";

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

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCartItemRequest) => cartApi.addItem(data),
    onSuccess: async () => {
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
