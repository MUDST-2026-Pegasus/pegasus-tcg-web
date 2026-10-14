import { describe, expect, it } from "vitest";

import {
  calculatePresetPercentage,
  calculateReturnedCardsTotal,
  calculateTabCounts,
  categorizeReturns,
  sortReturns,
  validatePartialRefundAmount,
} from "@/features/finance/after-sales.helpers";
import type { SellerReturnItem, SellerReturnRequest } from "@/features/finance/after-sales.types";

const mockReturn = (id: number, status: string, grandTotal = 1000, requestedAt = "2026-10-10T10:00:00Z"): SellerReturnRequest => ({
  id,
  sellerOrderId: 100 + id,
  sellerOrderNumber: `ORD-${id}`,
  buyer: { username: `buyer${id}`, displayName: `Buyer ${id}` },
  sellerOrderGrandTotal: grandTotal,
  deliveredAt: "2026-10-09T10:00:00Z",
  autoCompleteAt: "2026-10-16T10:00:00Z",
  reasonCode: "NOT_AS_DESCRIBED",
  description: "Card damaged",
  status,
  resolution: null,
  refundAmount: null,
  evidenceKeys: [],
  returnTrackingNumber: null,
  requestedAt,
  reviewedAt: null,
  receivedAt: null,
  closedAt: null,
  items: [],
});

describe("SellerReturns Helper & Logic Tests (TCG-495)", () => {
  describe("Client-side Tab Grouping & Count Calculations", () => {
    it("groups all 8 statuses into the 4 target pill tabs correctly", () => {
      const returns: SellerReturnRequest[] = [
        mockReturn(1, "REQUESTED"),
        mockReturn(2, "IN_TRANSIT"),
        mockReturn(3, "AWAITING_RETURN_SHIPMENT"),
        mockReturn(4, "APPROVED"),
        mockReturn(5, "RECEIVED"),
        mockReturn(6, "REJECTED"),
        mockReturn(7, "REFUNDED"),
        mockReturn(8, "CLOSED"),
      ];

      const categorized = categorizeReturns(returns);

      // Tab 1: ต้องดำเนินการ (REQUESTED, IN_TRANSIT)
      expect(categorized.action_required.map((r) => r.id)).toEqual([1, 2]);

      // Tab 2: รอผู้ซื้อส่งคืน (AWAITING_RETURN_SHIPMENT)
      expect(categorized.awaiting_shipment.map((r) => r.id)).toEqual([3]);

      // Tab 3: รอคืนเงิน (APPROVED, RECEIVED)
      expect(categorized.awaiting_refund.map((r) => r.id)).toEqual([4, 5]);

      // Tab 4: เสร็จสิ้น (REJECTED, REFUNDED, CLOSED)
      expect(categorized.completed.map((r) => r.id)).toEqual([6, 7, 8]);
    });

    it("calculates accurate dynamic badge counts for tabs", () => {
      const returns: SellerReturnRequest[] = [
        mockReturn(1, "REQUESTED"),
        mockReturn(2, "REQUESTED"),
        mockReturn(3, "IN_TRANSIT"),
        mockReturn(4, "AWAITING_RETURN_SHIPMENT"),
        mockReturn(5, "APPROVED"),
      ];

      const counts = calculateTabCounts(returns);
      expect(counts.action_required).toBe(3);
      expect(counts.awaiting_shipment).toBe(1);
      expect(counts.awaiting_refund).toBe(1);
      expect(counts.completed).toBe(0);
    });

    it("handles empty returns list gracefully", () => {
      const counts = calculateTabCounts([]);
      expect(counts).toEqual({
        action_required: 0,
        awaiting_shipment: 0,
        awaiting_refund: 0,
        completed: 0,
      });
    });
  });

  describe("Partial Refund Input Validation", () => {
    const grandTotal = 3420;

    it("rejects empty, null, or undefined values", () => {
      expect(validatePartialRefundAmount("", grandTotal).valid).toBe(false);
      expect(validatePartialRefundAmount(null as never, grandTotal).valid).toBe(false);
      expect(validatePartialRefundAmount(undefined as never, grandTotal).valid).toBe(false);
    });

    it("rejects amounts less than or equal to zero", () => {
      expect(validatePartialRefundAmount(0, grandTotal).valid).toBe(false);
      expect(validatePartialRefundAmount("0", grandTotal).valid).toBe(false);
      expect(validatePartialRefundAmount(-50, grandTotal).valid).toBe(false);
      expect(validatePartialRefundAmount("-0.01", grandTotal).valid).toBe(false);
    });

    it("rejects amounts greater than or equal to grand total", () => {
      expect(validatePartialRefundAmount(3420, grandTotal).valid).toBe(false);
      expect(validatePartialRefundAmount("3420", grandTotal).valid).toBe(false);
      expect(validatePartialRefundAmount("3420.01", grandTotal).valid).toBe(false);
      expect(validatePartialRefundAmount(5000, grandTotal).valid).toBe(false);
    });

    it("rejects numbers with more than 2 decimal places", () => {
      expect(validatePartialRefundAmount("100.123", grandTotal).valid).toBe(false);
      expect(validatePartialRefundAmount("50.999", grandTotal).valid).toBe(false);
      expect(validatePartialRefundAmount("1.0001", grandTotal).valid).toBe(false);
    });

    it("accepts valid partial refund amounts within bounds and with up to 2 decimal places", () => {
      expect(validatePartialRefundAmount(0.01, grandTotal).valid).toBe(true);
      expect(validatePartialRefundAmount("0.01", grandTotal).valid).toBe(true);
      expect(validatePartialRefundAmount("500", grandTotal).valid).toBe(true);
      expect(validatePartialRefundAmount("3419.99", grandTotal).valid).toBe(true);
      expect(validatePartialRefundAmount("1250.5", grandTotal).valid).toBe(true);
      expect(validatePartialRefundAmount("1250.50", grandTotal).valid).toBe(true);
    });
  });

  describe("Quick Preset Calculations", () => {
    const grandTotal = 3420;

    it("accurately calculates 25% and 50% presets", () => {
      expect(calculatePresetPercentage(25, grandTotal)).toBe(855);
      expect(calculatePresetPercentage(50, grandTotal)).toBe(1710);
    });

    it("rounds fractions to 2 decimal places properly", () => {
      // 25% of 125.55 = 31.3875 -> 31.39
      expect(calculatePresetPercentage(25, 125.55)).toBe(31.39);
      // 50% of 99.99 = 49.995 -> 50.00
      expect(calculatePresetPercentage(50, 99.99)).toBe(50.0);
    });

    it("calculates total price of returned cards from line items", () => {
      const items: SellerReturnItem[] = [
        {
          returnItemId: 1,
          orderItemId: 10,
          cardName: "Luffy Gear 5",
          variantLabel: "Parallel",
          conditionCode: "NM",
          imageUrl: null,
          unitPrice: 2900,
          quantityReturned: 1,
          quantityOrdered: 1,
          restock: true,
        },
        {
          returnItemId: 2,
          orderItemId: 11,
          cardName: "Nami",
          variantLabel: "Alt Art",
          conditionCode: "LP",
          imageUrl: null,
          unitPrice: 130,
          quantityReturned: 2,
          quantityOrdered: 2,
          restock: true,
        },
      ];

      // 2900*1 + 130*2 = 3160
      expect(calculateReturnedCardsTotal(items)).toBe(3160);
    });
  });

  describe("Sorting Returns", () => {
    const r1 = mockReturn(1, "REQUESTED", 100, "2026-10-10T12:00:00Z");
    const r2 = mockReturn(2, "REQUESTED", 200, "2026-10-08T12:00:00Z");
    const r3 = mockReturn(3, "REQUESTED", 300, "2026-10-12T12:00:00Z");

    it("sorts by longest waiting first (requested_at ASC) as default", () => {
      const sorted = sortReturns([r1, r2, r3], "longest_first");
      expect(sorted.map((r) => r.id)).toEqual([2, 1, 3]);
    });

    it("sorts by newest first (requested_at DESC)", () => {
      const sorted = sortReturns([r1, r2, r3], "newest_first");
      expect(sorted.map((r) => r.id)).toEqual([3, 1, 2]);
    });
  });
});
