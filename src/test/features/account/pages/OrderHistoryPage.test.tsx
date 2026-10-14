import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/utils";
import { OrderHistoryPage } from "@/features/account/pages/OrderHistoryPage";
import * as orderQueries from "@/features/account/orders.queries";
import { ordersApi } from "@/features/account/orders.api";
import * as authQueries from "@/features/auth/auth.queries";
import type { OrderDetails } from "@/features/account/orders.types";

const mockOrders: OrderDetails[] = [
  {
    id: 101,
    orderNumber: "ORD-101",
    buyerId: 1,
    status: "PENDING_PAYMENT",
    currency: "THB",
    itemsSubtotal: 500,
    shippingTotal: 40,
    discountTotal: 0,
    grandTotal: 540,
    shippingAddressId: 1,
    shippingAddressSnapshot: JSON.stringify({
      recipientName: "Ash Ketchum",
      phone: "0812345678",
      line1: "123 Pallet Town",
      district: "Kanto",
      province: "Bangkok",
      postalCode: "10110",
    }),
    buyerNote: null,
    placedAt: "2026-10-10T12:00:00Z",
    paidAt: null,
    completedAt: null,
    cancelledAt: null,
    sellerOrders: [
      {
        id: 201,
        salesOrderId: 101,
        sellerProfileId: 1,
        sellerName: "Professor Oak's Cards",
        sellerOrderNumber: "SO-201",
        status: "PREPARING",
        itemsSubtotal: 500,
        shippingFee: 40,
        discountAmount: 0,
        grandTotal: 540,
        commissionAmount: 10,
        sellerNetAmount: 530,
        acceptedAt: null,
        shippedAt: null,
        deliveredAt: null,
        autoCompleteAt: null,
        completedAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: "2026-10-10T12:00:00Z",
        items: [
          {
            id: 301,
            listingId: 1,
            catalogVariantId: 1,
            quantity: 1,
            unitPrice: 500,
            lineTotal: 500,
            productName: "Charizard Holo Rare",
            variantLabel: "1st Edition",
            condition: "Near Mint",
            gameName: "Pokemon",
            imageKey: null,
            imageUrl: null,
            unitIds: [1],
          },
        ],
        shipments: [],
        statusHistory: [],
      },
    ],
  },
  {
    id: 102,
    orderNumber: "ORD-102",
    buyerId: 1,
    status: "PAID",
    currency: "THB",
    itemsSubtotal: 800,
    shippingTotal: 40,
    discountTotal: 0,
    grandTotal: 840,
    shippingAddressId: 1,
    shippingAddressSnapshot: null,
    buyerNote: null,
    placedAt: "2026-10-09T10:00:00Z",
    paidAt: "2026-10-09T10:05:00Z",
    completedAt: null,
    cancelledAt: null,
    sellerOrders: [],
  },
];

describe("OrderHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(authQueries, "useAuth").mockReturnValue({
      user: {
        id: 1,
        username: "testbuyer",
        email: "buyer@example.com",
        displayName: "Test Buyer",
        roles: ["BUYER"],
        avatarUrl: null,
        phone: null,
        bio: null,
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00Z",
        lastLoginAt: null,
      },
      isLoading: false,
      isAuthenticated: true,
      roles: ["BUYER"],
      hasRole: (...wanted) => wanted.includes("BUYER"),
    });


    vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: mockOrders,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);
  });

  it("renders the buyer-facing stage on each order card", () => {
    renderWithProviders(<OrderHistoryPage />);

    // Unpaid order and a paid one the seller has not shipped yet
    expect(screen.getByText("Awaiting Payment")).toBeInTheDocument();
    expect(screen.getByText("Preparing")).toBeInTheDocument();
  });

  it("shows Confirm Received on an in-transit order and confirms it from the card", async () => {
    const shipped: OrderDetails = {
      ...mockOrders[0],
      id: 103,
      orderNumber: "ORD-103",
      status: "PAID",
      paidAt: "2026-10-10T12:05:00Z",
      sellerOrders: [{
        ...mockOrders[0].sellerOrders[0],
        id: 203,
        salesOrderId: 103,
        status: "SHIPPED",
        autoCompleteAt: "2026-10-20T12:00:00Z",
        shipments: [{
          id: 1, sellerOrderId: 203, carrierCode: "KERRY", carrierName: "Kerry Express",
          trackingNumber: "KEX123", status: "IN_TRANSIT", shippedAt: null,
          estimatedDeliveryDate: null, deliveredAt: null,
        }],
      }],
    };
    vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [shipped], isLoading: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);
    const confirmSpy = vi.spyOn(ordersApi, "confirmReceived").mockResolvedValue({ ...shipped, status: "COMPLETED" });

    renderWithProviders(<OrderHistoryPage />);

    expect(screen.getByText("In Transit")).toBeInTheDocument();
    expect(screen.getByText("Kerry Express KEX123")).toBeInTheDocument();
    expect(screen.getByText(/auto-confirms on/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancel order/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /confirm received/i }));
    await userEvent.click(screen.getByRole("button", { name: /^confirm receipt$/i }));

    await waitFor(() => expect(confirmSpy).toHaveBeenCalledWith(103));
  });

  it("hides Pay Now and Cancel while the payment slip is under review", () => {
    vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [{ ...mockOrders[0], paymentUnderReview: true }], isLoading: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);

    renderWithProviders(<OrderHistoryPage />);

    expect(screen.getByText("Verifying Payment")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pay now/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancel order/i })).not.toBeInTheDocument();
  });

  it("opens custom CancelOrderConfirmationDialog without window.confirm when Cancel Order is clicked", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    const cancelOrderApiSpy = vi.spyOn(ordersApi, "cancelOrder").mockResolvedValue({
      id: 101,
      orderNumber: "ORD-101",
      buyerId: 1,
      status: "CANCELLED",
      currency: "THB",
      itemsSubtotal: 500,
      shippingTotal: 40,
      discountTotal: 0,
      grandTotal: 540,
      shippingAddressId: 1,
      shippingAddressSnapshot: null,
      buyerNote: null,
      placedAt: "2026-10-10T12:00:00Z",
      paidAt: null,
      completedAt: null,
      cancelledAt: null,
      sellerOrders: [],
    });

    renderWithProviders(<OrderHistoryPage />);

    // Click "Cancel Order" on the pending order card
    const cancelBtn = screen.getByRole("button", { name: /cancel order/i });
    await userEvent.click(cancelBtn);

    // Verify window.confirm was NOT called
    expect(confirmSpy).not.toHaveBeenCalled();

    // Verify custom modal is opened
    expect(screen.getByRole("heading", { name: /cancel this order\?/i })).toBeInTheDocument();
    expect(
      screen.getByText(/this action cannot be undone and reserved items will be released/i),
    ).toBeInTheDocument();

    // Click "Confirm Cancel" inside the custom dialog
    const confirmCancelBtn = screen.getByRole("button", { name: /confirm cancel/i });
    await userEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(cancelOrderApiSpy).toHaveBeenCalledWith(101, "Buyer requested cancellation");
    });
  });

  it("opens View Details modal with sticky close button, formatted status, and no bottom close button", async () => {
    renderWithProviders(<OrderHistoryPage />);

    const viewDetailsButtons = screen.getAllByRole("button", { name: /view details/i });
    await userEvent.click(viewDetailsButtons[0]);

    // Modal should be open
    expect(screen.getByRole("heading", { name: /order details/i })).toBeInTheDocument();
    expect(screen.getByText("Order #ORD-101")).toBeInTheDocument();

    // Package status in modal body should be formatted (PREPARING -> Processing)
    expect(screen.getByText(/package status: processing/i)).toBeInTheDocument();

    // Only one Close button should exist in the modal (the top-right close icon button)
    const closeButtons = screen.getAllByRole("button", { name: /close/i });
    expect(closeButtons).toHaveLength(1);

    // Clicking top-right close icon button closes the modal
    await userEvent.click(closeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Order #ORD-101")).not.toBeInTheDocument();
    });
  });
});
