import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import * as ordersApi from "@/features/admin/orders.api";
import type { OrderBoard } from "@/features/admin/orders.types";
import { AdminOrdersPage } from "@/features/admin/pages/AdminOrdersPage";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/orders.api", () => ({
  getOrderBoard: vi.fn(),
  getAdminOrders: vi.fn(),
  getAdminOrder: vi.fn(),
}));

const mockBoard: OrderBoard = {
  columns: [
    {
      key: "PENDING_PAYMENT",
      statuses: ["PENDING_PAYMENT"],
      count: 2,
      items: [
        {
          sellerOrderId: 101,
          sellerOrderNumber: "PGS-20261014-000101-1",
          salesOrderId: 101,
          orderNumber: "PGS-20261014-000101",
          status: "PENDING_PAYMENT",
          grandTotal: 1200,
          itemCount: 1,
          seller: { id: 1, username: "kandypop", displayName: "Kandy" },
          buyer: { id: 2, username: "buyer1", displayName: "Buyer One" },
          createdAt: "2026-10-14T10:00:00Z",
          paidAt: null,
          shippedAt: null,
          completedAt: null,
          cancelledAt: null,
          tracking: null,
          returnReasonCode: null,
          reviewRating: null,
        },
      ],
    },
    {
      key: "AWAITING_SHIPMENT",
      statuses: ["PAID", "PREPARING"],
      count: 1,
      items: [
        {
          sellerOrderId: 102,
          sellerOrderNumber: "PGS-20261014-000102-1",
          salesOrderId: 102,
          orderNumber: "PGS-20261014-000102",
          status: "PAID",
          grandTotal: 2500,
          itemCount: 2,
          seller: { id: 1, username: "kandypop", displayName: "Kandy" },
          buyer: { id: 3, username: "buyer2", displayName: "Buyer Two" },
          createdAt: "2026-10-14T09:00:00Z",
          paidAt: "2026-10-14T09:30:00Z",
          shippedAt: null,
          completedAt: null,
          cancelledAt: null,
          tracking: null,
          returnReasonCode: null,
          reviewRating: null,
        },
      ],
    },
    {
      key: "IN_TRANSIT",
      statuses: ["SHIPPED", "DELIVERED"],
      count: 0,
      items: [],
    },
    {
      key: "COMPLETED",
      statuses: ["COMPLETED"],
      count: 10,
      items: [],
    },
    {
      key: "DISPUTED",
      statuses: ["RETURN_REQUESTED", "RETURNED", "REFUNDED"],
      count: 0,
      items: [],
    },
  ],
  alerts: {
    openDisputeCount: 0,
    overduePaymentCount: 0,
    paymentTimeoutMinutes: 60,
  },
};

describe("AdminOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page header and order kanban columns with order cards", async () => {
    vi.mocked(ordersApi.getOrderBoard).mockResolvedValue(mockBoard);

    renderWithProviders(<AdminOrdersPage />, { route: "/admin/orders" });

    // Header
    expect(screen.getByText("ภาพรวมคำสั่งซื้อ")).toBeInTheDocument();
    expect(screen.getByText(/ติดตามคำสั่งซื้อทั้งแพลตฟอร์มตามสถานะ/i)).toBeInTheDocument();

    // Orders inside Kanban columns
    expect(await screen.findByText("PGS-20261014-000101-1")).toBeInTheDocument();
    expect(screen.getByText("PGS-20261014-000102-1")).toBeInTheDocument();
  });

  it("renders error state when order board query fails", async () => {
    vi.mocked(ordersApi.getOrderBoard).mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<AdminOrdersPage />, { route: "/admin/orders" });

    expect(await screen.findByText("โหลดภาพรวมคำสั่งซื้อไม่สำเร็จ")).toBeInTheDocument();
  });
});
