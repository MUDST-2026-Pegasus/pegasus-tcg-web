import type { PageResponse } from "@/lib/api";

export type PromotionStatus = "ACTIVE" | "SCHEDULED" | "PAUSED" | "EXPIRED" | "USED_UP";
export interface AdminPromotion {
  id: number; code: string; name: string; description: string | null; ownerType: "PLATFORM" | "SELLER";
  owner: { id: number; name: string; username?: string } | null;
  discountType: "PERCENT" | "FIXED" | "FREE_SHIPPING"; discountValue: number; maxDiscount: number | null;
  minSpend: number; scopeType: "ALL" | "GAME" | "CATEGORY"; scopeIds: number[];
  visibility: "PUBLIC" | "PRIVATE"; newBuyerOnly: boolean;
  usageLimitTotal: number | null; usageLimitPerUser: number; usedCount: number;
  claimable: boolean; claimRequired: boolean; claimLimit: number | null; claimedCount: number;
  featuredOnHome: boolean; homeSort: number | null; startsAt: string; endsAt: string;
  status: PromotionStatus; pausedAt: string | null; pauseReason: string | null; createdAt: string;
}
export type AdminPromotionInput = Pick<AdminPromotion, "code" | "name" | "description" | "discountType" | "discountValue" | "maxDiscount" | "minSpend" | "scopeType" | "scopeIds" | "visibility" | "newBuyerOnly" | "usageLimitTotal" | "usageLimitPerUser" | "startsAt" | "endsAt" | "claimable" | "claimRequired" | "claimLimit" | "featuredOnHome">;
export interface AdminPromotionPage { page: PageResponse<AdminPromotion>; statusCounts: Record<PromotionStatus, number> }
export interface AdminPromotionSummary { activePlatformCodes: number; activeSellerCodes: number; redemptions30d: number; redemptionsChangePercent: number | null; claims30d: number; platformDiscountCost30d: number; salesWithCodes30d: number }
export interface Redemption { id: number; salesOrderId: number; orderNumber: string; buyer: { id: number; name: string }; amount: number; status: string; createdAt: string }
