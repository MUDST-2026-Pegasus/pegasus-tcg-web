import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import * as ordersApi from "@/features/admin/orders.api";
import type { AdminOrderDetail } from "@/features/admin/orders.types";
import { OrderDetailSheet } from "@/features/admin/components/OrderDetailSheet";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/orders.api", () => ({
  getOrderBoard: vi.fn(),
  getAdminOrders: vi.fn(),
  getAdminOrder: vi.fn(),
}));

const detail: AdminOrderDetail = {
  summary: {
    sellerOrderId: 12,
    sellerOrderNumber: "PGS-20261030-0123-S12",
    salesOrderId: 1,
    orderNumber: "PGS-20261030-0123",
    status: "COMPLETED",
    grandTotal: 775.94,
    itemCount: 1,
    seller: { id: 2, username: "minmin_tcg", displayName: "minmin_tcg" },
    buyer: { id: 3, username: "buyer", displayName: "Buyer" },
    createdAt: "2026-10-30T00:00:00Z",
    paidAt: "2026-10-30T01:00:00Z",
    shippedAt: "2026-10-31T00:00:00Z",
    completedAt: "2026-11-01T00:00:00Z",
    cancelledAt: null,
    tracking: null,
    returnReasonCode: null,
    reviewRating: null,
  },
  order: {
    id: 12,
    salesOrderId: 1,
    sellerProfileId: 2,
    sellerOrderNumber: "PGS-20261030-0123-S12",
    status: "COMPLETED",
    itemsSubtotal: 830,
    shippingFee: 45,
    discountAmount: 99.06,
    grandTotal: 775.94,
    commissionAmount: 39,
    sellerNetAmount: 786,
    acceptedAt: null,
    shippedAt: null,
    deliveredAt: null,
    autoCompleteAt: null,
    completedAt: "2026-11-01T00:00:00Z",
    cancelledAt: null,
    cancelReason: null,
    createdAt: "2026-10-30T00:00:00Z",
    items: [],
    shipments: [],
    statusHistory: [],
    sellerName: "minmin_tcg",
    sellerDiscount: 50,
    platformDiscount: 49.06,
    platformSubsidy: 49.06,
    commissionBase: 780,
    promotions: [
      { code: "MINMIN50", ownerType: "SELLER", amount: 50 },
      { code: "PEGASUS10", ownerType: "PLATFORM", amount: 49.06 },
    ],
  },
  shippingAddressSnapshot: null,
  buyerNote: null,
  payment: null,
};

describe("OrderDetailSheet promotion breakdown", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows one per-shop table row with split codes and the O1 payable/commission/net values", async () => {
    vi.mocked(ordersApi.getAdminOrder).mockResolvedValue(detail);
    renderWithProviders(<OrderDetailSheet sellerOrderId={12} onClose={vi.fn()} />);

    const table = await screen.findByRole("table", { name: "ส่วนลดตามร้าน" });
    expect(table).toHaveTextContent("minmin_tcg");
    expect(table).toHaveTextContent("MINMIN50");
    expect(table).toHaveTextContent("PEGASUS10");
    expect(table).toHaveTextContent("฿775.94");
    expect(table).toHaveTextContent("฿39.00");
    expect(table).toHaveTextContent("฿786.00");
    expect(screen.queryByText("ส่วนลด", { exact: true })).not.toBeInTheDocument();
  });

  it("keeps the existing amount summary for orders without promotions", async () => {
    vi.mocked(ordersApi.getAdminOrder).mockResolvedValue({
      ...detail,
      order: { ...detail.order, discountAmount: 0, sellerDiscount: 0, platformDiscount: 0, promotions: [] },
    });
    renderWithProviders(<OrderDetailSheet sellerOrderId={12} onClose={vi.fn()} />);

    expect(await screen.findByText("ค่าสินค้า")).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "ส่วนลดตามร้าน" })).not.toBeInTheDocument();
  });
});
