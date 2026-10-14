import type { SellerReturnItem, SellerReturnRequest } from "./after-sales.types";

export type TabCategory = "action_required" | "awaiting_shipment" | "awaiting_refund" | "completed";

export const TAB_STATUS_MAP: Record<TabCategory, string[]> = {
  action_required: ["REQUESTED", "IN_TRANSIT"],
  awaiting_shipment: ["AWAITING_RETURN_SHIPMENT"],
  awaiting_refund: ["APPROVED", "RECEIVED"],
  completed: ["REJECTED", "REFUNDED", "CLOSED"],
};

export const TAB_LABELS: Record<TabCategory, string> = {
  action_required: "ต้องดำเนินการ",
  awaiting_shipment: "รอผู้ซื้อส่งคืน",
  awaiting_refund: "รอคืนเงิน",
  completed: "เสร็จสิ้น",
};

/**
 * Group seller returns into 4 client-side tabs
 */
export function categorizeReturns(returns: SellerReturnRequest[]): Record<TabCategory, SellerReturnRequest[]> {
  const result: Record<TabCategory, SellerReturnRequest[]> = {
    action_required: [],
    awaiting_shipment: [],
    awaiting_refund: [],
    completed: [],
  };

  for (const item of returns) {
    if (TAB_STATUS_MAP.action_required.includes(item.status)) {
      result.action_required.push(item);
    } else if (TAB_STATUS_MAP.awaiting_shipment.includes(item.status)) {
      result.awaiting_shipment.push(item);
    } else if (TAB_STATUS_MAP.awaiting_refund.includes(item.status)) {
      result.awaiting_refund.push(item);
    } else if (TAB_STATUS_MAP.completed.includes(item.status)) {
      result.completed.push(item);
    }
  }

  return result;
}

/**
 * Calculate tab counts
 */
export function calculateTabCounts(returns: SellerReturnRequest[]): Record<TabCategory, number> {
  const categorized = categorizeReturns(returns);
  return {
    action_required: categorized.action_required.length,
    awaiting_shipment: categorized.awaiting_shipment.length,
    awaiting_refund: categorized.awaiting_refund.length,
    completed: categorized.completed.length,
  };
}

/**
 * Partial refund input validation
 * Validates: > 0, < grandTotal, and maximum 2 decimal places
 */
export function validatePartialRefundAmount(
  amount: number | string,
  grandTotal: number
): { valid: boolean; error?: string } {
  if (amount === "" || amount === null || amount === undefined) {
    return { valid: false, error: "กรุณาระบุยอดเงินคืน" };
  }
  const str = String(amount).trim();
  const num = parseFloat(str);

  if (isNaN(num)) {
    return { valid: false, error: "กรุณาระบุตัวเลขที่ถูกต้อง" };
  }
  if (num <= 0) {
    return { valid: false, error: "ยอดคืนเงินต้องมากกว่า 0 บาท" };
  }
  if (num >= grandTotal) {
    return { valid: false, error: `ยอดคืนเงินบางส่วนต้องน้อยกว่ายอดรวมคำสั่งซื้อ (${grandTotal.toLocaleString("th-TH")} บาท)` };
  }

  const parts = str.split(".");
  if (parts.length > 1 && parts[1].length > 2) {
    return { valid: false, error: "ยอดคืนเงินต้องไม่เกิน 2 ตำแหน่งทศนิยม" };
  }

  return { valid: true };
}

/**
 * Calculate quick preset percentage amounts (e.g. 25%, 50%)
 */
export function calculatePresetPercentage(percentage: number, grandTotal: number): number {
  if (grandTotal <= 0 || percentage <= 0) return 0;
  return Math.round((grandTotal * (percentage / 100)) * 100) / 100;
}

/**
 * Calculate total price of returned cards from line items
 */
export function calculateReturnedCardsTotal(items: SellerReturnItem[] = []): number {
  return items.reduce((sum, item) => sum + (item.unitPrice * item.quantityReturned), 0);
}

/**
 * Sort returns by requested date
 */
export function sortReturns(returns: SellerReturnRequest[], sortOrder: "longest_first" | "newest_first"): SellerReturnRequest[] {
  return [...returns].sort((a, b) => {
    const timeA = new Date(a.requestedAt).getTime();
    const timeB = new Date(b.requestedAt).getTime();
    if (sortOrder === "newest_first") {
      return timeB - timeA;
    }
    // Default longest waiting first: requested_at ASC
    return timeA - timeB;
  });
}
