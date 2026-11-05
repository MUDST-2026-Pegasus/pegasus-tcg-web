/** Shared order-promotion fields returned by buyer, seller, and admin order APIs. */
export type PromotionOwnerType = "PLATFORM" | "SELLER";

export type AppliedPromotion = {
  code: string;
  ownerType: PromotionOwnerType;
  sellerProfileId?: number | null;
  amount: number;
  status?: string;
};

export type PromotionCodeSummary = Pick<AppliedPromotion, "code" | "ownerType">;
