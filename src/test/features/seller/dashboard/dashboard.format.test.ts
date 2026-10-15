import { describe, expect, it } from "vitest";

import {
  countOrders,
  formatDelta,
  lowStock,
  recentOrders,
  salesSummary,
  statCards,
  thaiMonthShortYear,
  toDashboardData,
  todoList,
} from "@/features/seller/dashboard/dashboard.format";
import type { SellerDashboard } from "@/features/seller/dashboard/dashboard.types";

function dashboard(overrides: Partial<SellerDashboard> = {}): SellerDashboard {
  return {
    period: {
      month: "2026-10",
      from: "2026-10-01T00:00:00+07:00",
      to: "2026-11-01T00:00:00+07:00",
    },
    sales: {
      value: 24850,
      previous: 22187.5,
      orderCount: 56,
      previousOrderCount: 50,
      monthly: [
        { month: "2026-09", amount: 22187.5 },
        { month: "2026-10", amount: 24850 },
      ],
    },
    month: { revenue: 26000, cost: 16420, commission: 1242.5, net: 8337.5 },
    orders: { PAID: 5, PREPARING: 3, PENDING_PAYMENT: 2, COMPLETED: 40 },
    listings: {
      active: 142,
      publishedThisMonth: 5,
      lowStockThreshold: 2,
      lowStockCount: 2,
      lowStock: [
        {
          listingId: 7,
          productName: "Charizard ex",
          lotLabel: "Box A",
          conditionCode: "NM",
          quantityAvailable: 1,
          quantityTotal: 10,
        },
        {
          listingId: 8,
          productName: "Pikachu VMAX",
          lotLabel: null,
          conditionCode: "LP",
          quantityAvailable: 2,
          quantityTotal: 4,
        },
      ],
    },
    reviews: { average: 4.75, count: 312, thisMonth: 2, unreplied: 0 },
    wallet: { withdrawable: 3420, pending: 1850.5 },
    recentOrders: [
      {
        sellerOrderId: 41,
        sellerOrderNumber: "PGS-20261013-000041-S1",
        buyerUsername: "nattapong_p",
        buyerDisplayName: "Nattapong",
        firstItemName: "Charizard ex",
        itemCount: 2,
        grandTotal: 1850,
        status: "PAID",
        createdAt: "2026-10-13T09:00:00+07:00",
      },
    ],
    ...overrides,
  };
}

describe("formatDelta", () => {
  it("words growth, decline, no change and a first month", () => {
    expect(formatDelta(24850, 22187.5)).toEqual({ label: "+12.0%", trend: "up" });
    expect(formatDelta(50, 100)).toEqual({ label: "−50.0%", trend: "down" });
    expect(formatDelta(10, 10)).toEqual({ label: "0.0%", trend: "flat" });
    expect(formatDelta(10, 0)).toEqual({ label: "ใหม่", trend: "new" });
    expect(formatDelta(0, 0)).toBeNull();
  });
});

describe("thaiMonthShortYear", () => {
  it("uses the Buddhist year in two digits", () => {
    expect(thaiMonthShortYear("2026-10")).toBe("ต.ค. 69");
    expect(thaiMonthShortYear("2025-11")).toBe("พ.ย. 68");
  });
});

describe("countOrders", () => {
  it("treats a status the API left out as zero", () => {
    const { orders } = dashboard();
    expect(countOrders(orders, ["PAID", "PREPARING"])).toBe(8);
    expect(countOrders(orders, ["RETURN_REQUESTED"])).toBe(0);
  });
});

describe("salesSummary", () => {
  it("highlights the selected month and averages per order", () => {
    const summary = salesSummary(dashboard());
    expect(summary.label).toBe("ยอดขายเดือนตุลาคม (ไม่รวมค่าส่ง)");
    expect(summary.amount).toBe("฿24,850");
    expect(summary.description).toBe("จาก 56 คำสั่งซื้อ · เฉลี่ย ฿444 ต่อออเดอร์");
    expect(summary.bars.map((bar) => bar.highlighted)).toEqual([false, true]);
    expect(summary.rangeStart).toBe("ก.ย. 69");
    expect(summary.rangeEnd).toBe("ต.ค. 69");
  });

  it("says so when nothing was sold", () => {
    const empty = dashboard({
      sales: { value: 0, previous: 0, orderCount: 0, previousOrderCount: 0, monthly: [] },
    });
    expect(salesSummary(empty).description).toBe("ยังไม่มีคำสั่งซื้อที่ชำระแล้วในเดือนนี้");
    expect(salesSummary(empty).delta).toBeNull();
  });
});

describe("todoList", () => {
  it("lists only what has work waiting, most urgent first", () => {
    const todo = todoList(dashboard());
    expect(todo.items.map((item) => item.id)).toEqual(["pack", "restock", "payment"]);
    expect(todo.count).toBe(3);
    expect(todo.items[0]).toMatchObject({
      description: "8 ออเดอร์รอจัดส่ง",
      to: "/seller/orders?status=awaiting_pack",
    });
  });

  it("sends each task to the page where the seller can act on it", () => {
    const todo = todoList(
      dashboard({
        orders: { PAID: 1, RETURN_REQUESTED: 2, PENDING_PAYMENT: 1 },
        reviews: { average: 4.75, count: 312, thisMonth: 2, unreplied: 3 },
      }),
    );
    expect(Object.fromEntries(todo.items.map((item) => [item.id, item.to]))).toEqual({
      pack: "/seller/orders?status=awaiting_pack",
      // แท็บคืนสินค้าของหน้าคำสั่งซื้อดูได้อย่างเดียว อนุมัติ/ปฏิเสธต้องไปหน้านี้
      returns: "/seller/returns",
      restock: "/seller/products?status=ACTIVE&sort=stock_asc",
      payment: "/seller/orders?status=awaiting_payment",
      reviews: "/seller/reviews?tab=unreplied",
    });
  });

  it("is empty when nothing is waiting", () => {
    const todo = todoList(
      dashboard({
        orders: { COMPLETED: 3 },
        listings: { ...dashboard().listings, lowStockCount: 0, lowStock: [] },
      }),
    );
    expect(todo.items).toEqual([]);
    expect(todo.description).toBe("ไม่มีงานค้าง");
  });
});

describe("statCards", () => {
  it("words listings, escrow, rating and the withdrawable balance", () => {
    expect(statCards(dashboard()).map((card) => [card.id, card.value, card.footnote])).toEqual([
      ["listings", "142", "+5 เดือนนี้"],
      ["escrow", "฿1,850.50", "ปล่อยเมื่อผู้ซื้อยืนยันรับสินค้า"],
      ["rating", "4.8 / 5.0", "จาก 312 รีวิว"],
      ["withdrawable", "฿3,420", "หักยอดที่กำลังถอนแล้ว"],
    ]);
  });

  it("shows a dash before the first review", () => {
    const rating = statCards(
      dashboard({ reviews: { average: null, count: 0, thisMonth: 0, unreplied: 0 } }),
    ).find((card) => card.id === "rating");
    expect(rating).toMatchObject({ value: "—", footnote: "ยังไม่มีรีวิว" });
  });
});

describe("recentOrders and lowStock", () => {
  it("labels the status from the seller's side", () => {
    expect(recentOrders(dashboard()).items[0]).toMatchObject({
      id: 41,
      item: "Charizard ex · 2 ชิ้น",
      price: "฿1,850",
      statusLabel: "รอแพ็ค",
    });
  });

  it("names the lot and flags a last card as critical", () => {
    expect(lowStock(dashboard()).items).toEqual([
      { listingId: 7, name: "Charizard ex — Box A", remainingLabel: "เหลือ 1", percent: 10, severity: "critical" },
      { listingId: 8, name: "Pikachu VMAX", remainingLabel: "เหลือ 2", percent: 50, severity: "warning" },
    ]);
  });
});

describe("toDashboardData", () => {
  it("greets the seller and links their storefront", () => {
    const data = toDashboardData(
      dashboard(),
      { displayName: "Minmin", username: "minmin_tcg" },
      new Date("2026-10-13T03:00:00Z"),
    );
    expect(data.greeting).toBe("สวัสดี, Minmin 👋");
    expect(data.subtitle).toContain("13 ตุลาคม 2569");
    expect(data.actions.viewShopTo).toBe("/u/minmin_tcg");
  });
});
