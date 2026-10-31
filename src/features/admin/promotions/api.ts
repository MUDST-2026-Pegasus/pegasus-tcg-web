import { api } from "@/lib/api";
import type { PageResponse } from "@/lib/api";
import type { AdminPromotion, AdminPromotionInput, AdminPromotionPage, AdminPromotionSummary, PromotionStatus, Redemption } from "./types";

const root = "/admin/promotions";
export const adminPromotionApi = {
  list: (params: { owner?: "PLATFORM" | "SELLER"; status?: PromotionStatus; q?: string; page: number; size: number }) => api.get<AdminPromotionPage>(root, { query: params }),
  summary: () => api.get<AdminPromotionSummary>(`${root}/summary`),
  get: (id: number) => api.get<AdminPromotion>(`${root}/${id}`),
  create: (input: AdminPromotionInput) => api.post<AdminPromotion>(root, input),
  update: (id: number, input: AdminPromotionInput) => api.put<AdminPromotion>(`${root}/${id}`, input),
  remove: (id: number) => api.delete<void>(`${root}/${id}`),
  pause: (id: number, reason?: string, notifySeller = true) => api.post<AdminPromotion>(`${root}/${id}/pause`, { reason, notifySeller }),
  resume: (id: number) => api.post<AdminPromotion>(`${root}/${id}/resume`, { notifySeller: true }),
  homeOrder: (promotionIds: number[]) => api.put<AdminPromotion[]>(`${root}/home-order`, { promotionIds }),
  redemptions: (id: number, page: number) => api.get<PageResponse<Redemption>>(`${root}/${id}/redemptions`, { query: { page, size: 20 } }),
};
