import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as financeApi from "./finance.api";
import type { BankAccount, RefundStatus } from "./finance.types";

/**
 * ทุก mutation ล้างทั้งโมดูลของมัน (`payments()` / `refunds()` / `payouts()`)
 * เพราะเปลี่ยนสถานะหนึ่งรายการ = ย้ายข้ามแท็บ และตัวเลขบนแถบสถิติเปลี่ยนตาม
 */
export const financeKeys = {
  all: ["admin-finance"] as const,
  payments: () => [...financeKeys.all, "payments"] as const,
  paymentQueue: () => [...financeKeys.payments(), "queue"] as const,
  paymentSummary: () => [...financeKeys.payments(), "summary"] as const,
  slipAutoApprove: () => [...financeKeys.all, "setting", financeApi.SLIP_AUTO_APPROVE_KEY] as const,
  transferAccount: () => [...financeKeys.all, "setting", financeApi.TRANSFER_ACCOUNT_KEY] as const,
  refunds: () => [...financeKeys.all, "refunds"] as const,
  refundQueue: (status: RefundStatus | "ALL") => [...financeKeys.refunds(), "queue", status] as const,
  refundSummary: () => [...financeKeys.refunds(), "summary"] as const,
  refundTransfers: (id: number) => [...financeKeys.refunds(), "transfers", id] as const,
  payouts: () => [...financeKeys.all, "payouts"] as const,
  payoutQueue: () => [...financeKeys.payouts(), "queue"] as const,
  payoutSummary: () => [...financeKeys.payouts(), "summary"] as const,
};

/** แอดมินหลายคนทำคิวเดียวกัน ดึงใหม่เป็นระยะให้เห็นรายการที่คนอื่นจัดการไปแล้ว */
const QUEUE_POLL_MS = 30_000;

/* ── ตรวจสอบสลิป ── */

export function usePaymentQueue() {
  return useQuery({
    queryKey: financeKeys.paymentQueue(),
    queryFn: () => financeApi.getPaymentQueue(),
    refetchInterval: QUEUE_POLL_MS,
  });
}

export function usePaymentSummary() {
  return useQuery({
    queryKey: financeKeys.paymentSummary(),
    queryFn: financeApi.getPaymentSummary,
    refetchInterval: QUEUE_POLL_MS,
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approved, reason }: { id: number; approved: boolean; reason?: string }) =>
      financeApi.verifyPayment(id, approved, reason),
    onSettled: () => queryClient.invalidateQueries({ queryKey: financeKeys.payments() }),
  });
}

/** setting เก็บเป็น JSON — `"true"` / `true` นับเป็นเปิด */
export function useSlipAutoApprove() {
  return useQuery({
    queryKey: financeKeys.slipAutoApprove(),
    queryFn: financeApi.getSlipAutoApprove,
    select: (setting) => setting.value.replace(/"/g, "").trim() === "true",
  });
}

export function useSetSlipAutoApprove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeApi.setSlipAutoApprove,
    onSettled: () => queryClient.invalidateQueries({ queryKey: financeKeys.slipAutoApprove() }),
  });
}

/** value เป็น JSON ของ `{bankName, accountName, accountNumber}` — อ่านไม่ออกถือว่าไม่มี */
export function useTransferAccount() {
  return useQuery({
    queryKey: financeKeys.transferAccount(),
    queryFn: financeApi.getTransferAccount,
    staleTime: 5 * 60_000,
    select: (setting): Partial<BankAccount> | null => {
      try {
        const parsed: unknown = JSON.parse(setting.value);
        return typeof parsed === "object" && parsed !== null ? (parsed as Partial<BankAccount>) : null;
      } catch {
        return null;
      }
    },
  });
}

/* ── คืนเงิน ── */

export function useRefundQueue(status: RefundStatus | "ALL") {
  return useQuery({
    queryKey: financeKeys.refundQueue(status),
    queryFn: () => financeApi.getRefundQueue(status),
    placeholderData: keepPreviousData,
    refetchInterval: QUEUE_POLL_MS,
  });
}

export function useRefundSummary() {
  return useQuery({
    queryKey: financeKeys.refundSummary(),
    queryFn: financeApi.getRefundSummary,
    refetchInterval: QUEUE_POLL_MS,
  });
}

export function useRefundTransfers(id: number) {
  return useQuery({
    queryKey: financeKeys.refundTransfers(id),
    queryFn: () => financeApi.getRefundTransfers(id),
  });
}

function useRefundMutation<TVars extends { id: number }>(
  mutationFn: (vars: TVars) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: financeKeys.refunds() }),
  });
}

export function useStartRefundTransfer() {
  return useRefundMutation(({ id, accountNumber }: { id: number; accountNumber: string }) =>
    financeApi.startRefundTransfer(id, accountNumber),
  );
}

export function useCompleteRefundTransfer() {
  return useRefundMutation(({ id, transferReference }: { id: number; transferReference: string }) =>
    financeApi.completeRefundTransfer(id, transferReference),
  );
}

export function useFailRefundTransfer() {
  return useRefundMutation(({ id, reason }: { id: number; reason: string }) =>
    financeApi.failRefundTransfer(id, reason),
  );
}

/* ── ถอนเงินผู้ขาย ── */

/** ดึงทุกสถานะครั้งเดียวแล้วกรองแท็บฝั่งหน้า — ตัวเลขบนแท็บมาจากชุดเดียวกัน */
export function usePayoutQueue() {
  return useQuery({
    queryKey: financeKeys.payoutQueue(),
    queryFn: () => financeApi.getPayoutQueue(),
    refetchInterval: QUEUE_POLL_MS,
  });
}

export function usePayoutSummary() {
  return useQuery({
    queryKey: financeKeys.payoutSummary(),
    queryFn: financeApi.getPayoutSummary,
    refetchInterval: QUEUE_POLL_MS,
  });
}

export type PayoutAction =
  | { kind: "approve"; id: number }
  | { kind: "start"; id: number }
  | { kind: "paid"; id: number; transferReference: string; slipImageKey: string }
  | { kind: "reject"; id: number; reason: string }
  | { kind: "fail"; id: number; reason: string };

/** ปุ่มทุกปุ่มของ payout ผ่าน mutation เดียว — หน้าจอรู้ได้ว่ากำลังทำอะไรจาก `variables.kind` */
export function usePayoutAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: PayoutAction) => {
      switch (action.kind) {
        case "approve":
          return financeApi.approvePayout(action.id);
        case "start":
          return financeApi.startPayoutTransfer(action.id);
        case "paid":
          return financeApi.completePayout(action.id, action.transferReference, action.slipImageKey);
        case "reject":
          return financeApi.rejectPayout(action.id, action.reason);
        case "fail":
          return financeApi.failPayout(action.id, action.reason);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: financeKeys.payouts() }),
  });
}
