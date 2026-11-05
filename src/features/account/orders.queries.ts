import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { refundKeys } from "@/features/finance/refunds.queries";
import { ordersApi } from "./orders.api";
import type { OrderDetails } from "./orders.types";

export const orderKeys = {
  all: ["orders"] as const,
  list: (page = 0, size = 50) => [...orderKeys.all, "list", { page, size }] as const,
  detail: (id: number) => [...orderKeys.all, "detail", id] as const,
  reorderItems: (orderId: number | null) => ["orders", orderId, "reorder-items"] as const,
  reorderPreview: (orderId: number | null) => ["orders", orderId, "reorder-items"] as const,
};

export function useBuyerOrders(page = 0, size = 50, pollPending = false) {
  return useQuery({
    queryKey: orderKeys.list(page, size),
    queryFn: async (): Promise<OrderDetails[]> => {
      const response = await ordersApi.listOrders(page, size);
      return response.items ?? response.content ?? [];
    },
    refetchInterval: pollPending ? (query) => query.state.data?.some((order) => order.status === "PENDING_PAYMENT") ? 30_000 : false : false,
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
      // Cancelling a paid order opens a refund that needs the buyer's bank account.
      queryClient.invalidateQueries({ queryKey: refundKeys.mine });
    },
  });
}

export function useReorderItems(orderId: number | null, enabled = false) {
  return useQuery({
    queryKey: orderKeys.reorderItems(orderId),
    queryFn: () => {
      if (!orderId) {
        throw new Error("orderId is required for reorder items");
      }
      return ordersApi.getReorderItems(orderId);
    },
    enabled: enabled && Boolean(orderId),
  });
}

export const useReorderPreview = useReorderItems;
