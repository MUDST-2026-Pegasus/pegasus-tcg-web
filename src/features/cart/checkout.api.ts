import { api } from "@/lib/api";
import type { CheckoutRequest, CheckoutResponse } from "./checkout.types";

export const checkoutApi = {
  checkout: (data: CheckoutRequest, idempotencyKey?: string) => {
    const key =
      idempotencyKey ||
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `idemp-${Date.now()}`);
    return api.post<CheckoutResponse>("/checkout", data, {
      headers: {
        "Idempotency-Key": key,
      },
    });
  },

  getOrderDetails: (orderId: number) =>
    api.get<CheckoutResponse>(`/checkout/orders/${orderId}`),
};
