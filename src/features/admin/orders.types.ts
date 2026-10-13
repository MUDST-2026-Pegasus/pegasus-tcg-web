/**
 * ลอกจาก `dto/AdminOrderViews.java` และ `dto/SellerOrderDetailsResponse.java`
 * ของ pegasus-tcg-api ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 *
 * ค่าทุกตัวเป็นค่าดิบ (เงินเป็น number, เวลาเป็น ISO string, สถานะเป็นโค้ด)
 * การแปลงเป็นข้อความอยู่ที่ `orders.format.ts`
 */

/** `model/SellerOrderStatus.java` */
export type SellerOrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";

/** `model/AdminOrderColumn.java` — เรียงตามลำดับคอลัมน์บน board */
export type OrderBoardColumnKey =
  | "PENDING_PAYMENT"
  | "AWAITING_SHIPMENT"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "DISPUTED";

/** `ck_return_reason` ใน migration */
export type ReturnReasonCode =
  | "NOT_AS_DESCRIBED"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "NOT_RECEIVED"
  | "COUNTERFEIT"
  | "OTHER";

/** `AdminOrderRepository.AdminOrderQuery.Sort` */
export type AdminOrderSort =
  | "NEWEST"
  | "OLDEST"
  | "PAID_OLDEST"
  | "SHIPPED_NEWEST"
  | "COMPLETED_NEWEST"
  | "TOTAL_DESC";

/** ผู้ขาย: `id` = seller_profile.id / ผู้ซื้อ: `id` = user_account.id */
export type OrderParty = {
  id: number;
  username: string;
  displayName: string;
};

export type OrderTracking = {
  carrierName: string | null;
  trackingNumber: string;
};

/** หนึ่งแถว = seller_order หนึ่งใบ (ส่วนของผู้ขายหนึ่งคนในคำสั่งซื้อ) */
export type AdminOrderSummary = {
  sellerOrderId: number;
  sellerOrderNumber: string;
  salesOrderId: number;
  /** เลขคำสั่งซื้อที่ผู้ซื้อเห็น เช่น "PGS-20261013-000123" */
  orderNumber: string;
  status: SellerOrderStatus;
  grandTotal: number;
  itemCount: number;
  seller: OrderParty;
  buyer: OrderParty;
  createdAt: string;
  /** เวลาจ่ายของคำสั่งซื้อแม่ ทุก sub-order ใช้ค่าเดียวกัน */
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  tracking: OrderTracking | null;
  returnReasonCode: ReturnReasonCode | null;
  /** 1–5, null จนกว่าผู้ซื้อจะรีวิว */
  reviewRating: number | null;
};

export type OrderBoardColumn = {
  key: OrderBoardColumnKey;
  statuses: SellerOrderStatus[];
  /** จำนวนทั้งหมดของคอลัมน์ ไม่ใช่แค่ที่อยู่ใน `items` */
  count: number;
  items: AdminOrderSummary[];
};

export type OrderBoardAlerts = {
  openDisputeCount: number;
  /** ค้างชำระเกิน `paymentTimeoutMinutes` — ปกติควรเป็น 0 เพราะมีงานยกเลิกอัตโนมัติ */
  overduePaymentCount: number;
  paymentTimeoutMinutes: number;
};

export type OrderBoard = {
  columns: OrderBoardColumn[];
  alerts: OrderBoardAlerts;
};

export type AdminOrderListParams = {
  statuses: SellerOrderStatus[];
  q?: string;
  sort: AdminOrderSort;
  page: number;
  size: number;
};

// ---------- รายละเอียด (ลอกจาก SellerOrderDetailsResponse) ----------

export type OrderItemDetail = {
  id: number;
  listingId: number | null;
  catalogVariantId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productName: string;
  variantLabel: string | null;
  condition: string | null;
  gameName: string | null;
  imageKey: string | null;
  /** presigned GET อายุสั้น ห้ามเก็บ */
  imageUrl: string | null;
  unitIds: number[];
};

export type OrderShipment = {
  id: number;
  sellerOrderId: number;
  carrierCode: string | null;
  carrierName: string;
  trackingNumber: string;
  status: string;
  shippedAt: string | null;
  estimatedDeliveryDate: string | null;
  deliveredAt: string | null;
  proofImageKey: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatusChange = {
  id: number;
  sellerOrderId: number;
  fromStatus: SellerOrderStatus | null;
  toStatus: SellerOrderStatus;
  changedBy: number | null;
  note: string | null;
  createdAt: string;
};

export type SellerOrderDetail = {
  id: number;
  salesOrderId: number;
  sellerProfileId: number;
  sellerOrderNumber: string;
  status: SellerOrderStatus;
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
  items: OrderItemDetail[];
  shipments: OrderShipment[];
  statusHistory: OrderStatusChange[];
  sellerName: string | null;
};

/** `payment.method` */
export type PaymentMethod =
  | "BANK_TRANSFER"
  | "MOCK_GATEWAY"
  | "WALLET"
  | "CASH_ON_DELIVERY";

/** `payment.status` */
export type PaymentStatus =
  | "PENDING"
  | "AWAITING_VERIFICATION"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type OrderPayment = {
  id: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  paidAt: string | null;
  failureReason: string | null;
};

export type AdminOrderDetail = {
  summary: AdminOrderSummary;
  order: SellerOrderDetail;
  /** JSON ของที่อยู่ตอน checkout (`CheckoutService.createAddressSnapshot`) — มี PII */
  shippingAddressSnapshot: string | null;
  buyerNote: string | null;
  /** ความพยายามจ่ายเงินครั้งล่าสุดของคำสั่งซื้อแม่ */
  payment: OrderPayment | null;
};

/** key ใน `shippingAddressSnapshot` */
export type ShippingAddressSnapshot = {
  recipientName?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string;
  postalCode?: string;
  countryCode?: string;
};
