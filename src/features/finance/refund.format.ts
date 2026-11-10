import { useTranslate } from "@/lib/i18n";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Translator = (key: any, defaultValue: string, options?: any) => string;

const fallbackTranslator: Translator = (_, defaultValue) => defaultValue;

export function refundStatusLabel(status: string, t: Translator = fallbackTranslator): string {
  switch (status) {
    case "PENDING":
      return t("refundStatus.pending", "รอดำเนินการ", { ns: "buyer" });
    case "APPROVED":
      return t("refundStatus.approved", "อนุมัติแล้ว", { ns: "buyer" });
    case "PROCESSING":
      return t("refundStatus.processing", "กำลังโอนเงินคืน", { ns: "buyer" });
    case "PROCESSED":
      return t("refundStatus.processed", "คืนเงินแล้ว", { ns: "buyer" });
    case "REJECTED":
      return t("refundStatus.rejected", "ปฏิเสธคำขอ", { ns: "buyer" });
    default:
      return t("refundStatus.other", "สถานะอื่น", { ns: "buyer" });
  }
}

export function refundMethodLabel(method: string, t: Translator = fallbackTranslator): string {
  switch (method) {
    case "BANK_TRANSFER":
      return t("refundMethod.bankTransfer", "โอนเข้าบัญชีธนาคาร", { ns: "buyer" });
    case "MOCK_GATEWAY":
      return t("refundMethod.mockGateway", "คืนผ่านช่องทางชำระเงิน", { ns: "buyer" });
    case "WALLET":
      return t("refundMethod.wallet", "คืนเข้ากระเป๋าเงิน", { ns: "buyer" });
    case "CASH_ON_DELIVERY":
      return t("refundMethod.cashOnDelivery", "เก็บเงินปลายทาง", { ns: "buyer" });
    default:
      return t("refundMethod.other", "ช่องทางอื่น", { ns: "buyer" });
  }
}

export function useRefundStatusLabel() {
  const { t } = useTranslate("buyer");
  return (status: string) => refundStatusLabel(status, t);
}

export function useRefundMethodLabel() {
  const { t } = useTranslate("buyer");
  return (method: string) => refundMethodLabel(method, t);
}
