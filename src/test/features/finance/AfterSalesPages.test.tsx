import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BuyerAfterSales } from "@/features/finance/BuyerAfterSales";
import { SellerReturnsPage } from "@/features/finance/SellerReturnsPage";
import { afterSalesApi } from "@/features/finance/after-sales.api";

vi.mock("@/features/finance/after-sales.api", () => ({ afterSalesApi: {
  buyerReturns: vi.fn(), requestReturn: vi.fn(), shipReturn: vi.fn(), createReview: vi.fn(), myReview: vi.fn(),
  sellerReturns: vi.fn(), approveReturn: vi.fn(), rejectReturn: vi.fn(), receiveReturn: vi.fn(),
  sellerReturnEvidence: vi.fn(),
} }));
afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;

describe("after sales screens", () => {
  it("shows a saved review instead of the submit form after loading the order", async () => {
    vi.mocked(afterSalesApi.buyerReturns).mockResolvedValue([]);
    vi.mocked(afterSalesApi.myReview).mockResolvedValue({ id: 8, sellerOrderId: 41, rating: 5,
      title: "Great", comment: "Fast shipping" } as never);
    render(<BuyerAfterSales order={{ id: 41, status: "COMPLETED", items: [] } as never} />, { wrapper });
    expect(await screen.findByText("Fast shipping")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ส่งรีวิว" })).not.toBeInTheDocument();
    expect(afterSalesApi.myReview).toHaveBeenCalledWith(41);
  });

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

  it("shows buyer return statuses and reasons as readable labels", async () => {
    vi.mocked(afterSalesApi.buyerReturns).mockResolvedValue([{ id: 7, sellerOrderId: 41,
      status: "AWAITING_RETURN_SHIPMENT", reasonCode: "DAMAGED", evidenceKeys: [] }] as never);
    render(<BuyerAfterSales order={{ id: 41, status: "SHIPPED", items: [] } as never} />, { wrapper });
    expect(await screen.findByText("คำขอคืน #7 · รอผู้ซื้อส่งสินค้าคืน · สินค้าเสียหาย")).toBeTruthy();
  });

  it("approves a return from the seller queue with the custom modal", async () => {
    vi.mocked(afterSalesApi.sellerReturns).mockResolvedValue([{
      id: 9,
      sellerOrderId: 41,
      sellerOrderNumber: "ORD-100",
      buyer: { username: "kandypop", displayName: "Kandy" },
      sellerOrderGrandTotal: 100,
      status: "REQUESTED",
      reasonCode: "DAMAGED",
      description: "Bent card",
      evidenceKeys: [],
      items: [],
      requestedAt: "2026-10-10T10:00:00Z",
    }] as never);
    vi.mocked(afterSalesApi.approveReturn).mockResolvedValue({} as never);
    render(<SellerReturnsPage />, { wrapper });
    await screen.findByText(/Bent card/);
    expect(screen.getByText("รอคุณตัดสิน")).toBeTruthy();
    expect(screen.getByText("สินค้าเสียหาย")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /อนุมัติคืนเงิน ฿100/ }));
    fireEvent.click(await screen.findByRole("button", { name: /ยืนยันอนุมัติคืนเงิน ฿100/ }));
    await waitFor(() => expect(afterSalesApi.approveReturn).toHaveBeenCalledWith(9, "FULL_REFUND", 100, true));
  });

  it("shows readable return statuses and switches tabs client-side", async () => {
    vi.mocked(afterSalesApi.sellerReturns).mockResolvedValue([{
      id: 13,
      sellerOrderId: 41,
      sellerOrderNumber: "ORD-101",
      buyer: { username: "rare.gems", displayName: "Rare Gems" },
      sellerOrderGrandTotal: 500,
      status: "AWAITING_RETURN_SHIPMENT",
      reasonCode: "WRONG_ITEM",
      description: "Wrong card",
      evidenceKeys: [],
      items: [],
      requestedAt: "2026-10-10T10:00:00Z",
    }] as never);
    render(<SellerReturnsPage />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: /รอผู้ซื้อส่งคืน \(1\)/ }));
    expect(await screen.findByText("RT-13")).toBeTruthy();
    expect(screen.getByText("รอผู้ซื้อส่งคืน")).toBeTruthy();
  });

  it("opens a seller return's evidence preview modal without exposing object keys", async () => {
    vi.mocked(afterSalesApi.sellerReturns).mockResolvedValue([{
      id: 12,
      sellerOrderId: 41,
      sellerOrderNumber: "ORD-102",
      buyer: { username: "sora.trades", displayName: "Sora" },
      sellerOrderGrandTotal: 640,
      status: "REQUESTED",
      reasonCode: "DAMAGED",
      description: "Bent card",
      evidenceKeys: ["returns/private-photo.png"],
      items: [],
      requestedAt: "2026-10-10T10:00:00Z",
    }] as never);
    vi.mocked(afterSalesApi.sellerReturnEvidence).mockResolvedValue([{
      number: 1,
      url: "https://example.test/presigned",
    }]);
    render(<SellerReturnsPage />, { wrapper });
    const thumbBtn = await screen.findByRole("button", { name: "เปิดดูหลักฐาน 1" });
    fireEvent.click(thumbBtn);
    const modalImg = await screen.findByAltText("หลักฐานขนาดเต็ม 1");
    expect(modalImg.getAttribute("src")).toBe("https://example.test/presigned");
    expect(screen.queryByText(/returns\/private-photo/)).toBeNull();
  });
});
