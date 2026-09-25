import { api } from "@/lib/api";
import type { OrderDetails, PageResponse } from "./orders.types";

export const ordersApi = {
  listOrders: (page = 0, size = 20) =>
    api.get<PageResponse<OrderDetails>>("/orders", {
      query: { page, size },
    }),

  getOrder: (id: number) =>
    api.get<OrderDetails>(`/orders/${id}`),

  payOrder: (id: number) =>
    api.post<OrderDetails>(`/orders/${id}/pay`),

  cancelOrder: (id: number, reason?: string) =>
    api.post<OrderDetails>(`/orders/${id}/cancel`, reason ? { reason } : undefined),

  confirmReceived: (id: number) =>
    api.post<OrderDetails>(`/orders/${id}/confirm-received`),
};
