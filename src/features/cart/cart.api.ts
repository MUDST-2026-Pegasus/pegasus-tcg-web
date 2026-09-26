import { api } from "@/lib/api";
import type {
  AddCartItemRequest,
  CartItemResponse,
  CartResponse,
  UpdateCartItemRequest,
} from "./cart.types";

export const cartApi = {
  getCart: () => api.get<CartResponse>("/cart"),

  addItem: (data: AddCartItemRequest) =>
    api.post<CartItemResponse>("/cart/items", data),

  updateQuantity: (itemId: number, data: UpdateCartItemRequest) =>
    api.patch<CartItemResponse>(`/cart/items/${itemId}`, data),

  removeItem: (itemId: number) =>
    api.delete<void>(`/cart/items/${itemId}`),

  mergeCart: () => api.post<CartResponse>("/cart/merge"),
};
