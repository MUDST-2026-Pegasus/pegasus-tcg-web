import { api } from "@/lib/api";
import type { AdminReview, CommissionRule, CommissionRuleInput, PublicReviews, ReturnEvidenceLink, ReturnInput, ReturnRequest, Review } from "./after-sales.types";

export const afterSalesApi = {
  commissionRules: () => api.get<CommissionRule[]>("/admin/commission-rules"),
  commissionRule: (id: number) => api.get<CommissionRule>(`/admin/commission-rules/${id}`),
  createCommissionRule: (input: CommissionRuleInput) => api.post<CommissionRule>("/admin/commission-rules", input),
  updateCommissionRule: (id: number, input: CommissionRuleInput) => api.put<CommissionRule>(`/admin/commission-rules/${id}`, input),
  deactivateCommissionRule: (id: number) => api.delete<void>(`/admin/commission-rules/${id}`),

  buyerReturns: (sellerOrderId: number) => api.get<ReturnRequest[]>(`/orders/${sellerOrderId}/returns`),
  requestReturn: (sellerOrderId: number, input: ReturnInput) => api.post<ReturnRequest>(`/orders/${sellerOrderId}/returns`, input),
  shipReturn: (sellerOrderId: number, returnId: number, trackingNumber: string) =>
    api.post<ReturnRequest>(`/orders/${sellerOrderId}/returns/${returnId}/ship`, { trackingNumber }),
  sellerReturns: (status?: string) => api.get<ReturnRequest[]>("/sellers/me/returns", status ? { query: { status } } : undefined),
  sellerReturnEvidence: (id: number) => api.get<ReturnEvidenceLink[]>(`/sellers/me/returns/${id}/evidence`),
  approveReturn: (id: number, resolution: "FULL_REFUND" | "PARTIAL_REFUND", refundAmount: number, requireShipBack: boolean) =>
    api.post<ReturnRequest>(`/sellers/me/returns/${id}/approve`, { resolution, refundAmount, requireShipBack }),
  rejectReturn: (id: number) => api.post<ReturnRequest>(`/sellers/me/returns/${id}/reject`),
  receiveReturn: (id: number, restock: boolean) => api.post<ReturnRequest>(`/sellers/me/returns/${id}/receive`, { restock }),

  createReview: (sellerOrderId: number, rating: number, title: string, comment: string) =>
    api.post<Review>(`/orders/${sellerOrderId}/reviews`, { rating, title, comment }),
  publicReviews: (username: string) => api.get<PublicReviews>(`/u/${encodeURIComponent(username)}/reviews`),
  adminReviews: (username: string) => api.get<AdminReview[]>("/admin/reviews", { query: { username } }),
  replyReview: (id: number, comment: string) => api.post<Review>(`/sellers/me/reviews/${id}/reply`, { comment }),
  setReviewVisibility: (id: number, visible: boolean) => api.put<Review>(`/admin/reviews/${id}/visibility`, { visible }),
};
