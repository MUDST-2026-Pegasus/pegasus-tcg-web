import { describe, expect, it } from "vitest";
import { matchesOrderFilter, ORDER_FILTER_TABS } from "@/features/account/order-filter";
import type { OrderDetails } from "@/features/account/orders.types";

function createMockOrder(status: string, sellerStatus?: string, paymentUnderReview = false): OrderDetails {
  return {
    id: 1,
    orderNumber: "ORD-001",
    buyerId: 1,
    status,
    currency: "THB",
    itemsSubtotal: 1000,
    shippingTotal: 50,
    discountTotal: 0,
    grandTotal: 1050,
    shippingAddressId: 1,
    shippingAddressSnapshot: null,
    buyerNote: null,
    placedAt: "2026-10-10T10:00:00Z",
    paidAt: null,
    completedAt: null,
    cancelledAt: null,
    paymentUnderReview,
    sellerOrders: sellerStatus
      ? [
          {
            id: 10,
            salesOrderId: 1,
            sellerProfileId: 1,
            sellerName: "Test Seller",
            sellerOrderNumber: "SO-001",
            status: sellerStatus,
            itemsSubtotal: 1000,
            shippingFee: 50,
            discountAmount: 0,
            grandTotal: 1050,
            commissionAmount: 0,
            sellerNetAmount: 1050,
            acceptedAt: null,
            shippedAt: null,
            deliveredAt: null,
            autoCompleteAt: null,
            completedAt: null,
            cancelledAt: null,
            cancelReason: null,
            createdAt: "2026-10-10T10:00:00Z",
            items: [],
            shipments: [],
            statusHistory: [],
          },
        ]
      : [],
  };
}

describe("order-filter", () => {
  it("provides exactly the 5 specified tabs in order", () => {
    expect(ORDER_FILTER_TABS).toHaveLength(5);
    expect(ORDER_FILTER_TABS.map((t) => t.key)).toEqual([
      "ALL",
      "PENDING",
      "IN_TRANSIT",
      "COMPLETED",
      "CANCELLED",
    ]);
    expect(ORDER_FILTER_TABS.map((t) => t.label)).toEqual([
      "ทั้งหมด (All)",
      "รอชำระเงิน (Pending)",
      "กำลังจัดส่ง (In Transit)",
      "สำเร็จแล้ว (Completed)",
      "ยกเลิกแล้ว (Cancelled)",
    ]);
  });

  it("matches ALL tab for any order", () => {
    const order = createMockOrder("PENDING_PAYMENT");
    expect(matchesOrderFilter(order, "ALL")).toBe(true);
  });

  it("correctly filters PENDING orders", () => {
    const pending = createMockOrder("PENDING_PAYMENT");
    const review = createMockOrder("PENDING_PAYMENT", undefined, true);
    const completed = createMockOrder("COMPLETED");

    expect(matchesOrderFilter(pending, "PENDING")).toBe(true);
    expect(matchesOrderFilter(review, "PENDING")).toBe(true);
    expect(matchesOrderFilter(completed, "PENDING")).toBe(false);
  });

  it("correctly filters IN_TRANSIT and PREPARING orders", () => {
    const shipped = createMockOrder("PAID", "SHIPPED");
    const preparing = createMockOrder("PAID", "PREPARING");
    const pending = createMockOrder("PENDING_PAYMENT");

    expect(matchesOrderFilter(shipped, "IN_TRANSIT")).toBe(true);
    expect(matchesOrderFilter(preparing, "IN_TRANSIT")).toBe(true);
    expect(matchesOrderFilter(pending, "IN_TRANSIT")).toBe(false);
  });

  it("correctly filters COMPLETED orders", () => {
    const completed = createMockOrder("COMPLETED");
    const pending = createMockOrder("PENDING_PAYMENT");

    expect(matchesOrderFilter(completed, "COMPLETED")).toBe(true);
    expect(matchesOrderFilter(pending, "COMPLETED")).toBe(false);
  });

  it("correctly filters CANCELLED orders including refunds and returns", () => {
    const cancelled = createMockOrder("CANCELLED");
    const refunded = createMockOrder("REFUNDED");
    const returning = createMockOrder("PAID", "RETURN_REQUESTED");
    const completed = createMockOrder("COMPLETED");

    expect(matchesOrderFilter(cancelled, "CANCELLED")).toBe(true);
    expect(matchesOrderFilter(refunded, "CANCELLED")).toBe(true);
    expect(matchesOrderFilter(returning, "CANCELLED")).toBe(true);
    expect(matchesOrderFilter(completed, "CANCELLED")).toBe(false);
  });
});
