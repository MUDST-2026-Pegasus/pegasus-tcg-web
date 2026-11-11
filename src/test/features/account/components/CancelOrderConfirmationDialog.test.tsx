import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/utils";
import { CancelOrderConfirmationDialog } from "@/features/account/components/CancelOrderConfirmationDialog";
import type { OrderDetails } from "@/features/account/orders.types";

const mockOrder: OrderDetails = {
  id: 42,
  orderNumber: "ORD-2026-0042",
  buyerId: 1,
  status: "PENDING_PAYMENT",
  currency: "THB",
  itemsSubtotal: 1000,
  shippingTotal: 50,
  discountTotal: 0,
  grandTotal: 1050,
  shippingAddressId: 1,
  shippingAddressSnapshot: null,
  buyerNote: null,
  placedAt: "2026-10-13T10:00:00Z",
  paidAt: null,
  completedAt: null,
  cancelledAt: null,
  sellerOrders: [],
};

describe("CancelOrderConfirmationDialog", () => {
  it("explains when an unpaid order restores its code", () => {
    renderWithProviders(<CancelOrderConfirmationDialog open onOpenChange={vi.fn()} order={{ ...mockOrder, promotionsRestoredOnCancel: true, promotions: [{ code: "PEGASUS10", ownerType: "PLATFORM", sellerProfileId: null, amount: 100, status: "RESERVED" }] }} onConfirm={vi.fn()} isCancelling={false} />);
    expect(screen.getByText(/PEGASUS10 จะกลับเข้า “โค้ดของฉัน”/)).toBeInTheDocument();
  });

  it("explains that a paid order does not restore its code", () => {
    renderWithProviders(<CancelOrderConfirmationDialog open onOpenChange={vi.fn()} order={{ ...mockOrder, status: "PAID", paidAt: "2026-11-01T10:00:00Z", promotionsRestoredOnCancel: false, promotions: [{ code: "PEGASUS10", ownerType: "PLATFORM", sellerProfileId: null, amount: 100, status: "CONSUMED" }] }} onConfirm={vi.fn()} isCancelling={false} />);
    expect(screen.getByText(/จะไม่ได้คืนสิทธิ์ เพราะชำระเงินแล้ว/)).toBeInTheDocument();
  });

  it("shows per-shop payment, applied codes, refund and required reason for a paid promotion order", async () => {
    const onConfirm = vi.fn();
    const order = {
      ...mockOrder,
      status: "PAID",
      paidAt: "2026-11-01T10:00:00Z",
      grandTotal: 775.94,
      sellerDiscountTotal: 50,
      platformDiscountTotal: 49.06,
      promotionsRestoredOnCancel: false,
      promotions: [
        { code: "MINMIN50", ownerType: "SELLER" as const, sellerProfileId: 12, amount: 50, status: "CONSUMED" },
        { code: "PEGASUS10", ownerType: "PLATFORM" as const, sellerProfileId: null, amount: 49.06, status: "CONSUMED" },
      ],
      sellerOrders: [{ id: 7, sellerOrderNumber: "SO-7", sellerName: "minmin_tcg", grandTotal: 775.94 }],
    } as OrderDetails;
    renderWithProviders(<CancelOrderConfirmationDialog open onOpenChange={vi.fn()} order={order} onConfirm={onConfirm} isCancelling={false} />);

    expect(screen.getByText("ยอดที่จ่ายให้ร้านนี้")).toBeInTheDocument();
    expect(screen.getAllByText("THB 775.94")).toHaveLength(2);
    expect(screen.getByText(/MINMIN50/)).toBeInTheDocument();
    expect(screen.getByText("PEGASUS10")).toBeInTheDocument();
    expect(screen.getByText("เงินคืน")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "เหตุผลการยกเลิก" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "ยกเลิกคำสั่งซื้อ" }));
    expect(onConfirm).toHaveBeenCalledWith("เปลี่ยนใจ / สั่งผิด");
  });
  it("renders correctly when open with title, description, and action buttons", () => {
    renderWithProviders(
      <CancelOrderConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        order={mockOrder}
        onConfirm={vi.fn()}
        isCancelling={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "ยกเลิกคำสั่งซื้อนี้?" })).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่ได้ชำระเงิน/)).toBeInTheDocument();
    expect(screen.getByText(/ORD-2026-0042/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ไม่ยกเลิก" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ยกเลิกคำสั่งซื้อ" })).toBeInTheDocument();
    expect(screen.queryByText(/โค้ดที่ใช้กับคำสั่งซื้อนี้/)).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when clicking Keep Order", async () => {
    const handleOpenChange = vi.fn();
    renderWithProviders(
      <CancelOrderConfirmationDialog
        open={true}
        onOpenChange={handleOpenChange}
        order={mockOrder}
        onConfirm={vi.fn()}
        isCancelling={false}
      />,
    );

    const keepButton = screen.getByRole("button", { name: "ไม่ยกเลิก" });
    await userEvent.click(keepButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onConfirm when clicking Confirm Cancel", async () => {
    const handleConfirm = vi.fn();
    renderWithProviders(
      <CancelOrderConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        order={mockOrder}
        onConfirm={handleConfirm}
        isCancelling={false}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: "ยกเลิกคำสั่งซื้อ" });
    await userEvent.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalled();
  });

  it("disables buttons and displays Cancelling... state when isCancelling is true", () => {
    renderWithProviders(
      <CancelOrderConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        order={mockOrder}
        onConfirm={vi.fn()}
        isCancelling={true}
      />,
    );

    const keepButton = screen.getByRole("button", { name: "ไม่ยกเลิก" });
    expect(keepButton).toBeDisabled();

    const cancellingButton = screen.getByRole("button", { name: "กำลังยกเลิก..." });
    expect(cancellingButton).toBeDisabled();
  });
});
