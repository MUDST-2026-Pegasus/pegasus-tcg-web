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

      expect(screen.getByText("สแกนด้วยแอปธนาคารใดก็ได้")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "QR Code พร้อมเพย์" })).toBeInTheDocument();
      expect(screen.getByText("สแกนเพื่อชำระ | THB 1,450.00")).toBeInTheDocument();
      expect(screen.getByText("Pegasus Store Co.")).toBeInTheDocument();
      expect(screen.getByText("พร้อมเพย์ 081-234-5678")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "บันทึก QR" })).toBeInTheDocument();
    });

    it("renders raw qrPayload directly without demo watermark or warning", () => {
      const mockPayload = "00020101021229370016A00000067701011101130066812345678530376454071450.005802TH630465F1";
      renderWithProviders(
        <PaymentQrCard
          amount={1450}
          orderNumber="ORD-DEMO"
          qrPayload={mockPayload}
          account={{
            accountName: "Pegasus Store Co.",
            promptPayId: "081-234-5678",
          }}
        />,
      );
      const qr = screen.getByRole("img", { name: "QR Code พร้อมเพย์" });
      expect(qr.querySelector("image")).toHaveAttribute("href", "/site-icon.jpg");
      expect(screen.getByText("สแกนด้วยแอปธนาคารใดก็ได้")).toBeInTheDocument();
      expect(screen.getByText("ชำระผ่านการสแกน QR")).toBeInTheDocument();
      expect(screen.queryByText(/DEMO QR/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/QR ตัวอย่าง/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ยอดตัวอย่าง/i)).not.toBeInTheDocument();
    });

    it("displays promptpayId and accountName under QR code, and omits bankName entirely", () => {
      renderWithProviders(
        <PaymentQrCard
          amount={2500}
          orderNumber="PGS-888"
          qrPayload="DUMMY_PAYLOAD"
          account={{
            accountName: "PEGASUS TCG CO., LTD.",
            bankName: "Kasikornbank",
            accountNumber: "012-3-45678-9",
            promptpayId: "081-999-8888",
          }}
        />,
      );

      expect(screen.getByText("PEGASUS TCG CO., LTD.")).toBeInTheDocument();
      expect(screen.queryByText(/Kasikornbank/)).not.toBeInTheDocument();
      expect(screen.queryByText(/012-3-45678-9/)).not.toBeInTheDocument();
      expect(screen.getByText("พร้อมเพย์ 081-999-8888")).toBeInTheDocument();
    });

    it("omits bank name line and dummy account number entirely under QR code", () => {
      renderWithProviders(
        <PaymentQrCard
          amount={673}
          orderNumber="PGS-100"
          qrPayload="DUMMY_PAYLOAD"
          account={{
            accountName: "PEGASUS TCG",
            bankName: "SCB",
            accountNumber: "000-0-00000-0",
            promptpayId: "094-xxx-1119",
          }}
        />,
      );

      expect(screen.getByText("PEGASUS TCG")).toBeInTheDocument();
      expect(screen.queryByText(/SCB/)).not.toBeInTheDocument();
      expect(screen.queryByText(/000-0-00000-0/)).not.toBeInTheDocument();
      expect(screen.getByText("พร้อมเพย์ 094-xxx-1119")).toBeInTheDocument();
    });

    it("shows expired overlay and disables Save QR button when expired", () => {
      renderWithProviders(
        <PaymentQrCard
          amount={1450}
          orderNumber="ORD-999"
          account={{
            accountName: "Pegasus Store Co.",
            promptPayId: "081-234-5678",
          }}
          isExpired={true}
        />,
      );

      expect(screen.getByText("QR หมดอายุแล้ว")).toBeInTheDocument();
      expect(screen.getByText("กรุณาเริ่มการชำระเงินใหม่")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "บันทึก QR" })).toBeDisabled();
    });

    it("changes QR modules when the amount changes", () => {
      const { rerender } = renderWithProviders(<PaymentQrCard amount={150} account={{ promptPayId: "0812345678" }} />);
      const before = screen.getByRole("img", { name: "QR Code พร้อมเพย์" }).innerHTML;
      rerender(<PaymentQrCard amount={151} account={{ promptPayId: "0812345678" }} />);
      expect(screen.getByRole("img", { name: "QR Code พร้อมเพย์" }).innerHTML).not.toBe(before);
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
        fireEvent.click(screen.getByRole("button", { name: "บันทึก QR" }));
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

    it("draws PromptPay header, order ref, amount, and QR onto canvas when saving", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["logo"], { type: "image/jpeg" }) }));
      vi.stubGlobal("Image", class {
        onload?: () => void;
        set src(_: string) { queueMicrotask(() => this.onload?.()); }
      });
      const drawImage = vi.fn();
      const fillRect = vi.fn();
      const fillText = vi.fn();
      const strokeRect = vi.fn();
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
        drawImage,
        fillRect,
        fillText,
        strokeRect,
      } as unknown as CanvasRenderingContext2D);
      const png = new Blob(["png"], { type: "image/png" });
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(png));
      const originalCreate = URL.createObjectURL;
      URL.createObjectURL = vi.fn().mockReturnValue("blob:qr");
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe("pegasus-qr-PGS-10241.png");
      });
      try {
        renderWithProviders(
          <PaymentQrCard
            amount={2500}
            orderNumber="PGS-10241"
            account={{ promptPayId: "0812345678", accountName: "Pegasus Store Co." }}
          />,
        );
        fireEvent.click(screen.getByRole("button", { name: "บันทึก QR" }));
        await waitFor(() => expect(click).toHaveBeenCalledOnce());
        expect(drawImage).toHaveBeenCalledOnce();
        expect(fillText).toHaveBeenCalledWith("Thai QR Payment", expect.any(Number), expect.any(Number));
        expect(fillText).toHaveBeenCalledWith("PromptPay", expect.any(Number), expect.any(Number));
        expect(fillText).toHaveBeenCalledWith("Order Ref: #PGS-10241", expect.any(Number), expect.any(Number));
        expect(fillText).toHaveBeenCalledWith("THB 2,500.00", expect.any(Number), expect.any(Number));
      } finally {
        URL.createObjectURL = originalCreate;
      }
    });

    it("reports logo loading failure without downloading an incomplete QR", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
      renderWithProviders(<PaymentQrCard amount={1450} account={{ promptPayId: "0812345678" }} />);
      fireEvent.click(screen.getByRole("button", { name: "บันทึก QR" }));
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
      expect(screen.queryByRole("img", { name: "QR Code พร้อมเพย์" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "บันทึก QR" })).not.toBeInTheDocument();
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

      expect(await screen.findByRole("heading", { name: "ชำระเงินสำเร็จ" })).toBeInTheDocument();
      expect(screen.getByText("เลขคำสั่งซื้อ: #ORD-101")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "ดูรายละเอียดคำสั่งซื้อ" })).toHaveAttribute(
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

      expect(await screen.findByRole("heading", { name: "กำลังตรวจสอบการชำระเงิน" })).toBeInTheDocument();
      expect(await screen.findByText("เลขคำสั่งซื้อ: #ORD-102")).toBeInTheDocument();
      expect(screen.getByText("ได้รับข้อมูลแล้ว กำลังรอการยืนยันการชำระเงิน")).toBeInTheDocument();
    });
  });
});
