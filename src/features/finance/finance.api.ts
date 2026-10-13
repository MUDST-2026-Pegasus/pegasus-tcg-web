import { api } from "@/lib/api";
import type { Payment, PaymentReview, Payout, PayoutAccount, Refund, RefundTransferAttempt, Wallet } from "./finance.types";

export const financeApi = {
  createPayment: (salesOrderId: number, key: string) =>
    api.post<Payment>("/payments", { salesOrderId, method: "BANK_TRANSFER" }, {
      headers: { "Idempotency-Key": key },
    }),
  getPayment: (id: number) => api.get<Payment>(`/payments/${id}`),
  attachPaymentSlip: (id: number, slipImageKey: string, referenceCode?: string) =>
    api.post<Payment>(`/payments/${id}/slip`, { slipImageKey, referenceCode }),
  myRefunds: () => api.get<Refund[]>("/refunds"),
  getRefund: (id: number) => api.get<Refund>(`/refunds/${id}`),
  setRefundDestination: (id: number, bankName: string, accountName: string, accountNumber: string) =>
    api.put<Refund>(`/refunds/${id}/destination`, { bankName, accountName, accountNumber }),
  wallet: () => api.get<Wallet>("/me/wallet"),
  myPayouts: () => api.get<Payout[]>("/sellers/me/payouts"),
  payoutAccount: () => api.get<PayoutAccount>("/sellers/me/payout-account"),
  requestPayout: (amount: number) => api.post<Payout>("/sellers/me/payouts", { amount }),
  adminPayments: () => api.get<PaymentReview[]>("/admin/payments"),
  verifyPayment: (id: number, approved: boolean, reason?: string) =>
    api.post<Payment>(`/admin/payments/${id}/verify`, { approved, reason }),
  adminRefunds: async () => {
    const [approved, processing] = await Promise.all([
      api.get<Refund[]>("/admin/refunds", { query: { status: "APPROVED" } }),
      api.get<Refund[]>("/admin/refunds", { query: { status: "PROCESSING" } }),
    ]);
    return [...approved, ...processing];
  },
  refundTransfers: (id: number) => api.get<RefundTransferAttempt[]>(`/admin/refunds/${id}/transfers`),
  startRefund: (id: number, accountNumber: string) =>
    api.post<Refund>(`/admin/refunds/${id}/processing`, { accountNumber }),
  completeRefund: (id: number, transferReference: string) =>
    api.post<Refund>(`/admin/refunds/${id}/processed`, { transferReference }),
  failRefund: (id: number, reason: string) =>
    api.post<Refund>(`/admin/refunds/${id}/failed`, { reason }),
  adminPayouts: async () => (await api.get<Payout[]>("/admin/payouts"))
    .filter((payout) => ["REQUESTED", "APPROVED", "PROCESSING"].includes(payout.status)),
  approvePayout: (id: number) => api.post<Payout>(`/admin/payouts/${id}/approve`),
  processPayout: (id: number) => api.post<Payout>(`/admin/payouts/${id}/processing`),
  completePayout: (id: number, transferReference: string, slipImageKey: string) =>
    api.post<Payout>(`/admin/payouts/${id}/paid`, { transferReference, slipImageKey }),
  rejectPayout: (id: number, reason: string) =>
    api.post<Payout>(`/admin/payouts/${id}/reject`, { reason }),
  failPayout: (id: number, reason: string) =>
    api.post<Payout>(`/admin/payouts/${id}/fail`, { reason }),
};
