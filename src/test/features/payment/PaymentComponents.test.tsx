import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaymentQrCard } from "@/features/payment/components/PaymentQrCard";
import { PaymentOrderSummary } from "@/features/payment/components/PaymentOrderSummary";
import { PaymentSuccessPage } from "@/features/payment/pages/PaymentSuccessPage";
import { ordersApi } from "@/features/account/orders.api";
import { financeApi } from "@/features/finance/finance.api";
import { renderWithProviders } from "../../utils";

vi.mock("@/features/account/orders.api", () => ({
  ordersApi: {
    getOrder: vi.fn(),
  },
}));

vi.mock("@/features/finance/finance.api", () => ({
  financeApi: {
    getPayment: vi.fn(),
  },
}));

describe("Payment Components", () => {
  describe("PaymentQrCard", () => {
    it("renders QR code SVG, amount text, and PromptPay ID", () => {
      renderWithProviders(
        <PaymentQrCard
          amountText="฿1,450.00"
          orderNumber="ORD-999"
          account={{
            accountName: "Pegasus Store Co.",
            promptPayId: "081-234-5678",
          }}
        />,
      );

      expect(screen.getByText("Scan with any banking app")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "PromptPay QR Code" })).toBeInTheDocument();
      expect(screen.getByText("Scan to Pay | ฿1,450.00")).toBeInTheDocument();
      expect(screen.getByText("Pegasus Store Co.")).toBeInTheDocument();
      expect(screen.getByText("PromptPay ID 081-234-5678")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save QR/i })).toBeInTheDocument();
    });

    it("renders bank name and account number when bank details are provided", () => {
      renderWithProviders(
        <PaymentQrCard
          amountText="฿500.00"
          account={{
            accountName: "Pegasus Store Co.",
            bankName: "Kasikornbank",
            accountNumber: "123-4-56789-0",
          }}
        />,
      );

      expect(screen.getByText("Kasikornbank · 123-4-56789-0")).toBeInTheDocument();
    });
  });

  describe("PaymentOrderSummary", () => {
    it("renders line items and formatted monetary totals", () => {
      const items = [
        {
          id: 1,
          productName: "Blue-Eyes White Dragon",
          variantLabel: "Ultra Rare",
          condition: "Near Mint",
          unitPrice: 1200,
          quantity: 1,
          lineTotal: 1200,
          imageUrl: "https://example.com/card.jpg",
        },
      ];

      renderWithProviders(
        <PaymentOrderSummary
          items={items}
          subtotal={1200}
          shippingTotal={50}
          grandTotal={1250}
        />,
      );

      expect(screen.getByText("Blue-Eyes White Dragon")).toBeInTheDocument();
      expect(screen.getByText(/Ultra Rare/)).toBeInTheDocument();
      expect(screen.getByText(/Near Mint/)).toBeInTheDocument();
      expect(screen.getAllByText("THB 1,200")).toHaveLength(2);
      expect(screen.getByText("THB 50")).toBeInTheDocument();
      expect(screen.getByText("THB 1,250")).toBeInTheDocument();
    });
  });

  describe("PaymentSuccessPage", () => {
    it("renders success state with paid amount and order number", async () => {
      vi.mocked(ordersApi.getOrder).mockResolvedValue({
        id: 101,
        orderNumber: "ORD-101",
        grandTotal: 1500,
        status: "PAID",
      } as any);

      vi.mocked(financeApi.getPayment).mockResolvedValue({
        id: 201,
        status: "SUCCEEDED",
        amount: 1500,
      } as any);

      renderWithProviders(<PaymentSuccessPage />, {
        route: "/payment/success?orderId=101&paymentId=201",
      });

      expect(await screen.findByText("ชำระเงินสำเร็จ")).toBeInTheDocument();
      expect(screen.getByText("ORD-101")).toBeInTheDocument();
      expect(screen.getByText(/ยอดชำระ ฿1,500.00/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "ดูประวัติคำสั่งซื้อ" })).toHaveAttribute(
        "href",
        "/account/orders",
      );
    });

    it("renders pending verification state when payment is not yet succeeded", async () => {
      vi.mocked(ordersApi.getOrder).mockResolvedValue({
        id: 102,
        orderNumber: "ORD-102",
        grandTotal: 800,
        status: "PENDING_PAYMENT",
      } as any);

      vi.mocked(financeApi.getPayment).mockResolvedValue({
        id: 202,
        status: "AWAITING_VERIFICATION",
        amount: 800,
      } as any);

      renderWithProviders(<PaymentSuccessPage />, {
        route: "/payment/success?orderId=102&paymentId=202",
      });

      expect(await screen.findByText("กำลังตรวจสอบการชำระเงิน")).toBeInTheDocument();
      expect(await screen.findByText("ORD-102")).toBeInTheDocument();
      expect(
        screen.getByText(/ยังไม่มีการยืนยันการชำระเงิน กรุณาตรวจสอบสถานะในประวัติคำสั่งซื้อ/),
      ).toBeInTheDocument();
    });
  });
});
