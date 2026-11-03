import { api } from "@/lib/api";
import type { PromotionOwner } from "@/features/cart/promotions.types";
import type {
  ClaimableCode,
  ClaimResult,
  ClaimSource,
  PromotionTerms,
  Wallet,
  WalletTab,
} from "./claim.types";

/** Collecting codes and "โค้ดของฉัน" [TCG-576]. */
export const claimApi = {
  featured: () => api.get<ClaimableCode[]>("/promotions/featured"),

  storeCodes: (username: string) =>
    api.get<ClaimableCode[]>(`/u/${encodeURIComponent(username)}/promotions`),

  terms: (code: string) =>
    api.get<PromotionTerms>(`/promotions/${encodeURIComponent(code)}/terms`),

  claim: (id: number, source?: ClaimSource) =>
    api.post<ClaimResult>(`/promotions/${id}/claim`, source ? { source } : {}),

  claimByCode: (code: string) =>
    api.post<ClaimResult>("/me/promotions/claim-by-code", { code }),

  wallet: (tab: WalletTab, owner?: PromotionOwner) =>
    api.get<Wallet>("/me/promotions", { query: { tab, owner } }),
};
