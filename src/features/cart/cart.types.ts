export interface CartItemResponse {
  id: number;
  cartId: number;
  listingId: number;
  quantity: number;
  unitPriceAtAdd: number;
  currentPrice: number;
  priceChanged: boolean;
  purchasable: boolean;
  quantityAvailable: number | null;
  sellerProfileId: number | null;
  catalogVariantId: number | null;
  condition: string;
  currency: string;
  addedAt: string;
  updatedAt: string;
  productName: string | null;
  variantLabel: string | null;
  sellerName: string | null;
  imageUrl: string | null;
}

export interface CartResponse {
  id: number;
  userId: number | null;
  sessionKey: string | null;
  currency: string;
  items: CartItemResponse[];
  totalQuantity: number;
  itemsSubtotal: number;
  expiresAt: string | null;
}

export interface AddCartItemRequest {
  listingId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
