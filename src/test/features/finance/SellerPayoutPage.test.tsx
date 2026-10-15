import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { SellerPayoutPage } from "@/features/seller/payout/SellerPayoutPage";
import { financeApi } from "@/features/finance/finance.api";
import { ApiError } from "@/lib/api";
import type { Payout, Wallet } from "@/features/finance/finance.types";
import { formatThaiDateTime, payoutDetail, payoutStatus, validatePayoutAmount } from "@/features/seller/payout/payout.format";

vi.mock("@/features/finance/finance.api", () => ({ financeApi: {
  wallet: vi.fn(), myPayouts: vi.fn(), payoutAccount: vi.fn(), requestPayout: vi.fn(),
} }));

const wallet: Wallet = { withdrawable: 3420, balancePending: 1850, balanceAvailable: 5420, reservedForPayout: 2000,
  entries: { items: [{ id: 1, type: "SELLER_EARNING", direction: "CREDIT", amount: 500, balanceAfter: 5420,
    referenceType: "ORDER", referenceId: 8, createdAt: "2026-10-13T10:00:00Z" }], totalItems: 1 } };
const paid: Payout = { id: 12, sellerProfileId: 1, amount: 500, currency: "THB", requestedAt: "2026-10-13T10:00:00Z",
  approvedAt: "2026-10-13T11:00:00Z", paidAt: "2026-10-14T10:00:00Z", status: "PAID", transferReference: "REF-12", rejectionReason: null };
const requested: Payout = { ...paid, id: 13, amount: 2000, status: "REQUESTED", approvedAt: null, paidAt: null, transferReference: null };

function renderPage() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<MemoryRouter><QueryClientProvider client={client}><SellerPayoutPage /></QueryClientProvider></MemoryRouter>); return client; }

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(financeApi.wallet).mockResolvedValue(wallet);
  vi.mocked(financeApi.myPayouts).mockResolvedValue([requested, paid]);
  vi.mocked(financeApi.payoutAccount).mockResolvedValue({ bankName: "Test Bank", accountName: "Test Seller", accountNumber: "1234567890", verifiedAt: "2026-10-01T00:00:00Z" });
  vi.mocked(financeApi.requestPayout).mockResolvedValue({ ...requested, id: 14, amount: 100 });
});

describe("payout helpers", () => {
  it("validates minimum, balance, and precision", () => {
    expect(validatePayoutAmount("99", 500)).toContain("ขั้นต่ำ");
    expect(validatePayoutAmount("501", 500)).toContain("เกินยอดถอนได้");
    expect(validatePayoutAmount("100.123", 500)).toContain("ทศนิยม");
    expect(validatePayoutAmount("abc", 500)).toContain("ตัวเลข");
    expect(validatePayoutAmount("100.50", 500)).toBeNull();
  });
  it("maps every backend status and formats details in Buddhist years", () => {
    expect(["REQUESTED", "APPROVED", "PROCESSING", "PAID", "REJECTED", "FAILED"].map((status) => payoutStatus(status).label)).toEqual(["รอตรวจสอบ", "อนุมัติแล้ว", "กำลังโอน", "โอนสำเร็จ", "ไม่อนุมัติ", "โอนไม่สำเร็จ"]);
    expect(payoutStatus("OTHER").label).toBe("OTHER");
    expect(payoutDetail(requested)).toBe("รอแอดมินตรวจสอบ");
    expect(payoutDetail({ ...paid, status: "APPROVED" })).toContain("อนุมัติเมื่อ");
    expect(payoutDetail({ ...paid, status: "PROCESSING" })).toContain("อนุมัติเมื่อ");
    expect(payoutDetail(paid)).toContain("REF-12");
    expect(payoutDetail({ ...paid, status: "REJECTED", rejectionReason: "ไม่ผ่านการตรวจสอบ" })).toContain("ยอดกลับมาถอนได้แล้ว");
    expect(payoutDetail({ ...paid, status: "FAILED", rejectionReason: "โอนไม่ผ่าน" })).toContain("ยอดกลับมาถอนได้แล้ว");
    expect(formatThaiDateTime("2026-10-15T02:12:00Z")).toContain("2569");
    expect(formatThaiDateTime("2026-10-15T02:12:00Z")).toContain("09:12");
    expect(formatThaiDateTime("2026-10-15T02:12:00Z")).toContain(" · ");
  });
});

describe("seller payout page", () => {
  it("shows real wallet values and submits only a valid request", async () => {
    renderPage();
    expect(await screen.findByText("฿3,420.00")).toBeTruthy();
    expect(await screen.findByText("••••7890")).toBeTruthy();
    expect(screen.getByText("฿5,420.00")).toBeTruthy();
    expect(screen.getByRole("link", { name: "ส่งยืนยันบัญชีใหม่" }).getAttribute("href")).toBe("/seller/verification");
    fireEvent.click(screen.getByRole("button", { name: "ขอถอนเงิน" }));
    const dialog = screen.getByRole("dialog", { name: "ขอถอนเงิน" });
    const input = within(dialog).getByRole("textbox", { name: "จำนวนเงินที่ต้องการถอน" });
    fireEvent.change(input, { target: { value: "99" } });
    expect(within(dialog).getByRole("alert").textContent).toContain("ขั้นต่ำต่อครั้ง");
    expect(within(dialog).getByRole("button", { name: /ยืนยันขอถอน/ }).hasAttribute("disabled")).toBe(true);
    fireEvent.change(input, { target: { value: "100" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /ยืนยันขอถอน/ }));
    await waitFor(() => expect(financeApi.requestPayout).toHaveBeenCalledWith(100));
    expect(financeApi.wallet).toHaveBeenCalledWith(0, 20);
  });
  it("opens payout detail from the tracker and wallet tab", async () => {
    renderPage();
    expect(await screen.findByText("คำขอที่ยังไม่โอน")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /#13.*รายละเอียด/ }));
    expect(screen.getByText("คำขอถอน #13")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "รายการเคลื่อนไหวกระเป๋า" }));
    expect(screen.getByText("+฿500.00")).toBeTruthy();
    expect(screen.getByText("แสดง 1–1 จาก 1 รายการ")).toBeTruthy();
  });
  it("keeps the payout page visible while the next wallet ledger page loads", async () => {
    let resolveNext!: (value: Wallet) => void;
    vi.mocked(financeApi.wallet).mockImplementation((page) => page === 0
      ? Promise.resolve({ ...wallet, entries: { ...wallet.entries, totalItems: 21 } })
      : new Promise<Wallet>((resolve) => { resolveNext = resolve; }));
    renderPage();
    await screen.findByText("฿3,420.00");
    fireEvent.click(screen.getByRole("button", { name: "รายการเคลื่อนไหวกระเป๋า" }));
    fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
    expect(screen.getByText("฿3,420.00")).toBeTruthy();
    expect(screen.getByText("กำลังโหลดรายการ...")).toBeTruthy();
    expect(screen.queryByRole("status", { name: "กำลังโหลดข้อมูลการเงิน" })).toBeNull();
    await act(async () => resolveNext({ ...wallet, entries: { items: [], totalItems: 21 } }));
    expect(await screen.findByText("แสดง 21–21 จาก 21 รายการ")).toBeTruthy();
    expect(financeApi.wallet).toHaveBeenCalledWith(1, 20);
  });
  it("blocks withdrawal below the minimum", async () => {
    vi.mocked(financeApi.wallet).mockResolvedValue({ ...wallet, withdrawable: 50 });
    renderPage();
    expect(await screen.findByText(/ต้องมียอดถอนได้อย่างน้อย/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "ขอถอนเงิน" }).hasAttribute("disabled")).toBe(true);
  });
  it("keeps the dialog open and shows the latest balance after a 409", async () => {
    vi.mocked(financeApi.wallet).mockResolvedValueOnce(wallet).mockResolvedValue({ ...wallet, withdrawable: 250 });
    vi.mocked(financeApi.requestPayout).mockRejectedValue(new ApiError({ status: 409, code: "INSUFFICIENT_BALANCE", message: "Insufficient balance" }));
    renderPage();
    await screen.findByText("฿3,420.00");
    fireEvent.click(screen.getByRole("button", { name: "ขอถอนเงิน" }));
    const dialog = screen.getByRole("dialog", { name: "ขอถอนเงิน" });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "จำนวนเงินที่ต้องการถอน" }), { target: { value: "300" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /ยืนยันขอถอน/ }));
    expect(await within(dialog).findByText(/ยอดล่าสุดคือ ฿250.00/)).toBeTruthy();
    expect(within(dialog).getByRole("textbox", { name: "จำนวนเงินที่ต้องการถอน" })).toBeTruthy();
  });
  it("shows the normal page with a locked action when the payout account is missing", async () => {
    vi.mocked(financeApi.payoutAccount).mockRejectedValue(new ApiError({ status: 404, code: "PAYOUT_ACCOUNT_NOT_FOUND", message: "No account" }));
    renderPage();
    expect(await screen.findByText(/ยังไม่มีบัญชีรับเงิน —/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "ขอถอนเงิน" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("link", { name: "ยืนยันตัวตนและบัญชีธนาคาร" })).toBeTruthy();
  });
  it("locks withdrawal when the seller is not verified", async () => {
    vi.mocked(financeApi.payoutAccount).mockRejectedValue(new ApiError({ status: 403, code: "SELLER_NOT_VERIFIED", message: "Not verified" }));
    renderPage();
    expect(await screen.findByText(/สถานะร้านยังไม่ใช่/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "ขอถอนเงิน" }).hasAttribute("disabled")).toBe(true);
  });
  it("does not show zero balances or empty history when finance APIs are unavailable", async () => {
    const unavailable = new ApiError({ status: 403, code: "SELLER_NOT_VERIFIED", message: "Not verified" });
    vi.mocked(financeApi.wallet).mockRejectedValue(unavailable);
    vi.mocked(financeApi.myPayouts).mockRejectedValue(unavailable);
    vi.mocked(financeApi.payoutAccount).mockRejectedValue(unavailable);
    renderPage();
    expect(await screen.findByText("ยังโหลดรายการคำขอถอนเงินไม่ได้ กรุณาลองอีกครั้งเมื่อบัญชีผู้ขายได้รับการยืนยัน")).toBeTruthy();
    expect(screen.queryByText("฿0.00")).toBeNull();
    expect(screen.queryByText("ยังไม่มีคำขอถอนเงิน")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "รายการเคลื่อนไหวกระเป๋า" }));
    expect(screen.getByText("ยังโหลดรายการเคลื่อนไหวกระเป๋าไม่ได้")).toBeTruthy();
  });
});
