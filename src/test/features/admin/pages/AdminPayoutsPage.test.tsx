import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { AdminPayoutsPage } from "@/features/admin/pages/AdminPayoutsPage";
import * as financeApi from "@/features/admin/finance.api";
import type { AdminPayout, PayoutSummary } from "@/features/admin/finance.types";

vi.mock("@/features/admin/finance.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/admin/finance.api")>();
  return {
    ...actual,
    getPayoutQueue: vi.fn(),
    getPayoutSummary: vi.fn(),
    approvePayout: vi.fn(),
    rejectPayout: vi.fn(),
    startPayoutTransfer: vi.fn(),
    completePayoutTransfer: vi.fn(),
    failPayoutTransfer: vi.fn(),
  };
});

vi.mock("@/features/auth/auth.queries", () => ({
  useAuth: () => ({
    user: { id: 1, role: "ADMIN", username: "admin" },
    isAuthenticated: true,
  }),
}));

const mockSummary: PayoutSummary = {
  requested: 1,
  inProgress: 1,
  paidAmountThisMonth: 50000,
  closedThisMonth: 0,
};

const mockPayouts: AdminPayout[] = [
  {
    id: 201,
    sellerProfileId: 10,
    seller: { id: 10, username: "cardseller", displayName: "Card Kingdom" },
    amount: 3500,
    currency: "THB",
    status: "REQUESTED",
    account: {
      bankName: "กสิกรไทย",
      accountName: "Card Kingdom Co.",
      accountNumber: "9876543210",
      verifiedAt: "2026-01-01T00:00:00Z",
    },
    wallet: {
      available: 10000,
      pending: 2000,
      reserved: 3500,
    },
    requestedAt: "2026-10-15T09:00:00Z",
    approvedAt: null,
    approvedBy: null,
    paidAt: null,
    transferReference: null,
    rejectionReason: null,
    orders: [
      {
        sellerOrderId: 801,
        sellerOrderNumber: "ORD-801",
        sellerNetAmount: 3500,
        completedAt: "2026-10-14T10:00:00Z",
      },
    ],
    ordersLinked: false,
  },
];

describe("AdminPayoutsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financeApi.getPayoutSummary).mockResolvedValue(mockSummary);
    vi.mocked(financeApi.getPayoutQueue).mockResolvedValue(mockPayouts);
  });

  it("renders page header, tabs, payout list, and detail panel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPayoutsPage />, { route: "/admin/payouts" });

    // Header & Queue
    expect(screen.getByText("ถอนเงินผู้ขาย")).toBeInTheDocument();
    expect(await screen.findByText("cardseller")).toBeInTheDocument();

    // Select payout
    await user.click(screen.getByText("cardseller"));

    // Detail Panel assertions
    expect(await screen.findByText("ตรวจคำขอถอน")).toBeInTheDocument();
    expect(screen.getByText(/ร้าน Card Kingdom/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "อนุมัติ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ปฏิเสธ" })).toBeInTheDocument();

    // Approve action
    vi.mocked(financeApi.approvePayout).mockResolvedValue({});
    await user.click(screen.getByRole("button", { name: "อนุมัติ" }));

    expect(financeApi.approvePayout).toHaveBeenCalledWith(201);
  });

  it("opens rejection modal and submits rejection reason", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPayoutsPage />, { route: "/admin/payouts" });

    expect(await screen.findByText("cardseller")).toBeInTheDocument();
    await user.click(screen.getByText("cardseller"));

    expect(await screen.findByRole("button", { name: "ปฏิเสธ" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ปฏิเสธ" }));

    // Modal dialog opens
    expect(await screen.findByText("ปฏิเสธคำขอถอนเงิน")).toBeInTheDocument();

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "ข้อมูลบัญชีไม่ตรงกับร้านค้า");

    vi.mocked(financeApi.rejectPayout).mockResolvedValue({});
    // Click confirm in modal
    await user.click(screen.getByRole("button", { name: "ยืนยันการปฏิเสธ" }));

    expect(financeApi.rejectPayout).toHaveBeenCalledWith(201, "ข้อมูลบัญชีไม่ตรงกับร้านค้า");
  });

  it("renders error state when queue fetch fails", async () => {
    vi.mocked(financeApi.getPayoutQueue).mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<AdminPayoutsPage />, { route: "/admin/payouts" });

    expect(await screen.findByText("โหลดคำขอถอนเงินไม่สำเร็จ")).toBeInTheDocument();
  });
});
