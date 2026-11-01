import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/utils";
import { OrderHistoryPage } from "@/features/account/pages/OrderHistoryPage";
import * as orderQueries from "@/features/account/orders.queries";
import { ordersApi } from "@/features/account/orders.api";
import * as authQueries from "@/features/auth/auth.queries";
import { financeApi } from "@/features/finance/finance.api";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import type { Review } from "@/features/finance/after-sales.types";
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

  it("opens the linked order details and closes without reopening the query link", async () => {
    const user = userEvent.setup();
    vi.spyOn(ordersApi, "getOrder").mockResolvedValue(mockOrders[0]);
    renderWithProviders(<OrderHistoryPage />, { route: "/account/orders?orderId=101" });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(ordersApi.getOrder).toHaveBeenCalledWith(101);
    await user.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
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

  it("offers Write a Review only while a completed seller is still unreviewed", async () => {
    const twoSellers: OrderDetails = {
      ...mockOrders[0],
      id: 104,
      orderNumber: "ORD-104",
      status: "COMPLETED",
      paidAt: "2026-10-10T12:05:00Z",
      sellerOrders: [
        { ...mockOrders[0].sellerOrders[0], id: 204, salesOrderId: 104, status: "COMPLETED" },
        { ...mockOrders[0].sellerOrders[0], id: 205, salesOrderId: 104, status: "REFUNDED" },
      ],
    };
    vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [twoSellers], isLoading: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);
    const mine = vi.spyOn(afterSalesApi, "myReview").mockResolvedValue({ id: 1, rating: 5 } as Review);

    renderWithProviders(<OrderHistoryPage />);

    await waitFor(() => expect(mine).toHaveBeenCalledWith(204));
    expect(mine).not.toHaveBeenCalledWith(205);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /write a review/i })).not.toBeInTheDocument();
  });

  it("shows Write a Review when a completed seller has no review yet", async () => {
    vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [{
        ...mockOrders[0], id: 105, status: "COMPLETED",
        sellerOrders: [{ ...mockOrders[0].sellerOrders[0], id: 206, salesOrderId: 105, status: "COMPLETED" }],
      }],
      isLoading: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);
    vi.spyOn(afterSalesApi, "myReview").mockResolvedValue(null);

    renderWithProviders(<OrderHistoryPage />);

    expect(await screen.findByRole("button", { name: /write a review/i })).toBeInTheDocument();
  });

  it("shows a refund inside the card of the order it belongs to", async () => {
    vi.spyOn(financeApi, "myRefunds").mockResolvedValue([{
      id: 9, salesOrderId: 102, sellerOrderId: null, amount: 840, reason: "Out of stock",
      status: "PROCESSED", method: "BANK_TRANSFER", bankName: null, accountName: null,
      accountNumber: null, transferReference: "TRX-1", requestedAt: "2026-10-09T11:00:00Z", processedAt: null,
    }]);

    renderWithProviders(<OrderHistoryPage />);

    const panel = await screen.findByRole("region", { name: "การคืนเงิน" });
    expect(panel.closest("[data-stage]")?.textContent).toContain("ORD-102");
    expect(panel.textContent).toContain("TRX-1");
    expect(screen.getAllByRole("region", { name: "การคืนเงิน" })).toHaveLength(1);
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

  it("asks for the refund bank account right after cancelling, without a reload", async () => {
    vi.spyOn(ordersApi, "cancelOrder").mockResolvedValue({ ...mockOrders[0], status: "CANCELLED" });
    vi.spyOn(financeApi, "myRefunds")
      .mockResolvedValueOnce([])
      .mockResolvedValue([{
        id: 11, salesOrderId: 101, sellerOrderId: null, amount: 540, reason: "Buyer requested cancellation",
        status: "APPROVED", method: "BANK_TRANSFER", bankName: null, accountName: null,
        accountNumber: null, transferReference: null, requestedAt: "2026-10-10T12:10:00Z", processedAt: null,
      }]);

    renderWithProviders(<OrderHistoryPage />);

    await userEvent.click(screen.getByRole("button", { name: /cancel order/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm cancel/i }));

    expect(await screen.findByRole("textbox", { name: "เลขบัญชีสำหรับคืนเงิน 11" })).toBeInTheDocument();
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

  it("renders status filter tabs with dynamic counts and filters orders by selected status tab", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrderHistoryPage />);

    // Verify all 5 filter tabs are rendered
    const allTab = screen.getByRole("tab", { name: /ทั้งหมด \(All\)/i });
    const pendingTab = screen.getByRole("tab", { name: /รอชำระเงิน \(Pending\)/i });
    const inTransitTab = screen.getByRole("tab", { name: /กำลังจัดส่ง \(In Transit\)/i });
    const completedTab = screen.getByRole("tab", { name: /สำเร็จแล้ว \(Completed\)/i });
    const cancelledTab = screen.getByRole("tab", { name: /ยกเลิกแล้ว \(Cancelled\)/i });

    expect(allTab).toBeInTheDocument();
    expect(pendingTab).toBeInTheDocument();
    expect(inTransitTab).toBeInTheDocument();
    expect(completedTab).toBeInTheDocument();
    expect(cancelledTab).toBeInTheDocument();

    // Both orders visible initially
    expect(screen.getByText("ORD-101")).toBeInTheDocument();
    expect(screen.getByText("ORD-102")).toBeInTheDocument();

    // Filter to Pending
    await user.click(pendingTab);
    expect(screen.getByText("ORD-101")).toBeInTheDocument();
    expect(screen.queryByText("ORD-102")).not.toBeInTheDocument();

    // Filter to Cancelled (0 orders)
    await user.click(cancelledTab);
    expect(screen.queryByText("ORD-101")).not.toBeInTheDocument();
    expect(screen.queryByText("ORD-102")).not.toBeInTheDocument();
    expect(screen.getByText("No orders found")).toBeInTheDocument();

    // Click "View all orders" button in empty state
    await user.click(screen.getByRole("button", { name: /view all orders/i }));
    expect(screen.getByText("ORD-101")).toBeInTheDocument();
    expect(screen.getByText("ORD-102")).toBeInTheDocument();
  });

  it("renders Reorder button ONLY on completed orders and directly opens ReorderPreviewModal", async () => {
    const user = userEvent.setup();
    const completedOrder: OrderDetails = {
      ...mockOrders[0],
      id: 106,
      orderNumber: "ORD-106",
      status: "COMPLETED",
      sellerOrders: [
        {
          ...mockOrders[0].sellerOrders[0],
          id: 206,
          salesOrderId: 106,
          status: "COMPLETED",
          items: [
            {
              ...mockOrders[0].sellerOrders[0].items[0],
              productName: "Mega Evolution Booster Box",
            },
          ],
        },
      ],
    };

    vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [mockOrders[0], completedOrder],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);

    renderWithProviders(<OrderHistoryPage />);

    // Reorder button should exist only for completed order
    const reorderButtons = screen.getAllByRole("button", { name: /^reorder$/i });
    expect(reorderButtons).toHaveLength(1);

    // Clicking Reorder directly opens ReorderPreviewModal without opening OrderDetailsModal
    await user.click(reorderButtons[0]);
    expect(
      screen.getByRole("heading", { name: /reorder items \(สั่งซื้อสินค้าอีกครั้ง\)/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/#ord-106/i)).toBeInTheDocument();
  });

  it("renders Reorder button inside OrderDetailsModal for completed order and opens preview", async () => {
    const user = userEvent.setup();
    const completedOrder: OrderDetails = {
      ...mockOrders[0],
      id: 107,
      orderNumber: "ORD-107",
      status: "COMPLETED",
      sellerOrders: [
        {
          ...mockOrders[0].sellerOrders[0],
          id: 207,
          salesOrderId: 107,
          status: "COMPLETED",
        },
      ],
    };

    vi.spyOn(orderQueries, "useBuyerOrders").mockReturnValue({
      data: [completedOrder],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useBuyerOrders>);

    renderWithProviders(<OrderHistoryPage />);

    // Open View Details
    await user.click(screen.getByRole("button", { name: /view details/i }));
    expect(screen.getByRole("heading", { name: /order details/i })).toBeInTheDocument();

    // Reorder button should exist inside the details modal (card is inert while modal is open)
    const reorderInModal = screen.getByRole("button", { name: /^reorder$/i });
    expect(reorderInModal).toBeInTheDocument();

    // Click Reorder inside the modal
    await user.click(reorderInModal);

    // ReorderPreviewModal should open
    expect(
      screen.getByRole("heading", { name: /reorder items \(สั่งซื้อสินค้าอีกครั้ง\)/i })
    ).toBeInTheDocument();
  });
});
