import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SellerPayoutPage } from "@/features/seller/payout/SellerPayoutPage";
import { financeApi } from "@/features/finance/finance.api";

vi.mock("@/features/finance/finance.api", () => ({ financeApi: {
  wallet: vi.fn(), myPayouts: vi.fn(), payoutAccount: vi.fn(), requestPayout: vi.fn(),
} }));

describe("seller payout page", () => {
  it("shows wallet and payout data, then submits a valid amount", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(financeApi.wallet).mockResolvedValue({ withdrawable: 3420, balancePending: 1850,
      balanceAvailable: 3420, reservedForPayout: 0, entries: { items: [{ id: 1, type: "SELLER_EARNING",
        direction: "CREDIT", amount: 500, createdAt: "2026-10-13T10:00:00Z" }], totalItems: 1 } });
    vi.mocked(financeApi.myPayouts).mockResolvedValue([{ id: 12, amount: 500,
      requestedAt: "2026-10-13T10:00:00Z", status: "PAID", transferReference: "REF-12" }] as never);
    vi.mocked(financeApi.payoutAccount).mockResolvedValue({ bankName: "Test Bank",
      accountName: "Test Seller", accountNumber: "1234567890" });
    vi.mocked(financeApi.requestPayout).mockResolvedValue({} as never);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><SellerPayoutPage /></QueryClientProvider>);

    expect(await screen.findByText("฿3,420.00")).toBeTruthy();
    expect(screen.getByText("••••7890")).toBeTruthy();
    fireEvent.click(screen.getByText("รายการเคลื่อนไหว Wallet"));
    expect(screen.getByText(/รายได้จากการขาย/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "ถอนเงินตอนนี้" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "จำนวนเงินที่ต้องการถอน" }),
      { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "ยืนยันคำขอถอนเงิน" }));
    await waitFor(() => expect(financeApi.requestPayout).toHaveBeenCalledWith(100));
  });
});
