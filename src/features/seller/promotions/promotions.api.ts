import { api, type PageResponse } from "@/lib/api";
import type { SellerPromotion, SellerPromotionInput, SellerPromotionPage, Summary, Redemption, PromotionStatus } from "./promotions.types";
const root = "/sellers/me/promotions";
export const sellerPromotionApi = {
  list: (status?: PromotionStatus, page = 0) => api.get<SellerPromotionPage>(root, { query: { status, page, size: 20 } }),
  summary: () => api.get<Summary>(`${root}/summary`),
  create: (input: SellerPromotionInput) => api.post<SellerPromotion>(root, input),
  update: (id: number, input: SellerPromotionInput) => api.put<SellerPromotion>(`${root}/${id}`, input),
  pause: (id: number) => api.post<SellerPromotion>(`${root}/${id}/pause`, {}),
  resume: (id: number) => api.post<SellerPromotion>(`${root}/${id}/resume`, {}),
  remove: (id: number) => api.delete<void>(`${root}/${id}`),
  redemptions: (id: number, page = 0) => api.get<PageResponse<Redemption>>(`${root}/${id}/redemptions`, { query: { page, size: 20 } }),
};
