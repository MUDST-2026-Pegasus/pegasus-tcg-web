import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { PaymentSuccessPage } from "@/features/payment/pages/PaymentSuccessPage";
import { ordersApi } from "@/features/account/orders.api";
import { financeApi } from "@/features/finance/finance.api";
import type { OrderDetails } from "@/features/account/orders.types";
import type { Payment } from "@/features/finance/finance.types";

vi.mock("@/features/account/orders.api", () => ({ ordersApi: { getOrder: vi.fn() } }));
vi.mock("@/features/finance/finance.api", () => ({ financeApi: { getPayment: vi.fn() } }));

const order = {
  id: 42, orderNumber: "ORD-99521", buyerId: 10, status: "PAID", currency: "THB",
  itemsSubtotal: 4200, shippingTotal: 50, discountTotal: 0, grandTotal: 4250,
  placedAt: "2026-10-24T07:00:00Z", paidAt: "2026-10-24T07:32:00Z",
  sellerOrders: [{ id: 1, items: [{ id: 1, productName: "TCG Booster Boxes", quantity: 3 }] }],
} as OrderDetails;
const payment: Payment = {
  id: 11, salesOrderId: 42, method: "QR", status: "SUCCEEDED", amount: 4250,
  expiresAt: "2026-10-24T08:00:00Z", transferAccountJson: "{}", referenceCode: null, failureReason: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(ordersApi.getOrder).mockResolvedValue(order);
  vi.mocked(financeApi.getPayment).mockResolvedValue(payment);
});

const renderSuccess = (route = "/payment/success?orderId=42&paymentId=11") =>
  renderWithProviders(<PaymentSuccessPage />, { route });

describe("PaymentSuccessPage", () => {
  it("shows the Figma summary using verified real order and payment data", async () => {
    renderSuccess();
    expect(await screen.findByRole("heading", { name: "Payment Successful" })).toBeInTheDocument();
    expect(screen.getByText("Order Number: #ORD-99521")).toBeInTheDocument();
    expect(screen.getByText("Oct 24, 2026 14:32")).toBeInTheDocument();
    expect(screen.getByText("QR", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("3 TCG Booster Boxes")).toBeInTheDocument();
    expect(screen.getByText("THB 4,250.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Order Details" })).toHaveAttribute("href", "/account/orders?orderId=42");
    expect(screen.getByRole("button", { name: "Continue Shopping" })).toHaveAttribute("href", "/products");
    const icon = document.querySelector(".payment-success-symbol img");
    expect(icon).toHaveAttribute("src", "/images/payment/success-check.svg");
  });

  it("uses the actual bank transfer method instead of hardcoding QR", async () => {
    vi.mocked(financeApi.getPayment).mockResolvedValue({ ...payment, method: "BANK_TRANSFER" });
    renderSuccess();
    expect(await screen.findByText("Bank Transfer")).toBeInTheDocument();
    expect(screen.queryByText("QR", { exact: true })).not.toBeInTheDocument();
  });

  it("does not claim success during loading", () => {
    vi.mocked(ordersApi.getOrder).mockReturnValue(new Promise(() => {}));
    vi.mocked(financeApi.getPayment).mockReturnValue(new Promise(() => {}));
    renderSuccess();
    expect(screen.getByRole("heading", { name: "Checking Payment" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Payment Successful" })).not.toBeInTheDocument();
    expect(document.querySelector(".payment-success-symbol img")).not.toBeInTheDocument();
  });

  it("shows review status while waiting for verification", async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue({ ...order, status: "PENDING_PAYMENT", paidAt: null });
    vi.mocked(financeApi.getPayment).mockResolvedValue({ ...payment, status: "AWAITING_VERIFICATION" });
    renderSuccess();
    expect(await screen.findByRole("heading", { name: "Payment Under Review" })).toBeInTheDocument();
    expect(screen.queryByText("Transaction Summary")).not.toBeInTheDocument();
    expect(screen.queryByText("Thank you for using Pegasus TCG")).not.toBeInTheDocument();
  });

  it.each(["FAILED", "EXPIRED", "CANCELLED"])("does not show success for %s payment", async (status) => {
    vi.mocked(financeApi.getPayment).mockResolvedValue({ ...payment, status });
    renderSuccess();
    expect(await screen.findByRole("heading", { name: "Payment Not Completed" })).toBeInTheDocument();
    expect(document.querySelector(".payment-success-symbol img")).not.toBeInTheDocument();
  });

  it("rejects a successful payment belonging to another order", async () => {
    vi.mocked(financeApi.getPayment).mockResolvedValue({ ...payment, salesOrderId: 99 });
    renderSuccess();
    expect(await screen.findByRole("heading", { name: "Unable to Verify Payment" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("รายการชำระเงินนี้ไม่ตรงกับคำสั่งซื้อ");
    expect(screen.queryByText("THB 4,250.00")).not.toBeInTheDocument();
  });

  it.each(["/payment/success", "/payment/success?orderId=abc", "/payment/success?orderId=42&paymentId=abc"])("handles invalid identifiers without fetching or pretending to load: %s", (route) => {
    renderSuccess(route);
    expect(screen.getByRole("heading", { name: "Unable to Verify Payment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Orders" })).toHaveAttribute("href", "/account/orders");
    expect(ordersApi.getOrder).not.toHaveBeenCalled();
    expect(financeApi.getPayment).not.toHaveBeenCalled();
  });

  it("supports a paid order without paymentId and leaves unknown payment method empty", async () => {
    renderSuccess("/payment/success?orderId=42");
    expect(await screen.findByRole("heading", { name: "Payment Successful" })).toBeInTheDocument();
    expect(screen.getByText("THB 4,250.00")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(financeApi.getPayment).not.toHaveBeenCalled();
  });

  it("counts quantities across different products and uses paidAt rather than placedAt", async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      ...order, paidAt: null,
      sellerOrders: [{ ...order.sellerOrders[0], items: [
        { ...order.sellerOrders[0].items[0], quantity: 2 },
        { ...order.sellerOrders[0].items[0], id: 2, productName: "Pikachu", quantity: 1 },
      ] }],
    });
    renderSuccess();
    expect(await screen.findByText("3 items")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("Oct 24, 2026 14:00")).not.toBeInTheDocument();
  });

  it("can retry failed status requests without creating a payment", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    vi.mocked(ordersApi.getOrder).mockRejectedValueOnce(new Error("offline")).mockResolvedValue(order);
    renderSuccess();
    expect(await screen.findByRole("heading", { name: "Unable to Verify Payment" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
    expect(await screen.findByRole("heading", { name: "Payment Successful" })).toBeInTheDocument();
    await waitFor(() => expect(ordersApi.getOrder).toHaveBeenCalledTimes(2));
  });
});
