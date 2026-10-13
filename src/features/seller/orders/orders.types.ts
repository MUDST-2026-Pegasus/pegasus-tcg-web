import type { SellerOrderStatus } from "@/features/seller/shared/seller.types";

// ---------- ข้อมูลจาก `/sellers/me/orders` ----------
// ลอกมาจาก `dto/SellerOrderViews.java`, `dto/SellerOrderDetailsResponse.java`,
// `dto/OrderItemDetailsResponse.java`, `dto/ShipmentResponse.java`,
// `dto/OrderStatusHistoryResponse.java` และ `dto/ShipOrderRequest.java`
// ถ้าฝั่งนั้นแก้ ส่วนนี้ต้องแก้ตาม — ค่าดิบทั้งหมด ข้อความไปจัดใน orders.format.ts

export type OrderItem = {
  id: number;
  listingId: number | null;
  catalogVariantId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** snapshot ตอนสั่ง — แก้แคตตาล็อกทีหลังชื่อในออเดอร์ไม่เปลี่ยน */
  productName: string;
  variantLabel: string | null;
  /** `CardCondition` เช่น "NM" */
  condition: string | null;
  gameName: string | null;
  imageKey: string | null;
  /** presigned GET อายุสั้น — ห้ามเก็บไว้ใช้ทีหลัง */
  imageUrl: string | null;
  unitIds: number[];
};

export type Shipment = {
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

export type StatusHistoryEntry = {
  id: number;
  sellerOrderId: number;
  fromStatus: SellerOrderStatus | null;
  toStatus: SellerOrderStatus;
  /** `null` = ระบบทำเอง (เช่น ยกเลิกเพราะไม่จ่ายตามกำหนด) */
  changedBy: number | null;
  note: string | null;
  createdAt: string;
};

export type SellerOrderDetails = {
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
  items: OrderItem[];
  /** ใหม่สุดก่อน */
  shipments: Shipment[];
  /** เก่าสุดก่อน */
  statusHistory: StatusHistoryEntry[];
  sellerName: string | null;
};

export type OrderBuyer = {
  id: number;
  username: string;
  displayName: string | null;
};

/** หนึ่งแถวในหน้ารายการ */
export type SellerOrderSummary = {
  order: SellerOrderDetails;
  /** เลขออเดอร์ของผู้ซื้อ `PGS-…` — ผู้ซื้อทักมาด้วยเลขนี้ */
  orderNumber: string;
  buyer: OrderBuyer;
  paidAt: string | null;
  /** วันที่จ่าย + จำนวนวันเตรียมของของร้าน — `null` = ยังไม่จ่าย */
  shipBy: string | null;
  /** JSON ของที่อยู่ตอนสั่ง แปลงด้วย `parseShippingAddress()` */
  shippingAddressSnapshot: string | null;
  buyerNote: string | null;
};

/** `payment.method` */
export type PaymentMethod =
  | "BANK_TRANSFER"
  | "MOCK_GATEWAY"
  | "WALLET"
  | "CASH_ON_DELIVERY";

/** `payment.status` */
export type PaymentRecordStatus =
  | "PENDING"
  | "AWAITING_VERIFICATION"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type OrderPayment = {
  method: PaymentMethod;
  status: PaymentRecordStatus;
  amount: number;
  paidAt: string | null;
};

export type SellerOrderDetail = {
  summary: SellerOrderSummary;
  /** `null` = ยังไม่เคยมีการจ่าย */
  payment: OrderPayment | null;
  /** ต้นทุนการ์ดตามค่าเฉลี่ยที่ freeze ไว้ตอนขาย */
  costTotal: number;
  /** จำนวนครั้งที่ผู้ซื้อคนนี้จ่ายเงินกับร้าน รวมออเดอร์นี้ */
  buyerOrderCount: number;
};

/** จำนวนออเดอร์ของร้านแยกตามสถานะ — สถานะที่ไม่มีเลยไม่อยู่ใน object */
export type SellerOrderCounts = Partial<Record<SellerOrderStatus, number>>;

/** `AdminOrderQuery.Sort` ฝั่ง backend (ใช้ query เดียวกัน) */
export type SellerOrderSort =
  | "NEWEST"
  | "OLDEST"
  | "PAID_OLDEST"
  | "SHIPPED_NEWEST"
  | "COMPLETED_NEWEST"
  | "TOTAL_DESC";

export type SellerOrderQuery = {
  statuses: SellerOrderStatus[];
  /** เลขออเดอร์ หรือชื่อผู้ซื้อ */
  q?: string;
  sort?: SellerOrderSort;
  /** เริ่มที่ 0 ตาม backend */
  page: number;
  size: number;
};

/** `ShipOrderRequest.java` */
export type ShipOrderPayload = {
  carrierName: string;
  trackingNumber: string;
  carrierCode?: string;
  estimatedDeliveryDate?: string;
};

/** `SellerCancelOrderRequest.java` */
export type CancelOrderPayload = {
  reason: string;
};

/** ที่อยู่ตามที่ checkout snapshot ไว้ — ทุกช่องอาจไม่มี เพราะเป็น JSON ที่เก็บไว้ตามเวลา */
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
