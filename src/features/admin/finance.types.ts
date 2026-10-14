/**
 * ลอกจาก `dto/AdminFinanceViews.java` ใน `pegasus-tcg-api` — ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 * เงินเป็น number (BigDecimal ส่งมาเป็นตัวเลข) เวลาเป็น ISO string
 */

/** buyer → `user_account.id` · seller → `seller_profile.id` */
export type FinanceParty = {
  id: number;
  username: string;
  displayName: string;
};

export type BankAccount = {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string;
};

/* ── ตรวจสอบสลิปชำระเงิน ─────────────────────────────────────────── */

export type PaymentStatus =
  | "PENDING"
  | "AWAITING_VERIFICATION"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

/** ส่วนของร้านหนึ่งในคำสั่งซื้อ — อนุมัติแล้วกลายเป็น escrow ของร้านนั้น */
export type SellerSplit = {
  sellerOrderId: number;
  sellerOrderNumber: string;
  seller: FinanceParty;
  grandTotal: number;
};

export type PaymentReview = {
  id: number;
  salesOrderId: number;
  orderNumber: string;
  buyer: FinanceParty;
  amount: number;
  /** ยอดที่คำสั่งซื้อยังค้าง — backend ไม่ให้อนุมัติถ้าไม่เท่ากับ `amount` */
  unpaidTotal: number;
  status: PaymentStatus;
  method: string;
  referenceCode: string | null;
  /** presigned URL อายุสั้น — หมดอายุแล้วต้องดึงคิวใหม่ */
  slipUrl: string | null;
  failureReason: string | null;
  createdAt: string;
  /** เส้นตายชำระของคำสั่งซื้อ */
  expiresAt: string;
  verifiedAt: string | null;
  splits: SellerSplit[];
};

export type PaymentSummary = {
  awaitingVerification: number;
  approvedToday: number;
  rejectedToday: number;
  /** เปิดรายการชำระแล้วแต่ยังไม่แนบสลิป */
  awaitingTransfer: number;
};

/* ── คืนเงิน ─────────────────────────────────────────────────────── */

export type RefundStatus =
  | "PENDING"
  | "APPROVED"
  | "PROCESSING"
  | "PROCESSED"
  | "REJECTED";

export type AdminRefund = {
  id: number;
  salesOrderId: number;
  orderNumber: string;
  sellerOrderId: number | null;
  sellerOrderNumber: string | null;
  returnRequestId: number | null;
  /** มีเมื่อมาจากคำขอคืนสินค้า เช่น PARTIAL_REFUND / FULL_REFUND */
  resolution: string | null;
  buyer: FinanceParty;
  seller: FinanceParty | null;
  amount: number;
  reason: string;
  status: RefundStatus;
  method: string;
  /** บัญชีที่ผู้ซื้อระบุ — `accountNumber: null` = ยังไม่ระบุ */
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  transferReference: string | null;
  /** escrow ของ sub-order นี้ — `null` = ไม่เคยพักเงิน */
  escrowAmount: number | null;
  /** คืนไปแล้วจาก escrow นี้ (รวมรายการนี้เมื่อ PROCESSED) */
  escrowRefunded: number | null;
  failedAttempts: number;
  lastFailureReason: string | null;
  requestedAt: string;
  processedAt: string | null;
};

export type RefundSummary = {
  ready: number;
  processing: number;
  /** พร้อมโอนแต่ครั้งล่าสุดโอนไม่สำเร็จ — รอผู้ซื้อแก้บัญชี */
  failedAwaitingBuyer: number;
  processedThisMonth: number;
  processedAmountThisMonth: number;
};

export type RefundTransferAttempt = {
  id: number;
  refundId: number;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  status: "PROCESSING" | "PROCESSED" | "FAILED";
  startedBy: number;
  startedAt: string;
  completedBy: number | null;
  completedAt: string | null;
  transferReference: string | null;
  failureReason: string | null;
};

/* ── ถอนเงินผู้ขาย ───────────────────────────────────────────────── */

export type PayoutStatus =
  | "REQUESTED"
  | "APPROVED"
  | "PROCESSING"
  | "PAID"
  | "REJECTED"
  | "FAILED";

export type PayoutAccount = BankAccount & {
  verifiedAt: string | null;
};

export type WalletSnapshot = {
  available: number;
  pending: number;
  /** ยอดจองของคำขอถอนที่ยังเปิดอยู่ทั้งหมดของผู้ขายคนนี้ (รวมรายการนี้) */
  reserved: number;
};

export type PayoutOrder = {
  sellerOrderId: number;
  sellerOrderNumber: string;
  sellerNetAmount: number;
  completedAt: string | null;
};

export type AdminPayout = {
  id: number;
  sellerProfileId: number;
  seller: FinanceParty;
  amount: number;
  currency: string;
  status: PayoutStatus;
  account: PayoutAccount | null;
  wallet: WalletSnapshot;
  requestedAt: string;
  approvedAt: string | null;
  /** ชื่อแอดมินที่อนุมัติ */
  approvedBy: string | null;
  paidAt: string | null;
  transferReference: string | null;
  rejectionReason: string | null;
  /** PAID = ที่ผูกจริง · ยังไม่จ่าย = รายการที่จะถูกผูกเมื่อยืนยันจ่าย */
  orders: PayoutOrder[];
  ordersLinked: boolean;
};

export type PayoutSummary = {
  requested: number;
  inProgress: number;
  paidAmountThisMonth: number;
  /** ปฏิเสธ/โอนไม่สำเร็จ ของคำขอที่ยื่นเดือนนี้ */
  closedThisMonth: number;
};

/* ── ตั้งค่า ─────────────────────────────────────────────────────── */

/** `GET /admin/settings/{key}` — value เป็น JSON string เช่น `"false"` */
export type PlatformSetting = {
  key: string;
  value: string;
  description: string;
  updatedBy: number | null;
};
