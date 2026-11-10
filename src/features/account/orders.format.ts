/**
 * Order status mappings and human-readable formatters for the buyer account portal.
 */

import { isApiError, isNetworkError } from "@/lib/api";
import { translate, translateError } from "@/lib/i18n";

// @tolgee-key {"key": "account.pdf.network", "ns": "buyer", "defaultValue": "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่"}
// @tolgee-key {"key": "account.pdf.session", "ns": "buyer", "defaultValue": "เซสชันหมดอายุ กรุณาเข้าสู่ระบบแล้วลองใหม่"}
// @tolgee-key {"key": "account.pdf.forbidden", "ns": "buyer", "defaultValue": "บัญชีนี้ไม่มีสิทธิ์ดาวน์โหลดเอกสารคำสั่งซื้อ"}
// @tolgee-key {"key": "account.pdf.notFound", "ns": "buyer", "defaultValue": "ไม่พบคำสั่งซื้อที่เลือก หรือรายการถูกลบแล้ว"}
// @tolgee-key {"key": "account.pdf.server", "ns": "buyer", "defaultValue": "ระบบสร้าง PDF ขัดข้อง กรุณาลองใหม่อีกครั้ง"}
// @tolgee-key {"key": "account.pdf.failed", "ns": "buyer", "defaultValue": "ดาวน์โหลด PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"}
// @tolgee-key {"key": "account.packageStatus.PENDING_PAYMENT", "ns": "buyer", "defaultValue": "Pending Payment"}
// @tolgee-key {"key": "account.packageStatus.PAID", "ns": "buyer", "defaultValue": "Paid"}
// @tolgee-key {"key": "account.packageStatus.PREPARING", "ns": "buyer", "defaultValue": "Processing"}
// @tolgee-key {"key": "account.packageStatus.PROCESSING", "ns": "buyer", "defaultValue": "Processing"}
// @tolgee-key {"key": "account.packageStatus.SHIPPED", "ns": "buyer", "defaultValue": "Shipped"}
// @tolgee-key {"key": "account.packageStatus.DELIVERED", "ns": "buyer", "defaultValue": "Completed"}
// @tolgee-key {"key": "account.packageStatus.COMPLETED", "ns": "buyer", "defaultValue": "Completed"}
// @tolgee-key {"key": "account.packageStatus.CANCELLED", "ns": "buyer", "defaultValue": "Cancelled"}
// @tolgee-key {"key": "account.packageStatus.CANCELED", "ns": "buyer", "defaultValue": "Cancelled"}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  get PENDING_PAYMENT() { return translate("buyer", "account.packageStatus.PENDING_PAYMENT", "Pending Payment"); },
  get PAID() { return translate("buyer", "account.packageStatus.PAID", "Paid"); },
  get PREPARING() { return translate("buyer", "account.packageStatus.PREPARING", "Processing"); },
  get PROCESSING() { return translate("buyer", "account.packageStatus.PROCESSING", "Processing"); },
  get SHIPPED() { return translate("buyer", "account.packageStatus.SHIPPED", "Shipped"); },
  get DELIVERED() { return translate("buyer", "account.packageStatus.DELIVERED", "Completed"); },
  get COMPLETED() { return translate("buyer", "account.packageStatus.COMPLETED", "Completed"); },
  get CANCELLED() { return translate("buyer", "account.packageStatus.CANCELLED", "Cancelled"); },
  get CANCELED() { return translate("buyer", "account.packageStatus.CANCELED", "Cancelled"); },
};

/**
 * Converts a SNAKE_CASE string (e.g., "RETURN_REQUESTED") to Title Case ("Return Requested").
 */
export function snakeCaseToTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats backend order and package status enums into clean, human-readable text.
 *
 * Mappings:
 * - PENDING_PAYMENT -> "Pending Payment"
 * - PAID -> "Paid"
 * - PREPARING / PROCESSING -> "Processing"
 * - SHIPPED -> "Shipped"
 * - DELIVERED / COMPLETED -> "Completed"
 * - CANCELLED -> "Cancelled"
 * - Fallback: converts SNAKE_CASE to Title Case (e.g. RETURN_REQUESTED -> Return Requested)
 */
export function formatOrderStatus(status?: string | null): string {
  if (!status) return "";
  const upper = status.trim().toUpperCase();

  if (ORDER_STATUS_LABELS[upper]) {
    return ORDER_STATUS_LABELS[upper];
  }

  return snakeCaseToTitleCase(upper);
}

export type OrderStatusBadgeConfig = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
};

/**
 * Returns badge variant, styling classes, and human-readable label for an order or package status.
 */
export function getOrderStatusBadge(status?: string | null): OrderStatusBadgeConfig {
  const label = formatOrderStatus(status);
  const upper = (status ?? "").trim().toUpperCase();

  switch (upper) {
    case "PENDING_PAYMENT":
      return {
        label,
        variant: "secondary",
        className: "bg-amber-500 text-white hover:bg-amber-600 border-transparent",
      };
    case "PAID":
    case "PREPARING":
    case "PROCESSING":
      return {
        label,
        variant: "secondary",
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent",
      };
    case "SHIPPED":
      return {
        label,
        variant: "secondary",
        className: "bg-purple-100 text-purple-800 hover:bg-purple-100 border-transparent",
      };
    case "DELIVERED":
    case "COMPLETED":
      return {
        label,
        variant: "secondary",
        className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent",
      };
    case "CANCELLED":
    case "CANCELED":
      return {
        label,
        variant: "outline",
        className: "text-muted-foreground",
      };
    default:
      return {
        label,
        variant: "outline",
        className: "text-muted-foreground",
      };
  }
}

export function buyerOrderSummaryDownloadErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return translate("buyer", "account.pdf.network", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่");
  }
  if (isApiError(error)) {
    switch (error.status) {
      case 401:
        return translate("buyer", "account.pdf.session", "เซสชันหมดอายุ กรุณาเข้าสู่ระบบแล้วลองใหม่");
      case 403:
        return translate("buyer", "account.pdf.forbidden", "บัญชีนี้ไม่มีสิทธิ์ดาวน์โหลดเอกสารคำสั่งซื้อ");
      case 404:
        return translate("buyer", "account.pdf.notFound", "ไม่พบคำสั่งซื้อที่เลือก หรือรายการถูกลบแล้ว");
      default:
        if (error.status >= 500) return translate("buyer", "account.pdf.server", "ระบบสร้าง PDF ขัดข้อง กรุณาลองใหม่อีกครั้ง");
    }
  }
  return translateError(error, translate("buyer", "account.pdf.failed", "ดาวน์โหลด PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"));
}
