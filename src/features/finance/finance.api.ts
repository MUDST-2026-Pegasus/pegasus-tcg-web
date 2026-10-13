import { api } from "@/lib/api";
import type { Payment, Payout, PayoutAccount, Refund, Wallet } from "./finance.types";

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
};
