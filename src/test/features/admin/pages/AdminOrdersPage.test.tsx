import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import * as ordersApi from "@/features/admin/orders.api";
import { addDays, bangkokToday, orderExportRange } from "@/features/admin/orders.export";
import { toast } from "@/components/ui/toast";
import type { OrderBoard } from "@/features/admin/orders.types";
import { AdminOrdersPage } from "@/features/admin/pages/AdminOrdersPage";
import { renderWithProviders, userEvent } from "@/test/utils";

vi.mock("@/features/admin/orders.api", () => ({
  getOrderBoard: vi.fn(),
  getAdminOrders: vi.fn(),
  getAdminOrder: vi.fn(),
  downloadAdminOrdersCsv: vi.fn(),
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

  it("finds the exact order linked from a promotion redemption", async () => {
    vi.mocked(ordersApi.getOrderBoard).mockResolvedValue(mockBoard);
    vi.mocked(ordersApi.getAdminOrders).mockResolvedValue({ items: [mockBoard.columns[0].items[0]], page: 0, size: 20, totalItems: 1, totalPages: 1 });
    renderWithProviders(<AdminOrdersPage />, { route: "/admin/orders?q=PGS-20261014-000101" });
    expect(await screen.findByText("คำสั่งซื้อ PGS-20261014-000101")).toBeInTheDocument();
    expect(ordersApi.getAdminOrders).toHaveBeenCalledWith(expect.objectContaining({ q: "PGS-20261014-000101" }));
    expect((await screen.findAllByRole("button", { name: /PGS-20261014-000101-1/ })).length).toBeGreaterThan(0);
  });

  describe("CSV export [TCG-749]", () => {
    beforeEach(() => {
      vi.mocked(ordersApi.getOrderBoard).mockResolvedValue(mockBoard);
      vi.spyOn(toast, "add").mockImplementation(vi.fn());
      Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:orders") });
      Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    });

    it("defaults to the last 30 days and every status, and sends the picked statuses", async () => {
      const csv = new Blob(["csv"], { type: "text/csv" });
      vi.mocked(ordersApi.downloadAdminOrdersCsv).mockResolvedValue({ blob: csv, filename: "admin-orders.csv" });
      const user = userEvent.setup();
      renderWithProviders(<AdminOrdersPage />, { route: "/admin/orders" });

      await user.click(screen.getByRole("button", { name: "ส่งออก CSV" }));
      const dialog = await screen.findByRole("dialog");
      const today = bangkokToday();
      expect(within(dialog).getByLabelText("ตั้งแต่วันที่")).toHaveValue(addDays(today, -29));
      expect(within(dialog).getByLabelText("ถึงวันที่")).toHaveValue(today);

      await user.click(within(dialog).getByRole("checkbox", { name: "ทุกสถานะ" }));
      await user.click(within(dialog).getByRole("checkbox", { name: "ชำระแล้ว" }));
      await user.click(within(dialog).getByRole("button", { name: "ดาวน์โหลด CSV" }));

      await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledWith(csv));
      expect(ordersApi.downloadAdminOrdersCsv).toHaveBeenCalledWith({
        ...orderExportRange(addDays(today, -29), today),
        statuses: ["PAID"],
      });
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("will not export a range that ends before it starts", async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminOrdersPage />, { route: "/admin/orders" });

      await user.click(screen.getByRole("button", { name: "ส่งออก CSV" }));
      const dialog = await screen.findByRole("dialog");
      fireEvent.change(within(dialog).getByLabelText("ตั้งแต่วันที่"), { target: { value: "2026-11-20" } });
      fireEvent.change(within(dialog).getByLabelText("ถึงวันที่"), { target: { value: "2026-11-01" } });

      expect(within(dialog).getByRole("button", { name: "ดาวน์โหลด CSV" })).toBeDisabled();
      expect(within(dialog).getByText(/วันแรกต้องไม่อยู่หลังวันสุดท้าย/)).toBeInTheDocument();
      expect(ordersApi.downloadAdminOrdersCsv).not.toHaveBeenCalled();
    });
  });
});
