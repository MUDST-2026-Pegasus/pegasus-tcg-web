import { api } from "@/lib/api";
import type { OrderDetails, PageResponse } from "./orders.types";

export const ordersApi = {
  listOrders: async (page = 0, size = 50): Promise<PageResponse<OrderDetails>> => {
    const response = await api.get<any>("/orders", {
      query: { page, size },
    });

    const rawData = response?.data !== undefined ? response.data : response;
    const items: OrderDetails[] =
      rawData?.items ??
      rawData?.content ??
      response?.items ??
      response?.content ??
      (Array.isArray(rawData) ? rawData : []) ??
      (Array.isArray(response) ? response : []);

    return {
      items,
      content: items,
      page: rawData?.page ?? response?.page ?? page,
      size: rawData?.size ?? response?.size ?? size,
      totalItems: rawData?.totalItems ?? rawData?.totalElements ?? items.length,
      totalPages: rawData?.totalPages ?? 1,
    };
  },

  getOrder: async (id: number): Promise<OrderDetails> => {
    const res = await api.get<any>(`/orders/${id}`);
    return (res?.data !== undefined && res?.data?.id !== undefined ? res.data : res) as OrderDetails;
  },

  payOrder: async (id: number): Promise<OrderDetails> => {
    const res = await api.post<any>(`/orders/${id}/pay`);
    return (res?.data !== undefined && res?.data?.id !== undefined ? res.data : res) as OrderDetails;
  },

  cancelOrder: async (id: number, reason?: string): Promise<OrderDetails> => {
    const res = await api.post<any>(`/orders/${id}/cancel`, reason ? { reason } : undefined);
    return (res?.data !== undefined && res?.data?.id !== undefined ? res.data : res) as OrderDetails;
  },

  confirmReceived: async (id: number): Promise<OrderDetails> => {
    const res = await api.post<any>(`/orders/${id}/confirm-received`);
    return (res?.data !== undefined && res?.data?.id !== undefined ? res.data : res) as OrderDetails;
  },
};
