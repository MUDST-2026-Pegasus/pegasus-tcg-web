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

    expect(screen.getByRole("heading", { name: /cancel this order\?/i })).toBeInTheDocument();
    expect(
      screen.getByText(/this action cannot be undone and reserved items will be released/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/ORD-2026-0042/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keep order/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm cancel/i })).toBeInTheDocument();
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

    const keepButton = screen.getByRole("button", { name: /keep order/i });
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

    const confirmButton = screen.getByRole("button", { name: /confirm cancel/i });
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

    const keepButton = screen.getByRole("button", { name: /keep order/i });
    expect(keepButton).toBeDisabled();

    const cancellingButton = screen.getByRole("button", { name: /cancelling\.\.\./i });
    expect(cancellingButton).toBeDisabled();
  });
});
