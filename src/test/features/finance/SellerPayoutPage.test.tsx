import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("filters the payout history by the year picked from the dropdown", async () => {
    vi.mocked(financeApi.wallet).mockResolvedValue({ withdrawable: 0, balancePending: 0,
      balanceAvailable: 0, reservedForPayout: 0, entries: { items: [], totalItems: 0 } });
    vi.mocked(financeApi.myPayouts).mockResolvedValue([
      { id: 12, amount: 500, requestedAt: "2026-06-15T10:00:00Z", status: "PAID", transferReference: "REF-12" },
      { id: 7, amount: 300, requestedAt: "2025-06-15T10:00:00Z", status: "PAID", transferReference: "REF-7" },
    ] as never);
    vi.mocked(financeApi.payoutAccount).mockResolvedValue({ bankName: "Test Bank",
      accountName: "Test Seller", accountNumber: "1234567890" });
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><SellerPayoutPage /></QueryClientProvider>);

    expect(await screen.findByText("2 รายการ · ยอดรวม ฿800.00")).toBeTruthy();
    await user.click(screen.getByRole("combobox", { name: "เลือกปี" }));
    await user.click(await screen.findByRole("option", { name: "ปี 2568" }));

    expect(screen.getByText("1 รายการ · ยอดรวม ฿300.00")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "เลือกปี" })).toHaveTextContent("ปี 2568");
  });
});
