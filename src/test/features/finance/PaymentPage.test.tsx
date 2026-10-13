import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

describe("PaymentPage", () => {
  it("shows real bank transfer details and starts TCG-394 payment instead of mock pay", async () => {
    vi.mocked(financeApi.createPayment).mockResolvedValue(payment);
    vi.mocked(financeApi.getPayment).mockResolvedValue(payment);
    vi.mocked(ordersApi.getOrder).mockResolvedValue({ orderNumber: "ORD-42" } as never);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/payment?orderId=42"]}>
          <Routes><Route path="/payment" element={<PaymentPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText(/Test Bank/)).toBeInTheDocument();
    expect(screen.getByText(/12345/)).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
    await waitFor(() => expect(financeApi.createPayment).toHaveBeenCalledWith(42, expect.any(String)));
    expect(ordersApi.payOrder).not.toHaveBeenCalled();
  });
});
