import { describe, expect, it } from "vitest";

import {
  formatAddressLine,
  formatElapsed,
  formatTimeout,
  orderAlertNotice,
  orderContextLabel,
  parseShippingAddress,
} from "@/features/admin/orders.format";
import type { AdminOrderSummary } from "@/features/admin/orders.types";

const NOW = new Date("2026-10-13T12:00:00+07:00");

function order(overrides: Partial<AdminOrderSummary> = {}): AdminOrderSummary {
  return {
    sellerOrderId: 1,
    sellerOrderNumber: "PGS-20261013-000001-1",
    salesOrderId: 1,
    orderNumber: "PGS-20261013-000001",
    status: "PENDING_PAYMENT",
    grandTotal: 640,
    itemCount: 2,
    seller: { id: 10, username: "kandypop", displayName: "Kandy" },
    buyer: { id: 20, username: "sora_trades", displayName: "Sora" },
    createdAt: "2026-10-13T08:00:00+07:00",
    paidAt: null,
    shippedAt: null,
    completedAt: null,
    cancelledAt: null,
    tracking: null,
    returnReasonCode: null,
    reviewRating: null,
    ...overrides,
  };
}

describe("formatElapsed", () => {
  it("counts minutes under an hour, hours up to two days, then days", () => {
    expect(formatElapsed("2026-10-13T11:35:00+07:00", NOW)).toBe("25 นาที");
    expect(formatElapsed("2026-10-13T08:00:00+07:00", NOW)).toBe("4 ชม.");
    expect(formatElapsed("2026-10-11T13:00:00+07:00", NOW)).toBe("47 ชม.");
    expect(formatElapsed("2026-10-10T12:00:00+07:00", NOW)).toBe("3 วัน");
  });

  it("never shows a negative wait when clocks disagree", () => {
    expect(formatElapsed("2026-10-13T12:05:00+07:00", NOW)).toBe("0 นาที");
  });
});

describe("formatTimeout", () => {
  it("says whole hours as hours and anything else as minutes", () => {
    expect(formatTimeout(60)).toBe("1 ชม.");
    expect(formatTimeout(2880)).toBe("48 ชม.");
    expect(formatTimeout(90)).toBe("90 นาที");
  });
});

describe("orderContextLabel", () => {
  it("shows how long an unpaid order has waited", () => {
    expect(orderContextLabel("PENDING_PAYMENT", order(), NOW)).toBe("ค้าง 4 ชม.");
  });

  it("counts the packing wait from the payment, not from the order", () => {
    const paid = order({ paidAt: "2026-10-13T10:00:00+07:00" });
    expect(orderContextLabel("AWAITING_SHIPMENT", paid, NOW)).toBe("รอแพ็ค 2 ชม.");
  });

  it("shows the tracking number of a parcel in transit", () => {
    const shipped = order({
      tracking: { carrierName: "Kerry", trackingNumber: "TH2408000091" },
    });
    expect(orderContextLabel("IN_TRANSIT", shipped, NOW)).toBe("TH2408000091");
  });

  it("says whether a completed order was reviewed", () => {
    expect(orderContextLabel("COMPLETED", order({ reviewRating: 5 }), NOW)).toBe(
      "รีวิว 5 ดาว",
    );
    expect(orderContextLabel("COMPLETED", order(), NOW)).toBe("ยังไม่รีวิว");
  });

  it("names the return reason of a dispute", () => {
    expect(
      orderContextLabel("DISPUTED", order({ returnReasonCode: "NOT_RECEIVED" }), NOW),
    ).toBe("ไม่ได้รับสินค้า");
  });

  it("shows a dash rather than inventing a value the backend did not send", () => {
    expect(orderContextLabel("AWAITING_SHIPMENT", order(), NOW)).toBe("—");
    expect(orderContextLabel("IN_TRANSIT", order(), NOW)).toBe("—");
    expect(orderContextLabel("DISPUTED", order(), NOW)).toBe("—");
  });
});

describe("orderAlertNotice", () => {
  it("is hidden when there is nothing to warn about", () => {
    expect(
      orderAlertNotice({
        openDisputeCount: 0,
        overduePaymentCount: 0,
        paymentTimeoutMinutes: 60,
      }),
    ).toBeNull();
  });

  it("joins disputes and overdue payments into one sentence", () => {
    const notice = orderAlertNotice({
      openDisputeCount: 11,
      overduePaymentCount: 6,
      paymentTimeoutMinutes: 60,
    });
    expect(notice?.title).toBe(
      "มี 11 คำสั่งซื้อที่เปิดข้อพิพาท และ 6 รายการค้างชำระเกิน 1 ชม.",
    );
  });

  it("mentions only disputes when no payment is overdue", () => {
    const notice = orderAlertNotice({
      openDisputeCount: 2,
      overduePaymentCount: 0,
      paymentTimeoutMinutes: 60,
    });
    expect(notice?.title).toBe("มี 2 คำสั่งซื้อที่เปิดข้อพิพาท");
  });
});

describe("parseShippingAddress", () => {
  it("reads the snapshot written at checkout", () => {
    const address = parseShippingAddress(
      JSON.stringify({
        recipientName: "Somchai Jaidee",
        line1: "99/1 Sukhumvit Rd",
        line2: null,
        district: "Khlong Toei",
        province: "Bangkok",
        postalCode: "10110",
      }),
    );
    expect(address?.recipientName).toBe("Somchai Jaidee");
    expect(address && formatAddressLine(address)).toBe(
      "99/1 Sukhumvit Rd Khlong Toei Bangkok 10110",
    );
  });

  it("returns null for an empty or broken snapshot instead of throwing", () => {
    expect(parseShippingAddress(null)).toBeNull();
    expect(parseShippingAddress("{}")).toBeNull();
    expect(parseShippingAddress("not json")).toBeNull();
  });
});
