import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SellerOrdersPage } from "@/features/seller/orders/SellerOrdersPage";
import * as ordersApi from "@/features/seller/orders/orders.api";
import type { SellerOrderQuery, SellerOrderSummary } from "@/features/seller/orders/orders.types";
import type { PageResponse } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/seller/orders/orders.api", () => ({
  getSellerOrders: vi.fn(),
  getSellerOrderCounts: vi.fn(),
}));
// การ์ดผลประกอบการเดือนนี้ไม่เกี่ยวกับที่ทดสอบ — ปล่อยให้โหลดค้างไว้
vi.mock("@/features/seller/dashboard/dashboard.api", () => ({
  getSellerDashboard: () => new Promise(() => {}),
}));

function summary(id: number, sellerOrderNumber: string): SellerOrderSummary {
  return {
    order: {
      id,
      salesOrderId: id,
      sellerProfileId: 3,
      sellerOrderNumber,
      status: "COMPLETED",
      itemsSubtotal: 1800,
      shippingFee: 50,
      discountAmount: 0,
      grandTotal: 1850,
      commissionAmount: 92.5,
      sellerNetAmount: 1757.5,
      acceptedAt: null,
      shippedAt: "2026-10-13T05:00:00Z",
      deliveredAt: null,
      autoCompleteAt: null,
      completedAt: "2026-10-14T05:00:00Z",
      cancelledAt: null,
      cancelReason: null,
      createdAt: "2026-10-13T02:00:00Z",
      items: [],
      shipments: [],
      statusHistory: [],
      sellerName: null,
    },
    orderNumber: sellerOrderNumber.replace(/-S\d+$/, ""),
    buyer: { id: 5, username: "nattapong_p", displayName: "Nattapong", avatarUrl: null },
    paidAt: "2026-10-13T03:00:00Z",
    shipBy: null,
    shippingAddressSnapshot: null,
    buyerNote: null,
  };
}

function page(items: SellerOrderSummary[], totalItems: number, query: SellerOrderQuery): PageResponse<SellerOrderSummary> {
  return {
    items,
    page: query.page,
    size: query.size,
    totalItems,
    totalPages: Math.ceil(totalItems / query.size),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SellerOrdersPage", () => {
  it("recounts the tab chips when the seller switches tab, so a new order shows in both", async () => {
    vi.mocked(ordersApi.getSellerOrderCounts)
      .mockResolvedValueOnce({ COMPLETED: 1 })
      // ผู้ซื้อสั่งของเข้ามาระหว่างที่หน้าเปิดค้างไว้
      .mockResolvedValue({ COMPLETED: 1, PENDING_PAYMENT: 1 });
    vi.mocked(ordersApi.getSellerOrders).mockImplementation(async (query) =>
      query.statuses.includes("PENDING_PAYMENT")
        ? page([summary(52, "PGS-20261014-000052-S3")], 1, query)
        : page([], 0, query),
    );
    const user = userEvent.setup();

    renderWithProviders(<SellerOrdersPage />, { route: "/seller/orders" });
    expect(await screen.findByRole("button", { name: "รอชำระ 0" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "รอชำระ 0" }));

    expect(await screen.findByText("PGS-20261014-000052-S3")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "รอชำระ 1" })).toBeInTheDocument();
    expect(ordersApi.getSellerOrderCounts).toHaveBeenCalledTimes(2);
  });

  it("falls back to the last real page instead of stranding the seller on an empty one", async () => {
    vi.mocked(ordersApi.getSellerOrderCounts).mockResolvedValue({ COMPLETED: 1 });
    vi.mocked(ordersApi.getSellerOrders).mockImplementation(async (query) =>
      page(query.page === 0 ? [summary(17, "PGS-SEED-000017-01")] : [], 1, query),
    );

    renderWithProviders(<SellerOrdersPage />, { route: "/seller/orders?status=completed&page=5" });

    expect(await screen.findByText("PGS-SEED-000017-01")).toBeInTheDocument();
    await waitFor(() =>
      expect(ordersApi.getSellerOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ statuses: ["COMPLETED"], page: 0 }),
      ),
    );
  });

  it("says it is still counting instead of showing zero orders to pack", () => {
    vi.mocked(ordersApi.getSellerOrderCounts).mockReturnValue(new Promise(() => {}));
    vi.mocked(ordersApi.getSellerOrders).mockReturnValue(new Promise(() => {}));

    renderWithProviders(<SellerOrdersPage />, { route: "/seller/orders" });

    expect(screen.getByText("กำลังนับออเดอร์…")).toBeInTheDocument();
    expect(screen.queryByText(/0 ออเดอร์รอแพ็ค/)).not.toBeInTheDocument();
  });
});
