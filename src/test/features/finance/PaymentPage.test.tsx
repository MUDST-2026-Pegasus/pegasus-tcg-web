import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PaymentPage } from "@/features/payment/pages/PaymentPage";
import { financeApi } from "@/features/finance/finance.api";
import { ordersApi } from "@/features/account/orders.api";

vi.mock("@/features/finance/finance.api", () => ({
  financeApi: { createPayment: vi.fn(), getPayment: vi.fn(), attachPaymentSlip: vi.fn() },
}));
vi.mock("@/features/account/orders.api", () => ({
  ordersApi: { getOrder: vi.fn(), payOrder: vi.fn() },
}));

const payment = {
  id: 11,
  salesOrderId: 42,
  method: "BANK_TRANSFER",
  status: "PENDING",
  amount: 150,
  expiresAt: "2026-10-13T12:00:00+07:00",
  transferAccountJson: '{"bankName":"Test Bank","accountName":"Pegasus","accountNumber":"12345"}',
  referenceCode: null,
  failureReason: null,
};

afterEach(() => vi.clearAllMocks());

function renderPaymentPage(orderId = 42) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/payment?orderId=${orderId}`]}>
        <Routes><Route path="/payment" element={<PaymentPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PaymentPage", () => {
  it("shows real bank transfer details and starts TCG-394 payment instead of mock pay", async () => {
    vi.mocked(financeApi.createPayment).mockResolvedValue(payment);
    vi.mocked(financeApi.getPayment).mockResolvedValue(payment);
    vi.mocked(ordersApi.getOrder).mockResolvedValue({ orderNumber: "ORD-42" } as never);

    renderPaymentPage(42);

    expect(await screen.findByText(/Test Bank/)).toBeInTheDocument();
    expect(screen.getByText(/12345/)).toBeInTheDocument();
    expect(screen.getAllByText(/150/)[0]).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Secure Checkout" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Order Summary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit payment for verification/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save QR/i })).toBeInTheDocument();
    await waitFor(() => expect(financeApi.createPayment).toHaveBeenCalledWith(42, expect.any(String)));
    expect(ordersApi.payOrder).not.toHaveBeenCalled();
  });

  it("renders order items from real order details", async () => {
    vi.mocked(financeApi.createPayment).mockResolvedValue({ ...payment, amount: 13200 });
    vi.mocked(financeApi.getPayment).mockResolvedValue({ ...payment, amount: 13200 });
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      id: 42,
      orderNumber: "ORD-10241",
      itemsSubtotal: 13150,
      shippingTotal: 50,
      grandTotal: 13200,
      sellerOrders: [
        {
          id: 101,
          sellerProfileId: 1,
          sellerOrderNumber: "SO-101",
          status: "PENDING_PAYMENT",
          itemsSubtotal: 13150,
          shippingFee: 50,
          grandTotal: 13200,
          commissionAmount: 0,
          sellerNetAmount: 13150,
          items: [
            {
              id: 1,
              catalogVariantId: 1,
              listingId: 1,
              productName: "Charizard VMAX #020",
              variantLabel: "DARKNESS ABLAZE",
              condition: "NM",
              unitPrice: 12900,
              quantity: 1,
              lineTotal: 12900,
              unitIds: [1],
              imageUrl: null,
            },
          ],
        },
      ],
    } as never);

    renderPaymentPage(42);

    expect(await screen.findByText("Charizard VMAX #020")).toBeInTheDocument();
    expect(screen.getByText(/DARKNESS ABLAZE · NM/)).toBeInTheDocument();
    expect(screen.getByText("Order #ORD-10241 · Pay exactly this amount")).toBeInTheDocument();
  });

  it("shows awaiting verification notice when payment status is AWAITING_VERIFICATION", async () => {
    const awaitingPayment = {
      ...payment,
      status: "AWAITING_VERIFICATION",
    };
    vi.mocked(financeApi.createPayment).mockResolvedValue(awaitingPayment);
    vi.mocked(financeApi.getPayment).mockResolvedValue(awaitingPayment);
    vi.mocked(ordersApi.getOrder).mockResolvedValue({ orderNumber: "ORD-42" } as never);

    renderPaymentPage(42);

    expect(await screen.findByText(/ส่งหลักฐานเรียบร้อยแล้ว · รอผู้ดูแลระบบตรวจสอบ/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ดูประวัติคำสั่งซื้อ/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เลือกซื้อสินค้าต่อ/i })).toBeInTheDocument();
  });

  it("allows entering reference number in step 3", async () => {
    vi.mocked(financeApi.createPayment).mockResolvedValue(payment);
    vi.mocked(financeApi.getPayment).mockResolvedValue(payment);
    vi.mocked(ordersApi.getOrder).mockResolvedValue({ orderNumber: "ORD-42" } as never);

    renderPaymentPage(42);

    const refInput = await screen.findByLabelText("เลขอ้างอิงการโอน");
    await userEvent.type(refInput, "2026101400051234");
    expect(refInput).toHaveValue("2026101400051234");
  });
});
