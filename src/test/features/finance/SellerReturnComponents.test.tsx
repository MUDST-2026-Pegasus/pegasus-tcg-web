import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmReceiptModal } from "@/features/finance/seller-returns/modals/ConfirmReceiptModal";
import { RejectReturnModal } from "@/features/finance/seller-returns/modals/RejectReturnModal";
import { ReturnInTransitBox } from "@/features/finance/seller-returns/components/ReturnInTransitBox";
import { ReturnStatusCallout } from "@/features/finance/seller-returns/components/ReturnStatusCallout";
import { formatBaht, sellerReturnStatusConfig } from "@/features/finance/after-sales.format";
import type { SellerReturnRequest } from "@/features/finance/after-sales.types";

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
  it.each(["AWAITING_RETURN_SHIPMENT", "APPROVED", "RECEIVED", "REFUNDED", "REJECTED", "CLOSED"])("shows API status %s as a readable callout", (status) => {
    const { container } = render(<ReturnStatusCallout item={{ ...item, status }} />);
    expect(container).toHaveTextContent(`สถานะคำขอ: ${sellerReturnStatusConfig(status).label}`);
    expect(container.querySelector("p")?.textContent).not.toBe("");
    expect(container).toHaveTextContent("TH123456");
  });

  it("toggles restock choice, confirms receipt, and blocks confirmation while a request is busy", async () => {
    const onRestockChange = vi.fn();
    const onReceive = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<ReturnInTransitBox item={item} restock={false} isBusy={false} onRestockChange={onRestockChange} onReceive={onReceive} />);

    await user.click(screen.getByRole("switch"));
    expect(onRestockChange.mock.calls[0]?.[0]).toBe(true);
    await user.click(screen.getByRole("button", { name: "ยืนยันได้รับสินค้าคืน" }));
    expect(onReceive).toHaveBeenCalledTimes(1);

    rerender(<ReturnInTransitBox item={item} restock onRestockChange={onRestockChange} onReceive={onReceive} isBusy />);
    expect(screen.getByRole("button", { name: "ยืนยันได้รับสินค้าคืน" })).toBeDisabled();
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
