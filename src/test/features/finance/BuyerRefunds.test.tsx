import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { OrderRefunds } from "@/features/finance/BuyerRefunds";
import { financeApi } from "@/features/finance/finance.api";
import type { Refund } from "@/features/finance/finance.types";
import { orderStatusLabel } from "@/features/account/order-status.format";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";
import type { Language } from "@/lib/i18n";

vi.mock("@/features/finance/finance.api", () => ({ financeApi: {
  myRefunds: vi.fn(), getRefund: vi.fn(), setRefundDestination: vi.fn(),
} }));

const refund: Refund = {
  id: 13, salesOrderId: 23, sellerOrderId: 33, amount: 500, reason: "Demo refund",
  status: "APPROVED", method: "BANK_TRANSFER", bankName: "ธนาคารทดสอบ",
  accountName: "ผู้ทดสอบ", accountNumber: "123456789", transferReference: null,
  requestedAt: "2026-10-13T00:00:00Z", processedAt: null,
};

function setup(data: Refund, others: Refund[] = [], language: Language = "th") {
  vi.mocked(financeApi.myRefunds).mockResolvedValue([data, ...others]);
  vi.mocked(financeApi.getRefund).mockResolvedValue(data);
  return renderWithProviders(<OrderRefunds salesOrderId={23} />, { language });
}

afterEach(() => { vi.clearAllMocks(); });

describe("buyer refunds", () => {
  it("translates API statuses and methods while keeping the saved destination read only", async () => {
    setup(refund);
    expect(await screen.findByText("อนุมัติแล้ว")).toBeTruthy();
    expect(screen.getByText(/บันทึกบัญชีรับเงินคืนแล้ว/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "บันทึกบัญชีรับเงินคืน" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "ดูรายละเอียดล่าสุด" }));
    expect(await screen.findByText("วิธีคืนเงิน: โอนเข้าบัญชีธนาคาร")).toBeTruthy();
    expect(screen.getByText("สถานะล่าสุด: อนุมัติแล้ว")).toBeTruthy();
  });

  it("submits only a changed account once and returns to the saved state", async () => {
    let resolveSave!: (value: Refund) => void;
    vi.mocked(financeApi.setRefundDestination).mockImplementation(() => new Promise((resolve) => { resolveSave = resolve; }));
    setup(refund);
    fireEvent.click(await screen.findByRole("button", { name: "แก้ไขบัญชีรับเงินคืน" }));
    const saveButton = screen.getByRole("button", { name: "บันทึกบัญชีรับเงินคืน" });
    expect(saveButton.hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByRole("textbox", { name: "ธนาคารสำหรับคืนเงิน 13" }), { target: { value: "ธนาคารใหม่" } });
    fireEvent.click(saveButton);
    expect(vi.mocked(financeApi.setRefundDestination)).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "กำลังบันทึก..." }).hasAttribute("disabled")).toBe(true);
    resolveSave({ ...refund, bankName: "ธนาคารใหม่" });
    await waitFor(() => expect(screen.getByText(/บันทึกบัญชีรับเงินคืนแล้ว: ธนาคารใหม่/)).toBeTruthy());
    expect(screen.queryByRole("button", { name: "บันทึกบัญชีรับเงินคืน" })).toBeNull();
    expect(vi.mocked(financeApi.setRefundDestination)).toHaveBeenCalledTimes(1);
  });

  it("does not offer account editing after transfer processing starts", async () => {
    setup({ ...refund, status: "PROCESSING" });
    expect(await screen.findByText("กำลังโอนเงินคืน")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "แก้ไขบัญชีรับเงินคืน" })).toBeNull();
  });

  it("shows a loading state and a not-found error when the refund detail API returns 404", async () => {
    let rejectDetail!: (reason: unknown) => void;
    setup(refund);
    vi.mocked(financeApi.getRefund).mockReturnValue(new Promise((_, reject) => { rejectDetail = reject; }));

    fireEvent.click(await screen.findByRole("button", { name: "ดูรายละเอียดล่าสุด" }));
    expect(screen.getByRole("status", { name: "กำลังโหลดรายละเอียด" })).toBeInTheDocument();
    rejectDetail(new ApiError({ status: 404, code: "REFUND_NOT_FOUND", message: "Not found" }));
    expect(await screen.findByText("โหลดรายละเอียดไม่สำเร็จ")).toBeInTheDocument();
  });

  it("shows only the refunds of its own order", async () => {
    setup(refund, [{ ...refund, id: 14, salesOrderId: 99, amount: 777 }]);
    expect(await screen.findByText("การคืนเงิน ฿500.00")).toBeTruthy();
    expect(screen.queryByText(/฿777/)).toBeNull();
  });

  it("renders nothing for an order without refunds", async () => {
    vi.mocked(financeApi.myRefunds).mockResolvedValue([{ ...refund, salesOrderId: 99 }]);
    const { container } = renderWithProviders(<OrderRefunds salesOrderId={23} />);
    await waitFor(() => expect(financeApi.myRefunds).toHaveBeenCalled());
    expect(container.querySelector("section")).toBeNull();
  });

  it("renders refund statuses and methods in English with zero Thai text", async () => {
    setup(refund, [], "en");
    expect(await screen.findByText("Approved")).toBeTruthy();
    expect(screen.getByText(/Refund account saved/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View latest details" }));
    expect(await screen.findByText("Refund method: Bank transfer")).toBeTruthy();
    expect(screen.getByText("Latest status: Approved")).toBeTruthy();
  });

  it("translates buyer order status codes", () => {
    expect(orderStatusLabel("CANCELLED")).toBe("ยกเลิกแล้ว");
    expect(orderStatusLabel("RETURN_REQUESTED")).toBe("มีคำขอคืนสินค้า");
  });
});
