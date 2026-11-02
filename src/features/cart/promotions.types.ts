export type PromotionOwner = "PLATFORM" | "SELLER";
export type PromotionSource = "CLAIMED" | "CLAIMABLE" | "PUBLIC";

export interface AvailablePromotion {
  id: number;
  code: string;
  name: string;
  ownerType: PromotionOwner;
  sellerProfileId: number | null;
  sellerName: string | null;
  discountType: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
  maxDiscount: number | null;
  minSpend: number;
  endsAt: string;
  source: PromotionSource;
  remainingClaims: number | null;
  applicable: boolean;
  estimatedDiscount: number | null;
  reason: string | null;
  shortfall: number | null;
}

export interface PromotionSelection {
  platformCode: string | null;
  sellerCodes: Record<number, string>;
}

export interface PromoPreviewRequest extends PromotionSelection {
  cartItemIds: number[];
  shippingOptionBySeller?: Record<number, number>;
  autoPick?: boolean;
}

export interface PromoPreview {
  sellers: Array<{
    sellerProfileId: number;
    sellerName: string;
    itemsSubtotal: number;
    shippingFee: number | null;
    sellerDiscount: number;
    platformDiscount: number;
    grandTotal: number;
  }>;
  itemsSubtotal: number;
  shippingTotal: number | null;
  sellerDiscountTotal: number;
  platformDiscountTotal: number;
  grandTotal: number;
  shippingEstimated: boolean;
  codes: Array<{
    code: string;
    ownerType: PromotionOwner;
    sellerProfileId: number | null;
    sellerName: string | null;
    status: string;
    discount: number | null;
    shortfall: number | null;
    pendingShipping: boolean;
  }>;
  bestPick: PromotionSelection | null;
}

export interface PromotionUiError {
  owner: "PLATFORM" | number;
  code?: string;
  message: string;
}
