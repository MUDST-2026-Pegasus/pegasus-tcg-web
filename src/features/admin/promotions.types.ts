import type { PageResponse } from "@/lib/api";

/**
 * โปรโมชั่นฝั่งแอดมิน — ตรงกับ `dto/AdminPromotionViews.java` และ `AdminPromotionRequest.java`
 * ถ้าฝั่งโน้นเปลี่ยน ต้องตามมาแก้ที่นี่
 */

export type PromotionStatus = "ACTIVE" | "SCHEDULED" | "PAUSED" | "EXPIRED" | "USED_UP";
export type PromotionOwnerType = "PLATFORM" | "SELLER";
export type PromotionDiscountType = "PERCENT" | "FIXED" | "FREE_SHIPPING";
export type PromotionScopeType = "ALL" | "GAME" | "CATEGORY";
export type PromotionVisibility = "PUBLIC" | "PRIVATE";
export type RedemptionStatus = "RESERVED" | "CONSUMED" | "RELEASED";

/** `Party` ฝั่ง backend — ร้านเจ้าของโค้ด หรือผู้ซื้อที่ใช้โค้ด */
export type PromotionParty = {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type AdminPromotion = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  ownerType: PromotionOwnerType;
  /** `null` สำหรับโค้ด Pegasus */
  owner: PromotionParty | null;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minSpend: number;
  scopeType: PromotionScopeType;
  scopeIds: number[];
  visibility: PromotionVisibility;
  newBuyerOnly: boolean;
  /** `null` = ไม่จำกัด */
  usageLimitTotal: number | null;
  usageLimitPerUser: number;
  usedCount: number;
  claimable: boolean;
  claimRequired: boolean;
  /** `null` = เก็บได้ไม่จำกัด */
  claimLimit: number | null;
  claimedCount: number;
  featuredOnHome: boolean;
  /** 0 = ใบแรกบนหน้าแรก */
  homeSort: number | null;
  startsAt: string;
  endsAt: string;
  status: PromotionStatus;
  pausedAt: string | null;
  pauseReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** ผู้สร้างโค้ด — `null` สำหรับโค้ดที่ seed ไว้ */
  createdBy: PromotionParty | null;
  /** ผู้หยุดโค้ด ระหว่างที่หยุดอยู่ */
  pausedBy: PromotionParty | null;
  /** ส่วนลดที่โค้ดนี้หักจากออเดอร์ที่ชำระแล้ว */
  discountTotal: number;
  /** ยอดรวมของออเดอร์ที่ชำระแล้วที่ใช้โค้ดนี้ */
  salesTotal: number;
  /** ออเดอร์ที่ถือโค้ดไว้ระหว่างรอชำระ */
  reservedOrders: number;
};

export type AdminPromotionInput = Pick<
  AdminPromotion,
  | "code"
  | "name"
  | "description"
  | "discountType"
  | "discountValue"
  | "maxDiscount"
  | "minSpend"
  | "scopeType"
  | "scopeIds"
  | "visibility"
  | "newBuyerOnly"
  | "usageLimitTotal"
  | "usageLimitPerUser"
  | "startsAt"
  | "endsAt"
  | "claimable"
  | "claimRequired"
  | "claimLimit"
  | "featuredOnHome"
  | "homeSort"
>;

export type AdminPromotionPage = {
  page: PageResponse<AdminPromotion>;
  statusCounts: Record<PromotionStatus, number>;
};

export type AdminPromotionQuery = {
  owner?: PromotionOwnerType;
  status?: PromotionStatus;
  q?: string;
  page: number;
  size: number;
};

export type AdminPromotionSummary = {
  activePlatformCodes: number;
  activeSellerCodes: number;
  redemptions30d: number;
  /** `null` เมื่อเดือนก่อนยังไม่มีการใช้โค้ด */
  redemptionsChangePercent: number | null;
  claims30d: number;
  platformDiscountCost30d: number;
  salesWithCodes30d: number;
  /** ยอดรวมทุกออเดอร์ที่ชำระใน 30 วัน — ฐานของ "% ของ GMV" */
  gmv30d: number;
  paidOrders30d: number;
  /** ในจำนวนนั้น ออเดอร์ที่ใช้โค้ด — ฐานของ "% ของออเดอร์ทั้งหมด" */
  ordersWithCodes30d: number;
};

export type PromotionRedemption = {
  id: number;
  salesOrderId: number;
  orderNumber: string;
  buyer: PromotionParty;
  amount: number;
  status: RedemptionStatus;
  createdAt: string;
};
