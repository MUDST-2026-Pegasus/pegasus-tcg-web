import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmReceiptModal } from "@/features/finance/seller-returns/modals/ConfirmReceiptModal";
import { RejectReturnModal } from "@/features/finance/seller-returns/modals/RejectReturnModal";
import { ReturnInTransitBox } from "@/features/finance/seller-returns/components/ReturnInTransitBox";
import { ReturnStatusCallout } from "@/features/finance/seller-returns/components/ReturnStatusCallout";
import { formatBaht } from "@/features/finance/after-sales.format";
import type { SellerReturnRequest } from "@/features/finance/after-sales.types";
import { renderWithProviders } from "@/test/utils";

const item = {
  id: 73,
  sellerOrderId: 44,
  sellerOrderNumber: "SO-44",
  buyer: { username: "buyer-one", displayName: "Buyer One" },
  sellerOrderGrandTotal: 1200,
  refundAmount: 900,
  status: "IN_TRANSIT",
  reasonCode: "DAMAGED",
  description: "Damaged card",
  evidenceKeys: [],
  returnTrackingNumber: "TH123456",
  items: [{ returnItemId: 1, orderItemId: 2, cardName: "Pikachu", variantLabel: "Holo", conditionCode: "NM", imageUrl: null, unitPrice: 900, quantityReturned: 1, quantityOrdered: 1, restock: true }],
  requestedAt: "2026-11-01T00:00:00Z",
  deliveredAt: null,
  autoCompleteAt: null,
  reviewedAt: null,
  receivedAt: null,
  closedAt: null,
  resolution: "RETURN_AND_REFUND",
} as SellerReturnRequest;

describe("seller return status and receipt components", () => {
  it.each([
    ["AWAITING_RETURN_SHIPMENT", "รอผู้ซื้อจัดส่งสินค้าคืนภายใน 3 วันทำการ"],
    ["APPROVED", "คุณอนุมัติคำขอแล้ว ระบบกำลังดำเนินการคืนเงินให้ผู้ซื้อ"],
    ["RECEIVED", "คุณยืนยันรับสินค้าคืนแล้ว ระบบกำลังดำเนินการคืนเงินให้ผู้ซื้อ"],
    ["REFUNDED", "ระบบดำเนินการคืนเงินให้ผู้ซื้อเรียบร้อยแล้ว"],
    ["REJECTED", "คุณปฏิเสธคำขอนี้แล้ว คำสั่งซื้อจะดำเนินต่อไปตามปกติ"],
    ["CLOSED", "คำขอคืนสินค้านี้ถูกปิดเรียบร้อยแล้ว"],
  ])("shows API status %s as a readable callout", (status, message) => {
    renderWithProviders(<ReturnStatusCallout item={{ ...item, status }} />, { language: "th" });
    expect(screen.getByText("สถานะปัจจุบัน")).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByText("TH123456")).toBeInTheDocument();
  });

  it("toggles restock choice, confirms receipt, and blocks confirmation while a request is busy", async () => {
    const onRestockChange = vi.fn();
    const onReceive = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<ReturnInTransitBox item={item} restock={false} isBusy={false} onRestockChange={onRestockChange} onReceive={onReceive} />, { language: "th" });

    await user.click(screen.getByRole("switch"));
    expect(onRestockChange.mock.calls[0]?.[0]).toBe(true);
    await user.click(screen.getByRole("button", { name: "ยืนยันได้รับสินค้าแล้ว" }));
    expect(onReceive).toHaveBeenCalledTimes(1);

    rerender(<ReturnInTransitBox item={item} restock onRestockChange={onRestockChange} onReceive={onReceive} isBusy />);
    expect(screen.getByRole("button", { name: "ยืนยันได้รับสินค้าแล้ว" })).toBeDisabled();
  });

  it("confirms returned stock using the selected restock choice and prevents duplicate confirmation while pending", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    const initialView = render(<ConfirmReceiptModal open item={item} restock onOpenChange={vi.fn()} onConfirm={onConfirm} loading={false} />);
    expect(screen.getByText("นำการ์ดกลับเข้าสต็อกเพื่อขายต่อ")).toBeInTheDocument();
    expect(screen.getByText(formatBaht(900))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ยืนยันรับสินค้าและปล่อยเงินคืน/ }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    initialView.unmount();
    const pendingView = render(<ConfirmReceiptModal open item={item} restock={false} onOpenChange={vi.fn()} onConfirm={onConfirm} loading />);
    expect(screen.getByRole("button", { name: /ยืนยันรับสินค้าและปล่อยเงินคืน/ })).toBeDisabled();
    expect(screen.getByText("ไม่นำกลับเข้าสต็อก")).toBeInTheDocument();
    pendingView.unmount();
  });

  it("shows the destructive reject confirmation and does not render without a request", () => {
    const onConfirm = vi.fn();
    const { rerender } = render(<RejectReturnModal open item={item} onOpenChange={vi.fn()} onConfirm={onConfirm} loading />);
    expect(screen.getByText(/ผู้ซื้อจะไม่สามารถเปิดคำขอคืนสินค้า/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ยืนยันปฏิเสธคำขอ/ })).toBeDisabled();
    rerender(<RejectReturnModal open item={null} onOpenChange={vi.fn()} onConfirm={onConfirm} loading={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(document.body);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
