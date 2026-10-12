export interface CheckoutOrderItemResponse {
  id: number;
  listingId: number | null;
  catalogVariantId: number;
  productName: string;
  variantLabel: string;
  condition: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  unitIds: number[];
  imageUrl?: string | null;
}

export interface CheckoutSellerOrderResponse {
  id: number;
  sellerProfileId: number;
  sellerOrderNumber: string;
  status: string;
  itemsSubtotal: number;
  shippingFee: number;
  grandTotal: number;
  commissionAmount: number;
  sellerNetAmount: number;
  items: CheckoutOrderItemResponse[];
}

export interface CheckoutResponse {
  orderId: number;
  orderNumber: string;
  buyerId: number;
  status: string;
  currency: string;
  itemsSubtotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  placedAt: string;
  sellerOrders: CheckoutSellerOrderResponse[];
  replayed: boolean;
}

export interface CheckoutRequest {
  shippingAddressId?: number | null;
  shippingOptionBySeller?: Record<number, number> | null;
  buyerNote?: string | null;
  cartItemIds?: number[] | null;
}
