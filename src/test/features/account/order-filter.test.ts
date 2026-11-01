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
  it("provides exactly the 7 specified tabs in order", () => {
    expect(ORDER_FILTER_TABS).toHaveLength(7);
    expect(ORDER_FILTER_TABS.map((t) => t.key)).toEqual([
      "ALL",
      "PENDING",
      "PREPARING",
      "IN_TRANSIT",
      "COMPLETED",
      "RETURN_REFUND",
      "CANCELLED",
    ]);
    expect(ORDER_FILTER_TABS.map((t) => t.label)).toEqual([
      "ทั้งหมด (All)",
      "รอชำระเงิน (Pending / To Pay)",
      "กำลังเตรียมพัสดุ (Preparing / Prepared)",
      "กำลังจัดส่ง (In Transit / Shipped)",
      "สำเร็จแล้ว (Completed / Delivered)",
      "ขอคืนเงิน/คืนสินค้า (Return Requested / Refunded)",
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

  it("correctly separates PREPARING orders from IN_TRANSIT", () => {
    const preparing = createMockOrder("PAID", "PREPARING");
    const shipped = createMockOrder("PAID", "SHIPPED");

    expect(matchesOrderFilter(preparing, "PREPARING")).toBe(true);
    expect(matchesOrderFilter(preparing, "IN_TRANSIT")).toBe(false);

    expect(matchesOrderFilter(shipped, "PREPARING")).toBe(false);
    expect(matchesOrderFilter(shipped, "IN_TRANSIT")).toBe(true);
  });

  it("correctly filters IN_TRANSIT orders", () => {
    const shipped = createMockOrder("PAID", "SHIPPED");
    const pending = createMockOrder("PENDING_PAYMENT");

    expect(matchesOrderFilter(shipped, "IN_TRANSIT")).toBe(true);
    expect(matchesOrderFilter(pending, "IN_TRANSIT")).toBe(false);
  });

  it("correctly filters COMPLETED orders", () => {
    const completed = createMockOrder("COMPLETED");
    const pending = createMockOrder("PENDING_PAYMENT");

    expect(matchesOrderFilter(completed, "COMPLETED")).toBe(true);
    expect(matchesOrderFilter(pending, "COMPLETED")).toBe(false);
  });

  it("correctly separates RETURN_REFUND from CANCELLED", () => {
    const returning = createMockOrder("PAID", "RETURN_REQUESTED");
    const refunded = createMockOrder("REFUNDED");
    const cancelled = createMockOrder("CANCELLED");

    expect(matchesOrderFilter(returning, "RETURN_REFUND")).toBe(true);
    expect(matchesOrderFilter(returning, "CANCELLED")).toBe(false);

    expect(matchesOrderFilter(refunded, "RETURN_REFUND")).toBe(true);
    expect(matchesOrderFilter(refunded, "CANCELLED")).toBe(false);

    expect(matchesOrderFilter(cancelled, "CANCELLED")).toBe(true);
    expect(matchesOrderFilter(cancelled, "RETURN_REFUND")).toBe(false);
  });
});
