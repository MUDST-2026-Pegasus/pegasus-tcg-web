import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { dashboardKeys } from "@/features/seller/dashboard/dashboard.queries";
import { listingKeys } from "@/features/seller/products/products.queries";

import * as ordersApi from "./orders.api";
import type {
  CancelOrderPayload,
  SellerOrderDetail,
  SellerOrderQuery,
  ShipOrderPayload,
} from "./orders.types";

/** query key รวมทุกค่าที่ทำให้หน้ารายการต่างกัน — สถานะ / คำค้น / sort / หน้า */
export const orderKeys = {
  all: ["seller-orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (query: SellerOrderQuery) =>
    [
      ...orderKeys.lists(),
      query.statuses.join(",") || "ALL",
      query.q ?? "",
      query.sort ?? "default",
      query.page,
      query.size,
    ] as const,
  counts: () => [...orderKeys.all, "counts"] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
};

/**
 * ออเดอร์เปลี่ยนจากฝั่งอื่นได้ตลอด (ผู้ซื้อสั่ง/จ่าย ระบบยกเลิกเอง) ไม่ใช่แค่จากร้าน
 * จึงไม่ใช้ staleTime 30 วิของทั้งแอป — กลับมาที่แท็บ/หน้าเดิมเมื่อไหร่ ดึงใหม่ทุกครั้ง
 * ระหว่างรอยังเห็นชุดที่ cache ไว้ ภาพไม่กระพริบ
 */
const ORDERS_STALE_MS = 0;

export function useSellerOrders(query: SellerOrderQuery) {
  return useQuery({
    queryKey: orderKeys.list(query),
    queryFn: () => ordersApi.getSellerOrders(query),
    staleTime: ORDERS_STALE_MS,
    // สลับแท็บ/หน้าแล้วยังเห็นของเดิมจนกว่าชุดใหม่จะมา ภาพไม่กระพริบ
    placeholderData: keepPreviousData,
  });
}

/**
 * ตัวเลขบนชิปตัวกรอง — endpoint เดียว GROUP BY ที่ backend
 * สดเท่ากับรายการ หน้าจัดการคำสั่งซื้อสั่งดึงใหม่เองทุกครั้งที่สลับแท็บ
 */
export function useSellerOrderCounts() {
  return useQuery({
    queryKey: orderKeys.counts(),
    queryFn: ordersApi.getSellerOrderCounts,
    staleTime: ORDERS_STALE_MS,
  });
}

/** @param id `null` = เลขใน URL ไม่ใช่ตัวเลข ไม่ต้องยิง */
export function useSellerOrder(id: number | null) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? 0),
    queryFn: () => ordersApi.getSellerOrder(id ?? 0),
    enabled: id !== null,
    // 404 คือคำตอบ ไม่ใช่อาการเน็ตหลุด ลองซ้ำไปก็ได้ผลเดิม
    retry: false,
  });
}

/**
 * หลังเปลี่ยนสถานะ: ใบนี้ใช้ผลที่ backend ส่งกลับมาเลย ไม่ต้องยิงซ้ำ
 * ส่วนรายการ / ตัวเลขบนชิป / แดชบอร์ด ล้างทิ้งให้ดึงใหม่ เพราะออเดอร์ย้ายแท็บแล้ว
 *
 * ไม่ return promise ของการล้าง — ไม่งั้น mutation (และ dialog ที่รอ `mutateAsync`)
 * ค้างจนกว่าทุกหน้าที่เกี่ยวจะโหลดใหม่เสร็จ ทั้งที่ผลของใบนี้มาถึงแล้ว
 */
function settle(queryClient: QueryClient, detail: SellerOrderDetail) {
  queryClient.setQueryData(orderKeys.detail(detail.summary.order.id), detail);
  void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: orderKeys.counts() });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
}

export function useAcceptOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ordersApi.acceptSellerOrder(id),
    onSuccess: (detail) => settle(queryClient, detail),
  });
}

export function useShipOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ShipOrderPayload }) =>
      ordersApi.shipSellerOrder(id, payload),
    onSuccess: (detail) => settle(queryClient, detail),
  });
}

/** การ์ดกลับเข้าสต็อก — ตัวเลขคงเหลือในหน้าจัดการสินค้าต้องดึงใหม่ด้วย */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CancelOrderPayload }) =>
      ordersApi.cancelSellerOrder(id, payload),
    onSuccess: (detail) => {
      settle(queryClient, detail);
      void queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}
