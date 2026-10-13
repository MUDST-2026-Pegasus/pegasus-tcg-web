import { describe, expect, it } from "vitest";

import {
  ORDER_TABS,
  addressLines,
  canAccept,
  canCancel,
  canShip,
  countOf,
  deadlineLabel,
  formatAgo,
  monthlySummary,
  orderErrorMessage,
  parseShippingAddress,
  paymentStateOf,
  profitSummary,
  sortOf,
  tabOf,
  tabOfStatus,
  timelineEntries,
} from "@/features/seller/orders/orders.format";
import type { SellerOrderDetail, SellerOrderDetails } from "@/features/seller/orders/orders.types";
import type { SellerOrderStatus } from "@/features/seller/shared/seller.types";
import { ApiError } from "@/lib/api/errors";

function order(overrides: Partial<SellerOrderDetails> = {}): SellerOrderDetails {
  return {
    id: 41,
    salesOrderId: 9,
    sellerProfileId: 3,
    sellerOrderNumber: "PGS-20261013-000009-S3",
    status: "PAID",
    itemsSubtotal: 1800,
    shippingFee: 50,
    discountAmount: 0,
    grandTotal: 1850,
    commissionAmount: 92.5,
    sellerNetAmount: 1757.5,
    acceptedAt: null,
    shippedAt: null,
    deliveredAt: null,
    autoCompleteAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: "2026-10-13T02:00:00Z",
    items: [],
    shipments: [],
    statusHistory: [],
    sellerName: null,
    ...overrides,
  };
}

function detail(overrides: Partial<SellerOrderDetails> = {}, costTotal = 980): SellerOrderDetail {
  return {
    summary: {
      order: order(overrides),
      orderNumber: "PGS-20261013-000009",
      buyer: { id: 5, username: "nattapong_p", displayName: "Nattapong" },
      paidAt: "2026-10-13T03:00:00Z",
      shipBy: "2026-10-15T03:00:00Z",
      shippingAddressSnapshot: null,
      buyerNote: null,
    },
    payment: null,
    costTotal,
    buyerOrderCount: 1,
  };
}

describe("tabs", () => {
  it("puts every status in exactly one tab", () => {
    const all: SellerOrderStatus[] = [
      "PENDING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED",
      "COMPLETED", "CANCELLED", "RETURN_REQUESTED", "RETURNED", "REFUNDED",
    ];
    for (const status of all) {
      expect(ORDER_TABS.filter((tab) => tab.statuses.includes(status))).toHaveLength(1);
    }
  });

  it("falls back to the first tab and the default sort for unknown URL values", () => {
    expect(tabOf("nope").id).toBe("awaiting_pack");
    expect(tabOf("returns").statuses).toEqual(["RETURN_REQUESTED", "RETURNED", "REFUNDED"]);
    expect(tabOfStatus("DELIVERED").id).toBe("shipped");
    expect(sortOf("CHEAPEST")).toBe("default");
    expect(sortOf("TOTAL_DESC")).toBe("TOTAL_DESC");
  });

  it("sums a tab's statuses, counting missing ones as zero", () => {
    expect(countOf({ PAID: 2, PREPARING: 1 }, tabOf("awaiting_pack").statuses)).toBe(3);
    expect(countOf(undefined, ["PAID"])).toBe(0);
  });
});

describe("what the seller may do", () => {
  it("follows SellerOrderStatus on the backend", () => {
    expect(canAccept("PAID")).toBe(true);
    expect(canAccept("PREPARING")).toBe(false);
    expect(canShip("PAID")).toBe(true);
    expect(canShip("PREPARING")).toBe(true);
    expect(canShip("SHIPPED")).toBe(false);
    expect(canCancel("PENDING_PAYMENT")).toBe(true);
    expect(canCancel("SHIPPED")).toBe(false);
  });
});

describe("address", () => {
  it("parses the checkout snapshot into lines and skips empty parts", () => {
    const address = parseShippingAddress(
      JSON.stringify({
        recipientName: "ณัฐพงษ์",
        phone: "0812345678",
        line1: "88/12 ซ.ลาดพร้าว 15",
        line2: null,
        subdistrict: "จอมพล",
        district: "จตุจักร",
        province: "กรุงเทพมหานคร",
        postalCode: "10900",
      }),
    );
    expect(addressLines(address)).toEqual([
      "ณัฐพงษ์",
      "88/12 ซ.ลาดพร้าว 15",
      "จอมพล จตุจักร กรุงเทพมหานคร 10900",
      "โทร 0812345678",
    ]);
  });

  it("survives a broken or empty snapshot", () => {
    expect(parseShippingAddress("{not json")).toBeNull();
    expect(parseShippingAddress("{}")).toBeNull();
    expect(addressLines(null)).toEqual(["ไม่มีที่อยู่จัดส่ง"]);
  });
});

describe("time", () => {
  const now = new Date("2026-10-14T05:00:00Z");

  it("words how long ago", () => {
    expect(formatAgo("2026-10-14T04:59:40Z", now)).toBe("เมื่อสักครู่");
    expect(formatAgo("2026-10-14T03:00:00Z", now)).toBe("เมื่อ 2 ชม. ที่แล้ว");
    expect(formatAgo("2026-10-11T05:00:00Z", now)).toBe("เมื่อ 3 วันที่แล้ว");
  });

  it("flags only orders still to ship that are close to or past ship-by", () => {
    expect(deadlineLabel("PAID", "2026-10-14T20:00:00Z", now)).toBe("ใกล้เกินกำหนด");
    expect(deadlineLabel("PREPARING", "2026-10-14T01:00:00Z", now)).toBe("เลยกำหนดส่ง");
    expect(deadlineLabel("PAID", "2026-10-17T05:00:00Z", now)).toBeNull();
    expect(deadlineLabel("SHIPPED", "2026-10-14T01:00:00Z", now)).toBeNull();
    expect(deadlineLabel("PENDING_PAYMENT", null, now)).toBeNull();
  });
});

describe("payment, timeline and profit", () => {
  it("reads payment state from the order status", () => {
    expect(paymentStateOf("PENDING_PAYMENT")).toBe("pending");
    expect(paymentStateOf("SHIPPED")).toBe("paid");
    expect(paymentStateOf("CANCELLED")).toBe("refunded");
  });

  it("marks the first step without a time as in progress", () => {
    const entries = timelineEntries(order(), "2026-10-13T03:00:00Z");
    expect(entries.map((entry) => [entry.id, entry.done])).toEqual([
      ["ordered", true],
      ["paid", true],
      ["accepted", false],
      ["shipped", false],
      ["completed", false],
    ]);
    expect(entries[2].detail).toBe("กำลังดำเนินการ");
    expect(entries[3].detail).toBe("รอดำเนินการ");
  });

  it("drops accept when the order shipped straight from PAID", () => {
    const entries = timelineEntries(
      order({ status: "SHIPPED", shippedAt: "2026-10-13T05:00:00Z" }),
      "2026-10-13T03:00:00Z",
    );
    expect(entries.map((entry) => entry.id)).toEqual(["ordered", "paid", "shipped", "completed"]);
  });

  it("ends a cancelled order with the reason and leaves out what never happened", () => {
    const entries = timelineEntries(
      order({ status: "CANCELLED", cancelledAt: "2026-10-13T04:00:00Z", cancelReason: "การ์ดเสียหาย" }),
      "2026-10-13T03:00:00Z",
    );
    expect(entries.map((entry) => entry.id)).toEqual(["ordered", "paid", "cancelled"]);
    expect(entries.at(-1)?.label).toBe("ยกเลิกคำสั่งซื้อ · การ์ดเสียหาย");
  });

  it("takes commission and the frozen cost off the total", () => {
    expect(profitSummary(detail())).toEqual({
      rows: [
        { id: "sales", label: "ยอดขาย (รวมค่าส่ง)", value: "฿1,850" },
        { id: "commission", label: "− ค่าคอมมิชชั่น", value: "฿92.50" },
        { id: "cost", label: "− ต้นทุนสินค้า", value: "฿980" },
      ],
      net: "฿777.50",
    });
    expect(profitSummary(detail({ status: "CANCELLED" }))).toBeNull();
  });

  it("words the month from the dashboard numbers", () => {
    expect(monthlySummary({ revenue: 26000, cost: 16420, commission: 1242.5, net: 8337.5 })).toMatchObject({
      rows: [
        { value: "฿26,000" },
        { value: "− ฿16,420" },
        { value: "− ฿1,242.50" },
      ],
      netValue: "฿8,337.50",
    });
  });
});

describe("orderErrorMessage", () => {
  it("explains the conflicts the seller can hit", () => {
    const conflict = new ApiError({ status: 409, code: "ORDER_STATUS_TRANSITION", message: "x" });
    expect(orderErrorMessage(conflict, "fallback")).toBe("สถานะออเดอร์เปลี่ยนไปแล้ว รีเฟรชแล้วลองใหม่");
  });
});
