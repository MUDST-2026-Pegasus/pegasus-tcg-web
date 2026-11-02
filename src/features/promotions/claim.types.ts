import type { PromotionOwner } from "@/features/cart/promotions.types";

export type DiscountType = "PERCENT" | "FIXED" | "FREE_SHIPPING";
/** Where the "เก็บโค้ด" button was; the BE fills in HOME/STORE from the code itself when omitted. */
export type ClaimSource = "HOME" | "STORE" | "WALLET_INPUT" | "CART";
export type WalletTab = "AVAILABLE" | "USED" | "EXPIRED";
export type PromotionStatus = "SCHEDULED" | "ACTIVE" | "PAUSED" | "USED_UP" | "EXPIRED";

/** The shop behind a shop code, for "ไปที่ร้าน". */
export interface PromotionShop {
  sellerProfileId: number;
  name: string;
  username: string;
}

/** A ticket on the home or store strip (`GET /promotions/featured`, `GET /u/{username}/promotions`). */
export interface ClaimableCode {
  id: number;
  code: string;
  name: string;
  description: string | null;
  ownerType: PromotionOwner;
  shop: PromotionShop | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minSpend: number;
  endsAt: string;
  claimRequired: boolean;
  /** null = unlimited, 0 = all handed out */
  remainingClaims: number | null;
  /** always false for a guest */
  claimed: boolean;
}

export interface ClaimResult {
  claim: {
    id: number;
    promotionId: number;
    code: string;
    source: ClaimSource;
    claimedAt: string;
  };
  alreadyClaimed: boolean;
}

/** `GET /promotions/{code}/terms` — the "เงื่อนไขโค้ด" modal. */
export interface PromotionTerms {
  id: number;
  code: string;
  name: string;
  description: string | null;
  ownerType: PromotionOwner;
  shop: PromotionShop | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minSpend: number;
  scopeType: "ALL" | "GAME" | "CATEGORY";
  scopeTargets: Array<{ id: number; name: string }>;
  startsAt: string;
  endsAt: string;
  usageLimitPerUser: number;
  newBuyerOnly: boolean;
  stacksWithShopCodes: boolean;
  claimable: boolean;
  claimRequired: boolean;
  remainingClaims: number | null;
  status: PromotionStatus;
  claimed: boolean;
}

export interface WalletCode {
  id: number;
  code: string;
  name: string;
  description: string | null;
  ownerType: PromotionOwner;
  shop: PromotionShop | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minSpend: number;
  startsAt: string;
  endsAt: string;
  status: PromotionStatus;
  /** null for a code typed straight in at checkout and never collected */
  claimedAt: string | null;
  usesLeft: number;
  uses: Array<{
    salesOrderId: number;
    orderNumber: string;
    amount: number;
    status: string;
    at: string;
  }>;
}

export interface Wallet {
  tab: WalletTab;
  items: WalletCode[];
  counts: Partial<Record<WalletTab, number>>;
}
