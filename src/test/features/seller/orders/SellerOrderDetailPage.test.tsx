import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { SellerOrderDetailPage } from "@/features/seller/orders/SellerOrderDetailPage";
import * as ordersApi from "@/features/seller/orders/orders.api";
import type { SellerOrderDetail } from "@/features/seller/orders/orders.types";
import { createTestQueryClient } from "@/test/utils";

vi.mock("@/features/seller/orders/orders.api", () => ({
  getSellerOrder: vi.fn(),
  acceptSellerOrder: vi.fn(),
  shipSellerOrder: vi.fn(),
  cancelSellerOrder: vi.fn(),
}));

const mockOrderDetail: SellerOrderDetail = {
  summary: {
    order: {
      id: 501,
      salesOrderId: 101,
      sellerProfileId: 10,
      sellerOrderNumber: "PGS-20261014-000501-S10",
      status: "PAID",
      itemsSubtotal: 2500,
      shippingFee: 50,
      discountAmount: 0,
      grandTotal: 2550,
      commissionAmount: 127.5,
      sellerNetAmount: 2422.5,
      acceptedAt: "2026-10-14T10:00:00Z",
      shippedAt: null,
      deliveredAt: null,
      autoCompleteAt: null,
      completedAt: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: "2026-10-14T09:00:00Z",
      items: [
        {
          id: 1,
          listingId: 101,
          catalogVariantId: 1,
          productName: "Charizard Base Set Holo",
          variantLabel: "Holo",
          condition: "NM",
          unitPrice: 2500,
          quantity: 1,
          lineTotal: 2500,
          gameName: "Pokemon TCG",
          imageKey: null,
          imageUrl: null,
          unitIds: [1],
        },
      ],
      shipments: [],
      statusHistory: [],
      sellerName: "Card Master Shop",
    },
    orderNumber: "ORD-101",
    buyer: { id: 5, username: "buyeruser", displayName: "Buyer User" },
    paidAt: "2026-10-14T09:30:00Z",
    shipBy: "2026-10-16T09:30:00Z",
    shippingAddressSnapshot: JSON.stringify({
      recipientName: "Buyer User",
      line1: "123 Sukhumvit Road",
      province: "Bangkok",
      postalCode: "10110",
      phone: "0812345678",
    }),
    buyerNote: "Please pack carefully",
  },
  payment: {
    method: "BANK_TRANSFER",
    status: "SUCCEEDED",
    amount: 2550,
    paidAt: "2026-10-14T09:30:00Z",
  },
  costTotal: 1000,
  buyerOrderCount: 2,
};

function renderWithRoute(route: string) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/seller/orders/:orderId" element={<SellerOrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SellerOrderDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders order detail with packing list, buyer info, and profit summary", async () => {
    vi.mocked(ordersApi.getSellerOrder).mockResolvedValue(mockOrderDetail);

    renderWithRoute("/seller/orders/501");

    expect(
      await screen.findByRole("heading", { name: "PGS-20261014-000501-S10" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Charizard Base Set Holo")).toBeInTheDocument();
    expect(screen.getAllByText("Buyer User").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Please pack carefully/)).toBeInTheDocument();
    expect(screen.getByText("กำไรจากออเดอร์นี้")).toBeInTheDocument();
    expect(screen.getByText(/1,422.50/)).toBeInTheDocument();
  });

  it("renders not found state when order ID is not numeric or not found", async () => {
    renderWithRoute("/seller/orders/invalid-id");

    expect(await screen.findByText("ไม่พบคำสั่งซื้อ invalid-id")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "กลับไปหน้าจัดการคำสั่งซื้อ" })).toHaveAttribute(
      "href",
      "/seller/orders",
    );
  });
});
