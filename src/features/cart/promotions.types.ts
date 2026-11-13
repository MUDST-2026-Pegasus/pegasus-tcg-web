import type { PromotionOwnerType } from "@/features/promotions/order.types";

export type PromotionOwner = PromotionOwnerType;
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
  codes: PromoCodeOutcome[];
  bestPick: PromotionSelection | null;
}

/**
 * One typed code's result. `ownerType`/`sellerProfileId` say whose code it is (null
 * owner for an unknown code); `slot*` say which slot it was typed in [TCG-769].
 */
export interface PromoCodeOutcome {
  code: string;
  ownerType: PromotionOwner | null;
  sellerProfileId: number | null;
  sellerName: string | null;
  status: string;
  discount: number | null;
  shortfall: number | null;
  pendingShipping: boolean;
  /** Missing on an API older than TCG-769. */
  slotOwnerType?: PromotionOwner;
  slotSellerProfileId?: number | null;
}

export interface PromotionUiError {
  owner: "PLATFORM" | number;
  code?: string;
  message: string;
}
