const walletEntryLabels: Record<string, string> = {
  SELLER_EARNING: "รายได้จากการขาย",
  REFUND_OUT: "หักยอดคืนเงิน",
  PAYOUT_OUT: "ถอนเงินเข้าบัญชี",
  ADJUSTMENT: "ปรับปรุงยอดเงิน",
};

export const walletEntryLabel = (type: string) => walletEntryLabels[type] ?? "รายการ Wallet อื่น";
