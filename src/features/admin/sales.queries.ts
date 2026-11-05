import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import * as salesApi from "./sales.api";
import type { AdminSaleInput, AdminSaleQuery, SaleScopePreviewInput } from "./sales.types";

/**
 * ทุกการกระทำ (สร้าง แก้ หยุด เปิด จบ ลบ) เปลี่ยนแถว ตัวเลขบนแท็บ และ KPI จึงล้างทั้ง `all`
 */
export const saleKeys = {
  all: ["admin-sales"] as const,
  list: (query: AdminSaleQuery) => [...saleKeys.all, "list", query] as const,
  summary: () => [...saleKeys.all, "summary"] as const,
  detail: (id: number) => [...saleKeys.all, "detail", id] as const,
  preview: (input: SaleScopePreviewInput) => [...saleKeys.all, "preview", input] as const,
  sellers: (q: string) => [...saleKeys.all, "sellers", q] as const,
  cardSets: (gameIds: number[]) => [...saleKeys.all, "card-sets", gameIds] as const,
};

export function useSales(query: AdminSaleQuery, enabled = true) {
  return useQuery({
    queryKey: saleKeys.list(query),
    queryFn: () => salesApi.getSales(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** จำนวนรวมบนแท็บหน้า "ลดราคาสินค้า N" — ขอแค่แถวเดียวพอได้ `statusCounts` */
export function useSaleCount() {
  return useQuery({
    queryKey: saleKeys.list({ page: 0, size: 1 }),
    queryFn: () => salesApi.getSales({ page: 0, size: 1 }),
    select: (data) => data.page.totalItems,
  });
}

export function useSaleSummary(enabled = true) {
  return useQuery({ queryKey: saleKeys.summary(), queryFn: salesApi.getSaleSummary, enabled });
}

export function useSale(id: number) {
  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: () => salesApi.getSale(id),
    enabled: id > 0,
  });
}

/** ผลของ preview-scope — `input` ผ่าน debounce มาแล้ว */
export function useScopePreview(input: SaleScopePreviewInput, enabled: boolean) {
  return useQuery({
    queryKey: saleKeys.preview(input),
    queryFn: () => salesApi.previewScope(input),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSellerSearch(q: string) {
  return useQuery({
    queryKey: saleKeys.sellers(q),
    queryFn: () => salesApi.searchSellers(q),
    enabled: q.trim().length >= 2,
    staleTime: 60_000,
  });
}

export function useSaleCardSets(gameIds: number[], enabled: boolean) {
  return useQuery({
    queryKey: saleKeys.cardSets(gameIds),
    queryFn: () => salesApi.getAllCardSets(gameIds),
    enabled: enabled && gameIds.length > 0,
    staleTime: 5 * 60_000,
  });
}

function useInvalidateSales() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: saleKeys.all });
}

export function useSaveSale() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: AdminSaleInput }) =>
      id ? salesApi.updateSale(id, input) : salesApi.createSale(input),
    onSuccess: invalidate,
  });
}

/** บันทึกร่าง = สร้างแล้วหยุดไว้ทันที (backend ไม่มีสถานะร่าง) จะไม่เปิดเองจนกว่าจะกดเปิด */
export function useSaveSaleDraft() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: AdminSaleInput }) => {
      const sale = id ? await salesApi.updateSale(id, input) : await salesApi.createSale(input);
      return sale.status === "PAUSED" ? sale : salesApi.pauseSale(sale.id, "ร่าง — ยังไม่เปิด", false);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteSale() {
  const invalidate = useInvalidateSales();
  return useMutation({ mutationFn: (id: number) => salesApi.deleteSale(id), onSuccess: invalidate });
}

export function usePauseSale() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: ({ id, reason, notifySeller }: { id: number; reason: string | null; notifySeller: boolean }) =>
      salesApi.pauseSale(id, reason, notifySeller),
    onSuccess: invalidate,
  });
}

export function useResumeSale() {
  const invalidate = useInvalidateSales();
  return useMutation({ mutationFn: (id: number) => salesApi.resumeSale(id), onSuccess: invalidate });
}

export function useEndSale() {
  const invalidate = useInvalidateSales();
  return useMutation({ mutationFn: (id: number) => salesApi.endSale(id), onSuccess: invalidate });
}

export type PromotionPageTab = "codes" | "sales";

/** แท็บของหน้า /admin/promotions — `?tab=sales` → ลดราคาสินค้า · อย่างอื่น = โค้ดส่วนลด */
export function usePromotionPageTab(): PromotionPageTab {
  const [params] = useSearchParams();
  return params.get("tab") === "sales" ? "sales" : "codes";
}
