import type { OrderAuctionSource } from "@/features/auction/auction.types";
import type { AppliedPromotion } from "@/features/promotions/order.types";

export interface OrderItemDetails {
  id: number;
  listingId: number | null;
  catalogVariantId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productName: string;
  variantLabel: string;
  condition: string;
  gameName: string;
  imageKey: string | null;
  imageUrl?: string | null;
  unitIds: number[];
  /** Discount share across the whole line; divide by quantity for per-unit display. */
  discountAllocated?: number;
  /** Discount shares across the whole line; divide by quantity for per-unit display. */
  sellerDiscountAllocated?: number;
  platformDiscountAllocated?: number;
  /** API-provided per-unit refund estimate. */
  refundEstimatePerUnit?: number;
}

export interface ShipmentDetails {
  id: number;
  sellerOrderId: number;
  carrierCode: string;
  carrierName: string;
  trackingNumber: string;
  status: string;
  shippedAt: string | null;
  estimatedDeliveryDate: string | null;
  deliveredAt: string | null;
}

export interface OrderStatusHistory {
  id: number;
  sellerOrderId: number;
  fromStatus: string | null;
  toStatus: string;
  changedBy: number | null;
  createdAt: string;
  note: string | null;
}

export interface SellerOrderDetails {
  id: number;
  salesOrderId: number;
  sellerProfileId: number;
  sellerName?: string | null;
  sellerUsername?: string | null;
  sellerOrderNumber: string;
  status: string;
  itemsSubtotal: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  commissionAmount: number;
  sellerNetAmount: number;
  acceptedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  autoCompleteAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  items: OrderItemDetails[];
  shipments: ShipmentDetails[];
  statusHistory: OrderStatusHistory[];
  sellerDiscount?: number;
  platformDiscount?: number;
  platformSubsidy?: number;
  commissionBase?: number;
  promotions?: AppliedPromotion[];
  promotionsRestoredOnCancel?: boolean;
}

/** `source` / `auctionId` / `auctionNumber` มาจาก OrderAuctionSource [TCG-636] */
export interface OrderDetails extends OrderAuctionSource {
  id: number;
  orderNumber: string;
  buyerId: number;
  status: "PENDING_PAYMENT" | "PAID" | "PARTIALLY_COMPLETED" | "COMPLETED" | "CANCELLED" | "REFUNDED" | string;
  currency: string;
  itemsSubtotal: number;
  shippingTotal: number;
  discountTotal: number;
  /** ส่วนลดราคาสินค้า (ราคาลด) แยกจากโค้ด (SAL-05) — `itemsSubtotal` เป็นยอดหลังลดแล้ว */
  saleDiscountTotal?: number | null;
  grandTotal: number;
  shippingAddressId: number | null;
  shippingAddressSnapshot: string | null;
  buyerNote: string | null;
  placedAt: string;
  paidAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  sellerOrders: SellerOrderDetails[];
  /** A transfer slip is waiting for admin review: no paying again, no cancelling. */
  paymentUnderReview?: boolean;
  /** Last moment a paid order can be cancelled; null before payment. */
  cancellableUntil?: string | null;
  sellerDiscountTotal?: number;
  platformDiscountTotal?: number;
  promotions?: AppliedPromotion[];
  promotionsRestoredOnCancel?: boolean;
}

export interface PageResponse<T> {
  items: T[];
  content?: T[];
  page: number;
  size: number;
  totalElements?: number;
  totalItems?: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
}

export interface ReorderItemDto {
  orderItemId: number;
  catalogVariantId: number;
  productSlug: string;
  productName: string;
  variantLabel: string;
  rarity?: string;
  imageUrl?: string;
  originalCondition: string;
  originalPrice: number;
  originalQuantity: number;
  originalSellerName?: string;
}

export interface ReorderItemsResponse {
  orderId: number;
  orderNumber: string;
  items: ReorderItemDto[];
}

export interface ReorderListingInfo {
  listingId: number;
  condition: string; // "NM" | "LP" | "MP" | "HP" | "DMG" | "SEALED"
  price: number;
  priceChanged?: boolean;
  quantityAvailable: number;
  isAvailable?: boolean;
}

export interface ReorderPreviewItem {
  originalOrderItemId: number;
  catalogVariantId: number;
  productName: string;
  variantLabel: string;
  originalCondition: string;
  originalPrice: number;
  originalQuantity: number;
  imageUrl: string | null;
  currentListing: ReorderListingInfo | null;
  alternativeConditions: ReorderListingInfo[];
  status: "AVAILABLE" | "AVAILABLE_PRICE_CHANGED" | "ALTERNATIVE_AVAILABLE" | "OUT_OF_STOCK";
}

export interface ReorderSellerOrder {
  sellerProfileId: number;
  sellerName: string;
  sellerAvailable: boolean;
  vacationMode: boolean;
  items: ReorderPreviewItem[];
}

export interface ReorderPreviewResponse {
  orderId: number;
  sellerOrders: ReorderSellerOrder[];
}
