import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/utils";
import { ReorderPreviewModal } from "@/features/account/components/ReorderPreviewModal";
import type { OrderDetails } from "@/features/account/orders.types";

const mockOrder: OrderDetails = {
  id: 67,
  orderNumber: "PGS-20261016Z-000067",
  buyerId: 1,
  status: "COMPLETED",
  currency: "THB",
  itemsSubtotal: 8000,
  shippingTotal: 0,
  discountTotal: 0,
  grandTotal: 8000,
  shippingAddressId: 1,
  shippingAddressSnapshot: null,
  buyerNote: null,
  placedAt: "2026-10-17T12:00:00Z",
  paidAt: "2026-10-17T12:05:00Z",
  completedAt: "2026-10-19T14:00:00Z",
  cancelledAt: null,
  sellerOrders: [
    {
      id: 88,
      salesOrderId: 67,
      sellerProfileId: 1,
      sellerName: "Card Kingdom TH",
      sellerOrderNumber: "SO-88",
      status: "COMPLETED",
      itemsSubtotal: 8000,
      shippingFee: 0,
      discountAmount: 0,
      grandTotal: 8000,
      commissionAmount: 0,
      sellerNetAmount: 8000,
      acceptedAt: null,
      shippedAt: null,
      deliveredAt: null,
      autoCompleteAt: null,
      completedAt: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: "2026-10-17T12:00:00Z",
      items: [
        {
          id: 501,
          listingId: 10,
          catalogVariantId: 10,
          quantity: 1,
          unitPrice: 8000,
          lineTotal: 8000,
          productName: "Bio-Broly (SR)",
          variantLabel: "JP • FOIL",
          condition: "DMG",
          gameName: "Dragon Ball Super Card Game",
          imageKey: null,
          imageUrl: null,
          unitIds: [1],
        },
      ],
      shipments: [],
      statusHistory: [],
    },
  ],
};

describe("ReorderPreviewModal", () => {
  it("renders modal header, seller info, blue alert banner, and order item", () => {
    renderWithProviders(
      <ReorderPreviewModal open={true} onOpenChange={vi.fn()} order={mockOrder} />
    );

    expect(
      screen.getByRole("heading", { name: /reorder items \(สั่งซื้อสินค้าอีกครั้ง\)/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/card kingdom th/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/#pgs-20261016z-000067/i)).toBeInTheDocument();

    // Blue alert banner text
    expect(
      screen.getByText(/รายการที่เลือกจะถูกเพิ่มเข้าตะกร้าสินค้าและติ๊กเลือกให้อัตโนมัติ/i)
    ).toBeInTheDocument();

    // Item details
    expect(screen.getByText("Bio-Broly (SR)")).toBeInTheDocument();
    expect(screen.getByText(/previously ordered:/i)).toBeInTheDocument();
    expect(screen.getByText(/dmg \(฿8,000\)/i)).toBeInTheDocument();

    // Condition Guide link
    expect(screen.getByText(/condition guide \(คู่มือสภาพการ์ด\)/i)).toBeInTheDocument();

    // CTA button
    expect(
      screen.getByRole("button", { name: /สั่งสินค้านี้อีกครั้ง/i })
    ).toBeInTheDocument();
  });

  it("allows selecting available card conditions and updates subtotal", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ReorderPreviewModal open={true} onOpenChange={vi.fn()} order={mockOrder} />
    );

    // Initial default condition is NM (appears on condition button and subtotal)
    expect(screen.getByRole("button", { name: /^nm/i })).toBeInTheDocument();
    expect(screen.getAllByText("฿9,440").length).toBe(2);

    // Select LP
    const lpBtn = screen.getByRole("button", { name: /^lp/i });
    await user.click(lpBtn);

    // Subtotal updates to LP price
    expect(screen.getAllByText("฿8,880").length).toBe(2);
  });

  it("allows adjusting quantity with stepper and triggers CTA action to close modal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ReorderPreviewModal open={true} onOpenChange={onOpenChange} order={mockOrder} />
    );

    const plusBtn = screen.getByRole("button", { name: /increase quantity/i });
    await user.click(plusBtn);

    // Click CTA button
    const ctaBtn = screen.getByRole("button", { name: /สั่งสินค้านี้อีกครั้ง/i });
    await user.click(ctaBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ReorderPreviewModal open={true} onOpenChange={onOpenChange} order={mockOrder} />
    );

    const closeBtn = screen.getByRole("button", { name: /close/i });
    await user.click(closeBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });
});
