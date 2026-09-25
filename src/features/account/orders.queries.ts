import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "./orders.api";
import type { OrderDetails } from "./orders.types";

export const orderKeys = {
  all: ["orders"] as const,
  list: (page = 0, size = 50) => [...orderKeys.all, "list", { page, size }] as const,
  detail: (id: number) => [...orderKeys.all, "detail", id] as const,
};

export function useBuyerOrders(page = 0, size = 50) {
  return useQuery({
    queryKey: orderKeys.list(page, size),
    queryFn: async () => {
      const response = await ordersApi.listOrders(page, size);
      const items: OrderDetails[] =
        (response as any)?.items ??
        (response as any)?.content ??
        (response as any)?.data?.items ??
        (response as any)?.data ??
        (Array.isArray(response) ? response : []);
      return items;
    },
  });
}

export const useOrders = useBuyerOrders;

export function useOrderDetails(orderId: number) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: Boolean(orderId),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason?: string }) =>
      ordersApi.cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
