import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { financeApi } from "@/features/finance/finance.api";
import type { Payout, PayoutAccount, Wallet } from "@/features/finance/finance.types";
import { SellerPayoutPage } from "@/features/seller/payout/SellerPayoutPage";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/finance/finance.api", () => ({
  financeApi: {
    wallet: vi.fn(),
    myPayouts: vi.fn(),
    payoutAccount: vi.fn(),
    requestPayout: vi.fn(),
  },
}));

vi.mock("@/features/auth/auth.queries", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: "seller@pegasus.com",
      displayName: "Seller Somchai",
      role: "SELLER",
    },
    isAuthenticated: true,
  }),
}));

const mockWallet: Wallet = {
  balanceAvailable: 5000,
  balancePending: 1200,
  reservedForPayout: 0,
  withdrawable: 3800,
  entries: {
    items: [
      {
        id: 101,
        type: "SELLER_EARNING",
        direction: "CREDIT",
        amount: 1500,
        createdAt: "2026-10-14T10:00:00Z",
        balanceAfter: 5000,
        referenceType: "ORDER",
        referenceId: 41,
      },
    ],
    totalItems: 1,
  },
};

const mockPayouts: Payout[] = [
  {
    id: 12,
    sellerProfileId: 1,
    amount: 1000,
    currency: "THB",
    status: "REQUESTED",
    requestedAt: "2026-10-14T11:00:00Z",
    approvedAt: null,
    paidAt: null,
    transferReference: null,
    rejectionReason: null,
  },
];

const mockAccount: PayoutAccount = {
  bankName: "KBANK",
  accountName: "สมชาย ใจดี",
  accountNumber: "1234567890",
  verifiedAt: "2026-10-01T00:00:00Z",
};

describe("SellerPayoutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders wallet balance, payout account, and active payout tracker", async () => {
    vi.mocked(financeApi.wallet).mockResolvedValue(mockWallet);
    vi.mocked(financeApi.myPayouts).mockResolvedValue(mockPayouts);
    vi.mocked(financeApi.payoutAccount).mockResolvedValue(mockAccount);

    renderWithProviders(<SellerPayoutPage />, { route: "/seller/payout" });

    // Balance
    expect(await screen.findByText("ยอดถอนได้ตอนนี้")).toBeInTheDocument();
    expect(screen.getByText("฿3,800.00")).toBeInTheDocument();

    // Account info
    expect(screen.getByText("สมชาย ใจดี")).toBeInTheDocument();
    expect(screen.getByText(/KBANK/i)).toBeInTheDocument();

    // Payout tracker for active payout #12
    expect(screen.getByText("คำขอที่ยังไม่โอน")).toBeInTheDocument();
    expect(screen.getAllByText(/#12/i).length).toBeGreaterThan(0);
  });

  it("switches to wallet ledger tab and displays transaction history", async () => {
    vi.mocked(financeApi.wallet).mockResolvedValue(mockWallet);
    vi.mocked(financeApi.myPayouts).mockResolvedValue(mockPayouts);
    vi.mocked(financeApi.payoutAccount).mockResolvedValue(mockAccount);

    const user = userEvent.setup();
    renderWithProviders(<SellerPayoutPage />, { route: "/seller/payout" });

    expect(await screen.findByRole("button", { name: "รายการเคลื่อนไหวกระเป๋า" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "รายการเคลื่อนไหวกระเป๋า" }));

    expect(await screen.findByText("รายได้จากออเดอร์")).toBeInTheDocument();
    expect(screen.getByText("+฿1,500.00")).toBeInTheDocument();
  });

  it("opens request payout dialog and submits a withdrawal request", async () => {
    vi.mocked(financeApi.wallet).mockResolvedValue(mockWallet);
    vi.mocked(financeApi.myPayouts).mockResolvedValue(mockPayouts);
    vi.mocked(financeApi.payoutAccount).mockResolvedValue(mockAccount);
    vi.mocked(financeApi.requestPayout).mockResolvedValue({
      id: 13,
      sellerProfileId: 1,
      amount: 500,
      currency: "THB",
      status: "REQUESTED",
      requestedAt: "2026-10-15T10:00:00Z",
      approvedAt: null,
      paidAt: null,
      transferReference: null,
      rejectionReason: null,
    });

    const user = userEvent.setup();
    renderWithProviders(<SellerPayoutPage />, { route: "/seller/payout" });

    const withdrawBtn = await screen.findByRole("button", { name: /^ขอถอนเงิน$/ });
    await user.click(withdrawBtn);

    // Dialog should open
    const input = await screen.findByPlaceholderText(/0\.00/i);
    await user.type(input, "500");

    const submitBtn = screen.getByRole("button", { name: /ยืนยันขอถอน/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(financeApi.requestPayout).toHaveBeenCalledWith(500);
    });
  });

  it("displays seller not ready card when seller is not found", async () => {
    const notFoundError = new ApiError({
      status: 404,
      code: "SELLER_NOT_FOUND",
      message: "Seller not found",
    });

    vi.mocked(financeApi.wallet).mockRejectedValue(notFoundError);
    vi.mocked(financeApi.myPayouts).mockResolvedValue([]);
    vi.mocked(financeApi.payoutAccount).mockResolvedValue(mockAccount);

    renderWithProviders(<SellerPayoutPage />, { route: "/seller/payout" });

    expect(await screen.findByText("ยังไม่พร้อมถอนเงิน")).toBeInTheDocument();
    expect(screen.getByText("กรุณาสมัครและยืนยันตัวตนผู้ขายก่อน")).toBeInTheDocument();
  });
});
