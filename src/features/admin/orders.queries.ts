import { keepPreviousData, useQuery } from "@tanstack/react-query";

import * as ordersApi from "./orders.api";
import type { AdminOrderListParams } from "./orders.types";

/** ใบต่อคอลัมน์บน board — ดีไซน์โชว์คอลัมน์ละ 3 ใบ ที่เหลือดูผ่าน "ดูเพิ่มเติม" */
export const BOARD_PER_COLUMN = 3;

/**
 * query key ต้องรวมทุกค่าที่ทำให้ผลต่างกัน — list รวม params ทั้งก้อน
 * หน้านี้อ่านอย่างเดียว ไม่มี mutation ที่ต้อง invalidate
 */
export const adminOrderKeys = {
  all: ["admin-orders"] as const,
  board: (perColumn: number) =>
    [...adminOrderKeys.all, "board", perColumn] as const,
  list: (params: AdminOrderListParams) =>
    [...adminOrderKeys.all, "list", params] as const,
  detail: (sellerOrderId: number) =>
    [...adminOrderKeys.all, "detail", sellerOrderId] as const,
};

/** สถานะออเดอร์เปลี่ยนตลอด ดึงใหม่เป็นระยะให้ตัวเลขบน board ไม่ค้าง */
const BOARD_POLL_MS = 60_000;

export function useOrderBoard(perColumn = BOARD_PER_COLUMN) {
  return useQuery({
    queryKey: adminOrderKeys.board(perColumn),
    queryFn: () => ordersApi.getOrderBoard(perColumn),
    refetchInterval: BOARD_POLL_MS,
  });
}

/** `enabled: false` ตอน Sheet ปิด — อย่าส่งเข้า QueryBoundary ตอนนั้น */
export function useAdminOrders(params: AdminOrderListParams, enabled = true) {
  return useQuery({
    queryKey: adminOrderKeys.list(params),
    queryFn: () => ordersApi.getAdminOrders(params),
    // เปลี่ยนหน้าแล้วยังเห็นของเดิมจนชุดใหม่มา ภาพไม่กระพริบ
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAdminOrder(sellerOrderId: number | null) {
  return useQuery({
    queryKey: adminOrderKeys.detail(sellerOrderId ?? 0),
    queryFn: () => ordersApi.getAdminOrder(sellerOrderId as number),
    enabled: sellerOrderId !== null,
  });
}
