import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as promotionsApi from "./promotions.api";
import { REDEMPTION_PAGE_SIZE } from "./promotions.format";
import type { AdminPromotionInput, AdminPromotionQuery } from "./promotions.types";

/**
 * ทุกการกระทำ (สร้าง แก้ หยุด เปิด ลบ จัดหน้าแรก) เปลี่ยนทั้งแถว ตัวเลขบนแท็บ และ KPI
 * จึงล้างทั้ง `all` ทุกครั้ง
 */
export const promotionKeys = {
  all: ["admin-promotions"] as const,
  list: (query: AdminPromotionQuery) => [...promotionKeys.all, "list", query] as const,
  summary: () => [...promotionKeys.all, "summary"] as const,
  detail: (id: number) => [...promotionKeys.all, "detail", id] as const,
  redemptions: (id: number, page: number) => [...promotionKeys.all, "redemptions", id, page] as const,
  platform: () => [...promotionKeys.all, "platform"] as const,
  categories: () => [...promotionKeys.all, "categories"] as const,
};

export function usePromotions(query: AdminPromotionQuery) {
  return useQuery({
    queryKey: promotionKeys.list(query),
    queryFn: () => promotionsApi.getPromotions(query),
    placeholderData: keepPreviousData,
  });
}

export function usePromotionSummary() {
  return useQuery({ queryKey: promotionKeys.summary(), queryFn: promotionsApi.getPromotionSummary });
}

export function usePromotion(id: number) {
  return useQuery({
    queryKey: promotionKeys.detail(id),
    queryFn: () => promotionsApi.getPromotion(id),
    enabled: id > 0,
  });
}

export function useRedemptions(id: number, page: number) {
  return useQuery({
    queryKey: promotionKeys.redemptions(id, page),
    queryFn: () => promotionsApi.getRedemptions(id, page, REDEMPTION_PAGE_SIZE),
    enabled: id > 0,
  });
}

/** โค้ด Pegasus ทั้งหมด — ใช้หาโค้ดที่ขึ้นหน้าแรกได้ และนับใบที่อยู่บนหน้าแรกตอนนี้ */
export function usePlatformPromotions(enabled = true) {
  return useQuery({
    queryKey: promotionKeys.platform(),
    queryFn: promotionsApi.getAllPlatformPromotions,
    enabled,
  });
}

export function usePromotionCategories(enabled = true) {
  return useQuery({
    queryKey: promotionKeys.categories(),
    queryFn: promotionsApi.getPromotionCategories,
    staleTime: 5 * 60_000,
    enabled,
  });
}

function useInvalidatePromotions() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: promotionKeys.all });
}

export function useSavePromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: AdminPromotionInput }) =>
      id ? promotionsApi.updatePromotion(id, input) : promotionsApi.createPromotion(input),
    onSuccess: invalidate,
  });
}

export function useDeletePromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({ mutationFn: (id: number) => promotionsApi.deletePromotion(id), onSuccess: invalidate });
}

export function usePausePromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: ({ id, reason, notifySeller }: { id: number; reason: string | null; notifySeller: boolean }) =>
      promotionsApi.pausePromotion(id, reason, notifySeller),
    onSuccess: invalidate,
  });
}

export function useResumePromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: ({ id, notifySeller }: { id: number; notifySeller: boolean }) =>
      promotionsApi.resumePromotion(id, notifySeller),
    onSuccess: invalidate,
  });
}

export function useEndPromotion() {
  const invalidate = useInvalidatePromotions();
  return useMutation({ mutationFn: (id: number) => promotionsApi.endPromotion(id), onSuccess: invalidate });
}

export function useSetHomeOrder() {
  const invalidate = useInvalidatePromotions();
  return useMutation({
    mutationFn: (promotionIds: number[]) => promotionsApi.setHomeOrder(promotionIds),
    onSuccess: invalidate,
  });
}
