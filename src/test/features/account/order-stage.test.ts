import { describe, expect, it } from "vitest";

import { canBuyerCancel, nextAutoCompleteAt, orderStage } from "@/features/account/order-stage";
import type { OrderDetails, SellerOrderDetails } from "@/features/account/orders.types";

function child(status: string, extra: Partial<SellerOrderDetails> = {}): SellerOrderDetails {
  return {
    id: Math.floor(Math.random() * 1e6), salesOrderId: 1, sellerProfileId: 1, sellerOrderNumber: "SO",
    status, itemsSubtotal: 0, shippingFee: 0, discountAmount: 0, grandTotal: 0, commissionAmount: 0,
    sellerNetAmount: 0, acceptedAt: null, shippedAt: null, deliveredAt: null, autoCompleteAt: null,
    completedAt: null, cancelledAt: null, cancelReason: null, createdAt: "2026-10-01T00:00:00Z",
    items: [], shipments: [], statusHistory: [], ...extra,
  };
}

function order(status: string, children: SellerOrderDetails[], extra: Partial<OrderDetails> = {}): OrderDetails {
  return {
    id: 1, orderNumber: "PGS-1", buyerId: 1, status, currency: "THB", itemsSubtotal: 0, shippingTotal: 0,
    discountTotal: 0, grandTotal: 0, shippingAddressId: null, shippingAddressSnapshot: null, buyerNote: null,
    placedAt: "2026-10-01T00:00:00Z", paidAt: null, completedAt: null, cancelledAt: null,
    sellerOrders: children, ...extra,
  };
}

describe("orderStage", () => {
  it.each([
    [order("PENDING_PAYMENT", [child("PENDING_PAYMENT")]), "AWAITING_PAYMENT"],
    [order("PENDING_PAYMENT", [child("PENDING_PAYMENT")], { paymentUnderReview: true }), "PAYMENT_REVIEW"],
    [order("PAID", [child("PREPARING")]), "PREPARING"],
    [order("PAID", [child("PREPARING"), child("SHIPPED")]), "IN_TRANSIT"],
    [order("PAID", [child("SHIPPED"), child("RETURN_REQUESTED")]), "RETURN_IN_PROGRESS"],
    [order("PARTIALLY_COMPLETED", [child("COMPLETED"), child("DELIVERED")]), "IN_TRANSIT"],
    [order("COMPLETED", [child("COMPLETED"), child("CANCELLED")]), "COMPLETED"],
    [order("CANCELLED", [child("CANCELLED")]), "CANCELLED"],
    [order("REFUNDED", [child("REFUNDED")]), "REFUNDED"],
    [order("PAID", [child("RETURNED")]), "RETURN_IN_PROGRESS"],
    [order("COMPLETED", [child("COMPLETED"), child("REFUNDED")]), "COMPLETED"],
  ])("derives the stage the parent status hides (%#)", (input, expected) => {
    expect(orderStage(input).stage).toBe(expected);
  });
});

describe("canBuyerCancel", () => {
  const now = Date.parse("2026-10-01T12:00:00Z");

  it("allows an unpaid order unless its slip is under review", () => {
    expect(canBuyerCancel(order("PENDING_PAYMENT", [child("PENDING_PAYMENT")]), now)).toBe(true);
    expect(canBuyerCancel(order("PENDING_PAYMENT", [], { paymentUnderReview: true }), now)).toBe(false);
  });

  it("allows a paid order only inside the window and before anything ships", () => {
    const inside = { cancellableUntil: "2026-10-02T00:00:00Z" };
    expect(canBuyerCancel(order("PAID", [child("PAID")], inside), now)).toBe(true);
    expect(canBuyerCancel(order("PAID", [child("PAID")], { cancellableUntil: "2026-10-01T11:00:00Z" }), now)).toBe(false);
    expect(canBuyerCancel(order("PAID", [child("PAID"), child("SHIPPED")], inside), now)).toBe(false);
  });
});

describe("nextAutoCompleteAt", () => {
  it("picks the earliest release among parcels still on the way", () => {
    const input = order("PAID", [
      child("SHIPPED", { autoCompleteAt: "2026-10-09T00:00:00Z" }),
      child("DELIVERED", { autoCompleteAt: "2026-10-08T00:00:00Z" }),
      child("COMPLETED", { autoCompleteAt: "2026-10-01T00:00:00Z" }),
    ]);
    expect(nextAutoCompleteAt(input)).toBe("2026-10-08T00:00:00Z");
  });
});
