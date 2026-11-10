import { formatDistanceToNowStrict } from "date-fns";
import { currentLanguage, dateFnsLocale, intlLocale, translate, useTranslate } from "@/lib/i18n";

export type Translator = (key: string, defaultValue: string) => string;

const fallbackTranslator: Translator = (_, defaultValue) => defaultValue;

export const returnStatusOptions = [
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "AWAITING_RETURN_SHIPMENT",
  "IN_TRANSIT",
  "RECEIVED",
  "REFUNDED",
  "CLOSED",
];

export function returnStatusLabel(status: string, t: Translator = fallbackTranslator): string {
  switch (status) {
    case "REQUESTED":
      return t("returnStatus.requested", "รอคุณตัดสิน");
    case "APPROVED":
      return t("returnStatus.approved", "อนุมัติแล้ว รอระบบคืนเงิน");
    case "REJECTED":
      return t("returnStatus.rejected", "ปฏิเสธแล้ว");
    case "AWAITING_RETURN_SHIPMENT":
      return t("returnStatus.awaitingReturnShipment", "รอผู้ซื้อส่งสินค้าคืน");
    case "IN_TRANSIT":
      return t("returnStatus.inTransit", "ผู้ซื้อส่งคืนแล้ว");
    case "RECEIVED":
      return t("returnStatus.received", "ได้รับของแล้ว รอระบบคืนเงิน");
    case "REFUNDED":
      return t("returnStatus.refunded", "คืนเงินแล้ว");
    case "CLOSED":
      return t("returnStatus.closed", "ปิดคำขอแล้ว");
    default:
      return t("returnStatus.other", "สถานะอื่น");
  }
}

export function sellerReturnStatusConfig(status: string, t: Translator = fallbackTranslator): { label: string; className: string } {
  switch (status) {
    case "REQUESTED":
      return {
        label: t("sellerReturns.status.requested", "รอคุณตัดสิน"),
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      };
    case "IN_TRANSIT":
      return {
        label: t("sellerReturns.status.inTransit", "ผู้ซื้อส่งคืนแล้ว"),
        className: "bg-primary/10 text-primary border-primary/20",
      };
    case "AWAITING_RETURN_SHIPMENT":
      return {
        label: t("sellerReturns.status.awaitingShipment", "รอผู้ซื้อส่งคืน"),
        className: "bg-secondary text-secondary-foreground border-transparent",
      };
    case "APPROVED":
    case "RECEIVED":
      return {
        label: t("sellerReturns.status.awaitingRefund", "รอคืนเงิน"),
        className: "bg-secondary text-secondary-foreground border-transparent",
      };
    case "REFUNDED":
      return {
        label: t("sellerReturns.status.refunded", "คืนเงินสำเร็จ"),
        className: "bg-secondary text-secondary-foreground border-transparent",
      };
    case "REJECTED":
      return {
        label: t("sellerReturns.status.rejected", "ปฏิเสธคำขอ"),
        className: "bg-muted text-muted-foreground border-border",
      };
    case "CLOSED":
      return {
        label: t("sellerReturns.status.closed", "ปิดคำขอแล้ว"),
        className: "bg-muted text-muted-foreground border-border",
      };
    default:
      return {
        label: returnStatusLabel(status, t),
        className: "bg-muted text-muted-foreground border-border",
      };
  }
}

export function returnReasonLabel(reason: string, t: Translator = fallbackTranslator): string {
  switch (reason) {
    case "NOT_AS_DESCRIBED":
      return t("returnReason.notAsDescribed", "สินค้าไม่ตรงตามที่ลงขาย");
    case "DAMAGED":
      return t("returnReason.damaged", "สินค้าเสียหาย");
    case "WRONG_ITEM":
      return t("returnReason.wrongItem", "ได้รับสินค้าผิดรายการ");
    case "NOT_RECEIVED":
      return t("returnReason.notReceived", "ไม่ได้รับสินค้า");
    case "COUNTERFEIT":
      return t("returnReason.counterfeit", "สินค้าปลอม");
    case "OTHER":
      return t("returnReason.other", "เหตุผลอื่น");
    default:
      return t("returnReason.other", "เหตุผลอื่น");
  }
}

export function useReturnStatusLabel() {
  const { t } = useTranslate("buyer");
  return (status: string) => returnStatusLabel(status, t);
}

export function useReturnReasonLabel() {
  const { t } = useTranslate("buyer");
  return (reason: string) => returnReasonLabel(reason, t);
}

export function useSellerReturnStatusConfig() {
  const { t } = useTranslate("seller");
  return (status: string) => sellerReturnStatusConfig(status, t);
}

/** Format amount to Thai Baht with comma and 2 decimals (e.g. ฿3,420.00) */
export function formatBaht(value?: number | null): string {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  // eslint-disable-next-line no-restricted-syntax -- ฿ คือสัญลักษณ์สกุลเงิน (I18N-02)
  return `฿${num.toLocaleString(intlLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format amount to short Thai Baht without trailing zero decimals if integer (e.g. ฿3,420) */
export function formatBahtShort(value?: number | null): string {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  // eslint-disable-next-line no-restricted-syntax -- ฿ คือสัญลักษณ์สกุลเงิน (I18N-02)
  return `฿${num.toLocaleString(intlLocale(), { maximumFractionDigits: 2 })}`;
}

/** Format date string to relative Thai time, e.g. "2 วันที่แล้ว", "3 ชม. ที่แล้ว" */
export function formatAgo(value: string): string {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return currentLanguage() === "th"
      ? translate("common", "dateTime.ago", "{time}ที่แล้ว", { time: formatDistanceToNowStrict(d, { locale: dateFnsLocale("th") }) })
      : formatDistanceToNowStrict(d, { locale: dateFnsLocale("en"), addSuffix: true });
  } catch {
    return value;
  }
}

/** Map backend error codes to polite Thai toast messages */
export function mapReturnErrorMessage(
  error: unknown,
  t: Translator = fallbackTranslator,
  fallback?: string,
): string {
  const defaultFallback = fallback ?? t("sellerReturns.errors.defaultFallback", "กรุณาลองใหม่อีกครั้ง");
  if (typeof error === "object" && error !== null) {
    const errObj = error as { code?: string; message?: string; details?: { code?: string } };
    const code = errObj.code || errObj.details?.code;
    switch (code) {
      case "RETURN_STATE":
        return t("sellerReturns.errors.returnState", "สถานะของคำขอนี้ถูกเปลี่ยนแปลงไปแล้ว หรือไม่สามารถทำรายการนี้ได้");
      case "VALIDATION_FAILED":
        return t("sellerReturns.errors.validationFailed", "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบยอดเงินและตัวเลือกที่ระบุ");
      case "REFUND_EXCEEDS_REFUNDABLE":
        return t("sellerReturns.errors.refundExceedsRefundable", "ยอดเงินคืนต้องไม่เกินยอดคำสั่งซื้อย่อย");
      case "RETURN_NOT_FOUND":
        return t("sellerReturns.errors.returnNotFound", "ไม่พบข้อมูลคำขอคืนสินค้านี้");
      case "FORBIDDEN":
        return t("sellerReturns.errors.forbidden", "คุณไม่มีสิทธิ์ดำเนินการในคำขอนี้");
      default:
        break;
    }
  }
  return defaultFallback;
}
