import { afterEach, describe, it, expect, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
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

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Payment Components", () => {
  describe("PaymentQrCard", () => {
    it("renders QR code SVG, amount text, and PromptPay ID", () => {
      renderWithProviders(
        <PaymentQrCard
          amount={1450}
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

    it("shows the seeded demo account with a centered logo and explicit demo label", () => {
      renderWithProviders(<PaymentQrCard amount={1110} orderNumber="ORD-DEMO" account={{ promptPayId: "0000000000" }} />);
      const qr = screen.getByRole("img", { name: "Demo QR Code" });
      expect(qr.querySelector("image")).toHaveAttribute("href", "/site-icon.jpg");
      expect(screen.getByText("QR ตัวอย่าง · ใช้ชำระเงินจริงไม่ได้")).toBeInTheDocument();
      expect(screen.getByText("ยอดตัวอย่าง | ฿1,110.00")).toBeInTheDocument();
      expect(screen.queryByText("Scan with any banking app")).not.toBeInTheDocument();
    });

    it("changes QR modules when the amount changes", () => {
      const { rerender } = renderWithProviders(<PaymentQrCard amount={150} account={{ promptPayId: "0812345678" }} />);
      const before = screen.getByRole("img", { name: "PromptPay QR Code" }).innerHTML;
      rerender(<PaymentQrCard amount={151} account={{ promptPayId: "0812345678" }} />);
      expect(screen.getByRole("img", { name: "PromptPay QR Code" }).innerHTML).not.toBe(before);
    });

    it("exports a PNG after embedding and loading the logo", async () => {
      let imageSource = "";
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["logo"], { type: "image/jpeg" }) }));
      vi.stubGlobal("Image", class {
        onload?: () => void;
        set src(value: string) { imageSource = value; queueMicrotask(() => this.onload?.()); }
      });
      const drawImage = vi.fn();
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
      const png = new Blob(["png"], { type: "image/png" });
      const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(png));
      const createUrl = vi.fn().mockReturnValue("blob:qr");
      const originalCreate = URL.createObjectURL;
      URL.createObjectURL = createUrl;
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe("pegasus-qr-ORD-999.png");
      });
      try {
        renderWithProviders(<PaymentQrCard amount={1450} orderNumber="ORD-999" account={{ promptPayId: "0812345678" }} />);
        fireEvent.click(screen.getByRole("button", { name: "Save QR" }));
        await waitFor(() => expect(click).toHaveBeenCalledOnce());
        expect(decodeURIComponent(imageSource)).toContain("data:image/jpeg;base64,");
        expect(decodeURIComponent(imageSource)).not.toContain('href="/site-icon.jpg"');
        expect(drawImage).toHaveBeenCalledOnce();
        expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
        expect(createUrl).toHaveBeenCalledWith(png);
      } finally {
        URL.createObjectURL = originalCreate;
      }
    });

    it("reports logo loading failure without downloading an incomplete QR", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
      renderWithProviders(<PaymentQrCard amount={1450} account={{ promptPayId: "0812345678" }} />);
      fireEvent.click(screen.getByRole("button", { name: "Save QR" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("บันทึก QR ไม่สำเร็จ");
    });

    it("renders bank name and account number when bank details are provided", () => {
      renderWithProviders(
        <PaymentQrCard
          amount={500}
          account={{
            accountName: "Pegasus Store Co.",
            bankName: "Kasikornbank",
            accountNumber: "123-4-56789-0",
          }}
        />,
      );

      expect(screen.getByText("Kasikornbank · 123-4-56789-0")).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: "PromptPay QR Code" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Save QR/i })).not.toBeInTheDocument();
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
        sellerOrders: [],
      } as unknown as Awaited<ReturnType<typeof ordersApi.getOrder>>);

      vi.mocked(financeApi.getPayment).mockResolvedValue({
        id: 201,
        salesOrderId: 101,
        status: "SUCCEEDED",
        amount: 1500,
      } as unknown as Awaited<ReturnType<typeof financeApi.getPayment>>);

      renderWithProviders(<PaymentSuccessPage />, {
        route: "/payment/success?orderId=101&paymentId=201",
      });

      expect(await screen.findByRole("heading", { name: "Payment Successful" })).toBeInTheDocument();
      expect(screen.getByText("Order Number: #ORD-101")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "View Order Details" })).toHaveAttribute(
        "href",
        "/account/orders?orderId=101",
      );
    });

    it("renders pending verification state when payment is not yet succeeded", async () => {
      vi.mocked(ordersApi.getOrder).mockResolvedValue({
        id: 102,
        orderNumber: "ORD-102",
        grandTotal: 800,
        status: "PENDING_PAYMENT",
        sellerOrders: [],
      } as unknown as Awaited<ReturnType<typeof ordersApi.getOrder>>);

      vi.mocked(financeApi.getPayment).mockResolvedValue({
        id: 202,
        salesOrderId: 102,
        status: "AWAITING_VERIFICATION",
        amount: 800,
      } as unknown as Awaited<ReturnType<typeof financeApi.getPayment>>);

      renderWithProviders(<PaymentSuccessPage />, {
        route: "/payment/success?orderId=102&paymentId=202",
      });

      expect(await screen.findByRole("heading", { name: "Payment Under Review" })).toBeInTheDocument();
      expect(screen.getByText("Order Number: #ORD-102")).toBeInTheDocument();
      expect(screen.getByText("ได้รับข้อมูลแล้ว กำลังรอการยืนยันการชำระเงิน")).toBeInTheDocument();
    });
  });
});
