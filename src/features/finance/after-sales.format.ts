import { formatDistanceToNowStrict } from "date-fns";
import { th } from "date-fns/locale";

const returnStatusLabels: Record<string, string> = {
  REQUESTED: "รอคุณตัดสิน",
  APPROVED: "อนุมัติแล้ว รอระบบคืนเงิน",
  REJECTED: "ปฏิเสธแล้ว",
  AWAITING_RETURN_SHIPMENT: "รอผู้ซื้อส่งสินค้าคืน",
  IN_TRANSIT: "ผู้ซื้อส่งคืนแล้ว",
  RECEIVED: "ได้รับของแล้ว รอระบบคืนเงิน",
  REFUNDED: "คืนเงินแล้ว",
  CLOSED: "ปิดคำขอแล้ว",
};

export const sellerReturnStatusConfig = (status: string): { label: string; className: string } => {
  switch (status) {
    case "REQUESTED":
      return {
        label: "รอคุณตัดสิน",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      };
    case "IN_TRANSIT":
      return {
        label: "ผู้ซื้อส่งคืนแล้ว",
        className: "bg-primary/10 text-primary border-primary/20",
      };
    case "AWAITING_RETURN_SHIPMENT":
      return {
        label: "รอผู้ซื้อส่งคืน",
        className: "bg-secondary text-secondary-foreground border-transparent",
      };
    case "APPROVED":
    case "RECEIVED":
      return {
        label: "รอคืนเงิน",
        className: "bg-secondary text-secondary-foreground border-transparent",
      };
    case "REFUNDED":
      return {
        label: "คืนเงินสำเร็จ",
        className: "bg-secondary text-secondary-foreground border-transparent",
      };
    case "REJECTED":
      return {
        label: "ปฏิเสธคำขอ",
        className: "bg-muted text-muted-foreground border-border",
      };
    case "CLOSED":
      return {
        label: "ปิดคำขอแล้ว",
        className: "bg-muted text-muted-foreground border-border",
      };
    default:
      return {
        label: returnStatusLabels[status] ?? "สถานะอื่น",
        className: "bg-muted text-muted-foreground border-border",
      };
  }
};

const returnReasonLabels: Record<string, string> = {
  NOT_AS_DESCRIBED: "สินค้าไม่ตรงตามที่ลงขาย",
  DAMAGED: "สินค้าเสียหาย",
  WRONG_ITEM: "ได้รับสินค้าผิดรายการ",
  NOT_RECEIVED: "ไม่ได้รับสินค้า",
  COUNTERFEIT: "สินค้าปลอม",
  OTHER: "เหตุผลอื่น",
};

export const returnStatusOptions = Object.keys(returnStatusLabels);
export const returnStatusLabel = (status: string) => returnStatusLabels[status] ?? "สถานะอื่น";
export const returnReasonLabel = (reason: string) => returnReasonLabels[reason] ?? "เหตุผลอื่น";

/** Format amount to Thai Baht with comma and 2 decimals (e.g. ฿3,420.00) */
export function formatBaht(value?: number | null): string {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  return `฿${num.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format amount to short Thai Baht without trailing zero decimals if integer (e.g. ฿3,420) */
export function formatBahtShort(value?: number | null): string {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  return `฿${num.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
}

/** Format date string to relative Thai time, e.g. "2 วันที่แล้ว", "3 ชม. ที่แล้ว" */
export function formatAgo(value: string): string {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return `${formatDistanceToNowStrict(d, { locale: th })}ที่แล้ว`;
  } catch {
    return value;
  }
}

/** Map backend error codes to polite Thai toast messages */
export function mapReturnErrorMessage(error: unknown, fallback = "กรุณาลองใหม่อีกครั้ง"): string {
  if (typeof error === "object" && error !== null) {
    const errObj = error as { code?: string; message?: string; details?: { code?: string } };
    const code = errObj.code || errObj.details?.code;
    switch (code) {
      case "RETURN_STATE":
        return "สถานะของคำขอนี้ถูกเปลี่ยนแปลงไปแล้ว หรือไม่สามารถทำรายการนี้ได้";
      case "VALIDATION_FAILED":
        return "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบยอดเงินและตัวเลือกที่ระบุ";
      case "REFUND_EXCEEDS_REFUNDABLE":
        return "ยอดเงินคืนต้องไม่เกินยอดคำสั่งซื้อย่อย";
      case "RETURN_NOT_FOUND":
        return "ไม่พบข้อมูลคำขอคืนสินค้านี้";
      case "FORBIDDEN":
        return "คุณไม่มีสิทธิ์ดำเนินการในคำขอนี้";
      default:
        break;
    }
  }
  return fallback;
}
