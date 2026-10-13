export type Payment = {
  id: number;
  salesOrderId: number;
  method: string;
  status: string;
  amount: number;
  expiresAt: string;
  transferAccountJson: string;
  referenceCode: string | null;
  failureReason: string | null;
};

export type PaymentReview = Pick<Payment, "id" | "salesOrderId" | "amount" | "status" | "referenceCode"> & {
  slipUrl: string | null;
};

export type Refund = {
  id: number;
  salesOrderId: number;
  sellerOrderId: number | null;
  amount: number;
  reason: string;
  status: string;
  method: string;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  transferReference: string | null;
  requestedAt: string;
  processedAt: string | null;
};

export type RefundTransferAttempt = {
  id: number;
  refundId: number;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  transferReference: string | null;
};

export type Payout = {
  id: number;
  sellerProfileId: number;
  amount: number;
  currency: string;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  transferReference: string | null;
  rejectionReason: string | null;
};

export type Wallet = {
  balanceAvailable: number;
  balancePending: number;
  reservedForPayout: number;
  withdrawable: number;
  entries: {
    items: Array<{ id: number; type: string; direction: string; amount: number; createdAt: string }>;
    totalItems: number;
  };
};

export type PayoutAccount = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};
