export type CommissionRule = {
  id: number; scope: "GLOBAL" | "GAME" | "CATEGORY" | "SELLER";
  gameId: number | null; categoryId: number | null; sellerProfileId: number | null;
  ratePercent: number; fixedFee: number; minFee: number | null; maxFee: number | null;
  priority: number; effectiveFrom: string; effectiveTo: string | null; active: boolean;
};
export type CommissionRuleInput = Omit<CommissionRule, "id">;
export type PlatformSetting = { key: string; value: string; description: string; updatedBy: number | null };

export type ReturnRequest = {
  id: number; sellerOrderId: number; reasonCode: string; description: string | null;
  status: string; resolution: string | null; refundAmount: number | null;
  evidenceKeys: string[]; returnTrackingNumber: string | null;
  requestedAt: string; reviewedAt: string | null; receivedAt: string | null; closedAt: string | null;
};
export type SellerReturnItem = {
  returnItemId: number;
  orderItemId: number;
  cardName: string;
  variantLabel: string;
  conditionCode: string;
  imageUrl: string | null;
  unitPrice: number;
  quantityReturned: number;
  quantityOrdered: number;
  restock: boolean;
};
export type BuyerSummary = {
  username: string;
  displayName: string;
};
export type SellerReturnRequest = ReturnRequest & {
  sellerOrderNumber: string;
  buyer: BuyerSummary;
  sellerOrderGrandTotal: number;
  deliveredAt: string | null;
  autoCompleteAt: string | null;
  items: SellerReturnItem[];
};
export type ReturnEvidenceLink = { number: number; url: string };
export type ReturnInput = {
  reasonCode: string; description: string; evidenceKeys: string[];
  items: Array<{ orderItemId: number; quantity: number }>;
};

export type Review = {
  id: number; sellerOrderId: number; rating: number; title: string | null;
  comment: string; replyComment: string | null; visible: boolean;
  createdAt: string; repliedAt: string | null;
};
export type PublicReview = Pick<Review, "id" | "rating" | "title" | "comment" | "replyComment" | "createdAt"> & {
  reviewerUsername: string;
  repliedAt?: string | null;
};
export type PublicReviews = {
  reviews: PublicReview[];
  summary: { ratingCount: number; ratingAvg: number; count1: number; count2: number; count3: number; count4: number; count5: number } | null;
};
