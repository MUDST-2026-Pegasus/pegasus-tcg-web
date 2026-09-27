import { api } from "@/lib/api";
import type { CheckoutRequest, CheckoutResponse } from "./checkout.types";

export const checkoutApi = {
  checkout: (data: CheckoutRequest, idempotencyKey?: string) => {
    const key = idempotencyKey || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    return api.post<CheckoutResponse>("/checkout", data, {
      headers: {
        "Idempotency-Key": key,
      },
    });
  },

  getOrderDetails: (orderId: number) =>
    api.get<CheckoutResponse>(`/checkout/orders/${orderId}`),
};
