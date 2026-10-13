import { api } from "@/lib/api";

import type {
  AdminPayout,
  AdminRefund,
  PaymentReview,
  PaymentStatus,
  PaymentSummary,
  PayoutStatus,
  PayoutSummary,
  PlatformSetting,
  RefundStatus,
  RefundSummary,
  RefundTransferAttempt,
} from "./finance.types";

/**
 * หลังบ้านการเงินของแอดมิน — ตรวจสลิป / คืนเงิน / ถอนเงินผู้ขาย
 * ฟังก์ชันเปล่า ๆ หนึ่งตัวต่อหนึ่ง endpoint (`/admin/payments`, `/admin/refunds`, `/admin/payouts`)
 */

export const SLIP_AUTO_APPROVE_KEY = "payment.slip_auto_approve";
export const TRANSFER_ACCOUNT_KEY = "payment.transfer_account";

/* ── ตรวจสอบสลิป ── */

export function getPaymentQueue(status: PaymentStatus = "AWAITING_VERIFICATION") {
  return api.get<PaymentReview[]>("/admin/payments", { query: { status } });
}

export function getPaymentSummary() {
  return api.get<PaymentSummary>("/admin/payments/summary");
}

export function verifyPayment(id: number, approved: boolean, reason?: string) {
  return api.post<unknown>(`/admin/payments/${id}/verify`, { approved, reason });
}

export function getSlipAutoApprove() {
  return api.get<PlatformSetting>(`/admin/settings/${SLIP_AUTO_APPROVE_KEY}`);
}

export function setSlipAutoApprove(enabled: boolean) {
  return api.put<PlatformSetting>(`/admin/settings/${SLIP_AUTO_APPROVE_KEY}`, {
    value: String(enabled),
  });
}

/** บัญชีของแพลตฟอร์มที่ผู้ซื้อเห็นตอนโอน — ใช้เทียบกับปลายทางในสลิป */
export function getTransferAccount() {
  return api.get<PlatformSetting>(`/admin/settings/${TRANSFER_ACCOUNT_KEY}`);
}

/* ── คืนเงิน ── */

/** `ALL` = ทุกสถานะ เรียงใหม่สุดก่อน · สถานะเดียว = เก่าสุดก่อน */
export function getRefundQueue(status: RefundStatus | "ALL") {
  return api.get<AdminRefund[]>("/admin/refunds", { query: { status } });
}

export function getRefundSummary() {
  return api.get<RefundSummary>("/admin/refunds/summary");
}

export function getRefundTransfers(id: number) {
  return api.get<RefundTransferAttempt[]>(`/admin/refunds/${id}/transfers`);
}

/** ล็อกบัญชีปลายทาง — เลขต้องตรงกับที่ผู้ซื้อระบุตอนนี้ ไม่งั้นได้ REFUND_DESTINATION_CHANGED */
export function startRefundTransfer(id: number, accountNumber: string) {
  return api.post<unknown>(`/admin/refunds/${id}/processing`, { accountNumber });
}

export function completeRefundTransfer(id: number, transferReference: string) {
  return api.post<unknown>(`/admin/refunds/${id}/processed`, { transferReference });
}

export function failRefundTransfer(id: number, reason: string) {
  return api.post<unknown>(`/admin/refunds/${id}/failed`, { reason });
}

/* ── ถอนเงินผู้ขาย ── */

/** ไม่ส่ง status = ทุกสถานะ เก่าสุดก่อน */
export function getPayoutQueue(status?: PayoutStatus) {
  return api.get<AdminPayout[]>("/admin/payouts", {
    query: status ? { status } : undefined,
  });
}

export function getPayoutSummary() {
  return api.get<PayoutSummary>("/admin/payouts/summary");
}

export function approvePayout(id: number) {
  return api.post<unknown>(`/admin/payouts/${id}/approve`);
}

export function startPayoutTransfer(id: number) {
  return api.post<unknown>(`/admin/payouts/${id}/processing`);
}

export function completePayout(id: number, transferReference: string, slipImageKey: string) {
  return api.post<unknown>(`/admin/payouts/${id}/paid`, { transferReference, slipImageKey });
}

export function rejectPayout(id: number, reason: string) {
  return api.post<unknown>(`/admin/payouts/${id}/reject`, { reason });
}

export function failPayout(id: number, reason: string) {
  return api.post<unknown>(`/admin/payouts/${id}/fail`, { reason });
}
