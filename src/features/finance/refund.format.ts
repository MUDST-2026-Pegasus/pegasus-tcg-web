import { useTranslate } from "@/lib/i18n";

export type Translator = (key: string, defaultValue: string) => string;

const fallbackTranslator: Translator = (_, defaultValue) => defaultValue;

export function refundStatusLabel(status: string, t: Translator = fallbackTranslator): string {
  switch (status) {
    case "PENDING":
      return t("refundStatus.pending", "รอดำเนินการ");
    case "APPROVED":
      return t("refundStatus.approved", "อนุมัติแล้ว");
    case "PROCESSING":
      return t("refundStatus.processing", "กำลังโอนเงินคืน");
    case "PROCESSED":
      return t("refundStatus.processed", "คืนเงินแล้ว");
    case "REJECTED":
      return t("refundStatus.rejected", "ปฏิเสธคำขอ");
    default:
      return t("refundStatus.other", "สถานะอื่น");
  }
}

export function refundMethodLabel(method: string, t: Translator = fallbackTranslator): string {
  switch (method) {
    case "BANK_TRANSFER":
      return t("refundMethod.bankTransfer", "โอนเข้าบัญชีธนาคาร");
    case "MOCK_GATEWAY":
      return t("refundMethod.mockGateway", "คืนผ่านช่องทางชำระเงิน");
    case "WALLET":
      return t("refundMethod.wallet", "คืนเข้ากระเป๋าเงิน");
    case "CASH_ON_DELIVERY":
      return t("refundMethod.cashOnDelivery", "เก็บเงินปลายทาง");
    default:
      return t("refundMethod.other", "ช่องทางอื่น");
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
