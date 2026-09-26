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
  changedAt: string;
  notes: string | null;
}

export interface SellerOrderDetails {
  id: number;
  salesOrderId: number;
  sellerProfileId: number;
  sellerName?: string | null;
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
}

export interface OrderDetails {
  id: number;
  orderNumber: string;
  buyerId: number;
  status: "PENDING_PAYMENT" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED" | string;
  currency: string;
  itemsSubtotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  shippingAddressId: number | null;
  shippingAddressSnapshot: string | null;
  buyerNote: string | null;
  placedAt: string;
  paidAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  sellerOrders: SellerOrderDetails[];
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
