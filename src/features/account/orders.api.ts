import { api } from "@/lib/api";
import type { OrderDetails, PageResponse } from "./orders.types";

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

export const ordersApi = {
  listOrders: async (page = 0, size = 50): Promise<PageResponse<OrderDetails>> => {
    const response = await api.get<PageResponse<OrderDetails> | Record<string, unknown>>("/orders", {
      query: { page, size },
    });

    const rawData =
      isRecord(response) && "data" in response && isRecord(response.data)
        ? response.data
        : isRecord(response)
          ? response
          : {};

    const rawItems = isRecord(rawData)
      ? (rawData.items ?? rawData.content)
      : undefined;

    const responseItems = isRecord(response)
      ? (response.items ?? response.content)
      : undefined;

    const items: OrderDetails[] = Array.isArray(rawItems)
      ? (rawItems as OrderDetails[])
      : Array.isArray(responseItems)
        ? (responseItems as OrderDetails[])
        : Array.isArray(response)
          ? (response as OrderDetails[])
          : [];

    const pageNum =
      isRecord(rawData) && typeof rawData.page === "number" ? rawData.page : page;
    const sizeNum =
      isRecord(rawData) && typeof rawData.size === "number" ? rawData.size : size;
    const totalItems =
      isRecord(rawData) && typeof rawData.totalItems === "number"
        ? rawData.totalItems
        : isRecord(rawData) && typeof rawData.totalElements === "number"
          ? rawData.totalElements
          : items.length;
    const totalPages =
      isRecord(rawData) && typeof rawData.totalPages === "number"
        ? rawData.totalPages
        : 1;

    return {
      items,
      content: items,
      page: pageNum,
      size: sizeNum,
      totalItems,
      totalPages,
    };
  },

  getOrder: (id: number): Promise<OrderDetails> =>
    api.get<OrderDetails>(`/orders/${id}`),

  payOrder: (id: number): Promise<OrderDetails> =>
    api.post<OrderDetails>(`/orders/${id}/pay`),

  cancelOrder: (id: number, reason?: string): Promise<OrderDetails> =>
    api.post<OrderDetails>(`/orders/${id}/cancel`, reason ? { reason } : undefined),

  confirmReceived: (id: number): Promise<OrderDetails> =>
    api.post<OrderDetails>(`/orders/${id}/confirm-received`),
};
