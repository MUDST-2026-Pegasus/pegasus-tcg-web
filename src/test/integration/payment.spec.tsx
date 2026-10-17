import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { PaymentPage } from "@/features/payment/pages/PaymentPage";
import { ordersApi } from "@/features/account/orders.api";
import { financeApi } from "@/features/finance/finance.api";
import type { OrderDetails } from "@/features/account/orders.types";
import type { Payment } from "@/features/finance/finance.types";
import { renderWithProviders } from "../utils";

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

vi.mock("@/features/account/orders.api");
vi.mock("@/features/finance/finance.api");

const mockOrder: OrderDetails = {
  id: 101,
  orderNumber: "ORD-101",
  buyerId: 1,
  status: "PENDING_PAYMENT",
  currency: "THB",
  itemsSubtotal: 1000,
  shippingTotal: 50,
  discountTotal: 0,
  grandTotal: 1050,
  shippingAddressId: 1,
  shippingAddressSnapshot: "Bangkok",
  buyerNote: null,
  placedAt: "2026-10-01T00:00:00Z",
  paidAt: null,
  completedAt: null,
  cancelledAt: null,
  sellerOrders: [
    {
      id: 501,
      salesOrderId: 101,
      sellerProfileId: 1,
      sellerName: "Kaiba Store",
      sellerOrderNumber: "SO-501",
      status: "PENDING_PAYMENT",
      itemsSubtotal: 1000,
      shippingFee: 50,
      discountAmount: 0,
      grandTotal: 1050,
      commissionAmount: 50,
      sellerNetAmount: 1000,
      acceptedAt: null,
      shippedAt: null,
      deliveredAt: null,
      autoCompleteAt: null,
      completedAt: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: "2026-10-01T00:00:00Z",
      items: [
        {
          id: 1,
          listingId: 1,
          catalogVariantId: 1,
          quantity: 1,
          unitPrice: 1000,
          lineTotal: 1000,
          productName: "Blue-Eyes White Dragon",
          variantLabel: "Ultra Rare",
          condition: "Near Mint",
          gameName: "Yu-Gi-Oh!",
          imageKey: null,
          imageUrl: "https://example.com/blue-eyes.jpg",
          unitIds: [1],
        },
      ],
      shipments: [],
      statusHistory: [],
    },
  ],
};

const mockPayment: Payment = {
  id: 201,
  salesOrderId: 101,
  method: "BANK_TRANSFER",
  status: "PENDING",
  amount: 1050,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  transferAccountJson: JSON.stringify({
    accountName: "Pegasus TCG Co., Ltd.",
    promptPayId: "081-999-8888",
  }),
  referenceCode: null,
  failureReason: null,
};

describe("PaymentPage Integration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it("renders missing order message when orderId is absent", () => {
    renderWithProviders(<PaymentPage />, { route: "/payment" });

    expect(screen.getByText("ไม่พบหมายเลขคำสั่งซื้อ")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "กลับไปประวัติคำสั่งซื้อ" }),
    ).toBeInTheDocument();
  });

  it("renders error state when payment creation fails", async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue(mockOrder);
    vi.mocked(financeApi.createPayment).mockRejectedValue(
      new Error("Gateway connection timeout"),
    );

    renderWithProviders(<PaymentPage />, { route: "/payment?orderId=101" });

    expect(
      await screen.findByText("Gateway connection timeout"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "กลับไปประวัติคำสั่งซื้อ" }),
    ).toBeInTheDocument();
  });

  it("renders payment details, QR code, account info, and order items", async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue(mockOrder);
    vi.mocked(financeApi.createPayment).mockResolvedValue(mockPayment);
    vi.mocked(financeApi.getPayment).mockResolvedValue(mockPayment);

    renderWithProviders(<PaymentPage />, { route: "/payment?orderId=101" });

    // Header & QR details
    expect(await screen.findByText("Secure Checkout")).toBeInTheDocument();
    expect(screen.getByText("PromptPay ID 081-999-8888")).toBeInTheDocument();
    expect(screen.getByText("Pegasus TCG Co., Ltd.")).toBeInTheDocument();

    expect(screen.getByText("Scan to Pay | ฿1,050.00")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "PromptPay QR Code" }).querySelector("image")).toHaveAttribute("href", "/site-icon.jpg");

    // Order items
    expect(screen.getByText("Blue-Eyes White Dragon")).toBeInTheDocument();
    expect(screen.getByText(/Ultra Rare · Near Mint/)).toBeInTheDocument();
  });

  it("redirects to success page when payment status is SUCCEEDED", async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue(mockOrder);
    vi.mocked(financeApi.createPayment).mockResolvedValue({
      ...mockPayment,
      status: "SUCCEEDED",
    });
    vi.mocked(financeApi.getPayment).mockResolvedValue({
      ...mockPayment,
      status: "SUCCEEDED",
    });

    renderWithProviders(
      <Routes>
        <Route path="/payment" element={<PaymentPage />} />
        <Route
          path="/payment/success"
          element={<div>Payment Succeeded Destination</div>}
        />
      </Routes>,
      { route: "/payment?orderId=101" },
    );

    expect(
      await screen.findByText("Payment Succeeded Destination"),
    ).toBeInTheDocument();
  });
});
