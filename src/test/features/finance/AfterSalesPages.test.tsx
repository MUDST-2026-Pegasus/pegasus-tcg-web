import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BuyerAfterSales } from "@/features/finance/BuyerAfterSales";
import { SellerReturnsPage } from "@/features/finance/SellerReturnsPage";
import { afterSalesApi } from "@/features/finance/after-sales.api";

vi.mock("@/features/finance/after-sales.api", () => ({ afterSalesApi: {
  buyerReturns: vi.fn(), requestReturn: vi.fn(), shipReturn: vi.fn(), createReview: vi.fn(),
  sellerReturns: vi.fn(), approveReturn: vi.fn(), rejectReturn: vi.fn(), receiveReturn: vi.fn(),
  sellerReturnEvidence: vi.fn(),
} }));
afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;

describe("after sales screens", () => {
  it("submits a buyer return with the seller-order and selected order-item IDs", async () => {
    vi.mocked(afterSalesApi.buyerReturns).mockResolvedValue([]);
    vi.mocked(afterSalesApi.requestReturn).mockResolvedValue({} as never);
    render(<BuyerAfterSales order={{ id: 41, status: "SHIPPED", autoCompleteAt: "2030-01-01T00:00:00Z",
      items: [{ id: 72, productName: "Card", quantity: 2 }] } as never} />, { wrapper });
    fireEvent.change(await screen.findByRole("spinbutton"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "ส่งคำขอคืนสินค้า" }));
    await waitFor(() => expect(afterSalesApi.requestReturn).toHaveBeenCalledWith(41, {
      reasonCode: "NOT_AS_DESCRIBED", description: "", evidenceKeys: [], items: [{ orderItemId: 72, quantity: 1 }],
    }));
  });

  it("approves a return from the seller queue with the entered amount", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    vi.mocked(afterSalesApi.sellerReturns).mockResolvedValue([{ id: 9, sellerOrderId: 41,
      status: "REQUESTED", reasonCode: "DAMAGED", description: "Bent card", evidenceKeys: [] }] as never);
    vi.mocked(afterSalesApi.approveReturn).mockResolvedValue({} as never);
    render(<SellerReturnsPage />, { wrapper });
    await screen.findByText(/Bent card/);
    fireEvent.change(screen.getByLabelText("จำนวนเงินคืน 9"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "อนุมัติ" }));
    await waitFor(() => expect(afterSalesApi.approveReturn).toHaveBeenCalledWith(9, "FULL_REFUND", 100, false));
  });

  it("opens a seller return's evidence without exposing object keys", async () => {
    vi.mocked(afterSalesApi.sellerReturns).mockResolvedValue([{ id: 12, sellerOrderId: 41,
      status: "REQUESTED", reasonCode: "DAMAGED", description: "Bent card",
      evidenceKeys: ["returns/private-photo.png"] }] as never);
    vi.mocked(afterSalesApi.sellerReturnEvidence).mockResolvedValue([{ number: 1,
      url: "https://example.test/presigned" }]);
    render(<SellerReturnsPage />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "ดูหลักฐาน 1 ไฟล์" }));
    const link = await screen.findByRole("link", { name: "เปิดหลักฐาน 1" });
    expect(link.getAttribute("href")).toBe("https://example.test/presigned");
    expect(screen.queryByText(/returns\/private-photo/)).toBeNull();
  });
});
