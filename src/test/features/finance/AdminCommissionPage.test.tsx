import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminCommissionPage } from "@/features/admin/pages/AdminCommissionPage";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import { ApiError } from "@/lib/api";
import { useCategoryList, useGameList } from "@/features/catalog/catalog.queries";

vi.mock("@/features/finance/after-sales.api", () => ({ afterSalesApi: {
  commissionRules: vi.fn(), commissionRule: vi.fn(), createCommissionRule: vi.fn(),
  updateCommissionRule: vi.fn(), deactivateCommissionRule: vi.fn(),
  defaultCommissionRate: vi.fn(), updateDefaultCommissionRate: vi.fn(),
} }));
vi.mock("@/features/catalog/catalog.queries", () => ({ useGameList: vi.fn(), useCategoryList: vi.fn() }));

const globalRule = { id: 1, scope: "GLOBAL" as const, gameId: null, categoryId: null,
  sellerProfileId: null, ratePercent: 5, fixedFee: 0, minFee: null, maxFee: null,
  priority: 0, effectiveFrom: "2026-10-13T00:00:00Z", effectiveTo: null, active: true };
const categoryRule = { ...globalRule, id: 2, scope: "CATEGORY" as const, categoryId: 7,
  ratePercent: 7 };

describe("admin commission settings", () => {
  it("shows the live rules and saves a changed default rate through the API", async () => {
    vi.mocked(useGameList).mockReturnValue({ isSuccess: true, data: [{ id: 1, name: "Pokémon" }] } as never);
    vi.mocked(useCategoryList).mockReturnValue({ isSuccess: true, data: [{ id: 7, name: "กล่อง/ซองสุ่ม", gameId: null }] } as never);
    vi.mocked(afterSalesApi.defaultCommissionRate).mockResolvedValue({ key: "commission.default_rate", value: "5.0", description: "", updatedBy: null });
    vi.mocked(afterSalesApi.commissionRules).mockResolvedValue([globalRule, categoryRule]);
    vi.mocked(afterSalesApi.updateCommissionRule).mockResolvedValue(globalRule);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><AdminCommissionPage /></QueryClientProvider>);

    expect(await screen.findByText("กล่อง/ซองสุ่ม")).toBeTruthy();
    expect(screen.getByText("Pokémon")).toBeTruthy();
    expect(screen.getByText("฿1,225.50")).toBeTruthy();
    fireEvent.change(screen.getByRole("spinbutton", { name: "อัตราค่าคอมมิชชั่น (%)" }),
      { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกการตั้งค่า" }));
    await waitFor(() => expect(afterSalesApi.updateCommissionRule).toHaveBeenCalledWith(1,
      expect.objectContaining({ scope: "GLOBAL", ratePercent: 6 })));
  });

  it("saves a game-specific rate using its real catalog ID", async () => {
    vi.mocked(useGameList).mockReturnValue({ isSuccess: true, data: [{ id: 4, name: "One Piece" }] } as never);
    vi.mocked(useCategoryList).mockReturnValue({ isSuccess: true, data: [] } as never);
    vi.mocked(afterSalesApi.defaultCommissionRate).mockResolvedValue({ key: "commission.default_rate", value: "5.0", description: "", updatedBy: null });
    vi.mocked(afterSalesApi.commissionRules).mockResolvedValue([]);
    vi.mocked(afterSalesApi.createCommissionRule).mockResolvedValue({ ...globalRule, scope: "GAME", gameId: 4, ratePercent: 7 } as never);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><AdminCommissionPage /></QueryClientProvider>);
    expect(await screen.findByText("One Piece")).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: "ตั้งค่าอัตราเฉพาะสำหรับ One Piece" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "อัตราค่าคอมของ One Piece" }), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกการตั้งค่า" }));
    await waitFor(() => expect(afterSalesApi.createCommissionRule).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "GAME", gameId: 4, ratePercent: 7 })));
    expect(afterSalesApi.updateDefaultCommissionRate).not.toHaveBeenCalled();
  });

  // popup + Select ของ base-ui ช้าเมื่อรันพร้อมไฟล์อื่น เกิน 5 วินาทีที่ตั้งไว้ปกติ
  const POPUP_TIMEOUT = 15_000;

  function renderPage(rules: unknown[] = [], categories: unknown[] = []) {
    vi.clearAllMocks();
    vi.mocked(useGameList).mockReturnValue({ isSuccess: true, data: [{ id: 4, name: "One Piece" }] } as never);
    vi.mocked(useCategoryList).mockReturnValue({ isSuccess: true, data: categories } as never);
    vi.mocked(afterSalesApi.defaultCommissionRate).mockResolvedValue({ key: "commission.default_rate", value: "5.0", description: "", updatedBy: null });
    vi.mocked(afterSalesApi.commissionRules).mockResolvedValue(rules as never);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><AdminCommissionPage /></QueryClientProvider>);
  }

  it("creates a detailed game rule from the add popup", async () => {
    const user = userEvent.setup();
    renderPage();
    vi.mocked(afterSalesApi.createCommissionRule).mockResolvedValue({ ...globalRule, id: 3, scope: "GAME", gameId: 4, ratePercent: 8 } as never);
    expect(await screen.findByText("One Piece")).toBeTruthy();
    expect(screen.queryByText("กฎเพิ่มเติมและการตั้งค่าขั้นสูง")).toBeNull();
    await user.click(screen.getByRole("button", { name: "+ เพิ่มหมวดหมู่" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("เพิ่มกฎค่าคอมมิชชั่น")).toBeTruthy();
    await user.click(within(dialog).getByRole("radio", { name: "เกม" }));
    await user.click(within(dialog).getByRole("combobox", { name: "เกม" }));
    await user.click(await screen.findByRole("option", { name: "One Piece" }));
    const rate = within(dialog).getByLabelText("อัตราค่าคอมมิชชั่น") as HTMLInputElement;
    fireEvent.change(rate, { target: { value: "8" } });
    fireEvent.change(within(dialog).getByLabelText("ค่าธรรมเนียมคงที่ต่อคำสั่งซื้อ"), { target: { value: "2.50" } });
    fireEvent.change(within(dialog).getByLabelText("เก็บขั้นต่ำ"), { target: { value: "10" } });
    fireEvent.change(within(dialog).getByLabelText("เก็บสูงสุด"), { target: { value: "500" } });
    fireEvent.change(within(dialog).getByLabelText("ลำดับความสำคัญ"), { target: { value: "101" } });
    // 1,290 × 8% = 103.20 + 2.50 = 105.70 → ผู้ขายได้ 1,184.30
    expect(within(dialog).getByText("฿1,184.30")).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "สร้างกฎ" }));
    await waitFor(() => expect(afterSalesApi.createCommissionRule).toHaveBeenCalledWith(expect.objectContaining({
      scope: "GAME", gameId: 4, categoryId: null, sellerProfileId: null,
      ratePercent: 8, fixedFee: 2.5, minFee: 10, maxFee: 500, priority: 101, effectiveTo: null, active: true })));
  }, POPUP_TIMEOUT);

  it("blocks invalid input with field errors before calling the API", async () => {
    const user = userEvent.setup();
    renderPage([], [{ id: 7, name: "กล่อง/ซองสุ่ม", gameId: 4 }]);
    vi.mocked(afterSalesApi.createCommissionRule).mockResolvedValue({ ...categoryRule, id: 3 } as never);
    expect(await screen.findByText("One Piece")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "+ เพิ่มหมวดหมู่" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("radio", { name: "หมวดหมู่" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.change(within(dialog).getByLabelText("เก็บขั้นต่ำ"), { target: { value: "50" } });
    fireEvent.change(within(dialog).getByLabelText("เก็บสูงสุด"), { target: { value: "10" } });
    await user.click(within(dialog).getByRole("button", { name: "สร้างกฎ" }));
    expect(within(dialog).getByText("กรุณาเลือกหมวดหมู่")).toBeTruthy();
    expect(within(dialog).getByText("ขั้นสูงต้องไม่น้อยกว่าขั้นต่ำ")).toBeTruthy();
    expect(afterSalesApi.createCommissionRule).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("combobox", { name: "หมวดหมู่" }));
    await user.click(await screen.findByRole("option", { name: "One Piece · กล่อง/ซองสุ่ม" }));
    fireEvent.change(within(dialog).getByLabelText("เก็บสูงสุด"), { target: { value: "" } });
    await user.click(within(dialog).getByRole("button", { name: "สร้างกฎ" }));
    await waitFor(() => expect(afterSalesApi.createCommissionRule).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "CATEGORY", categoryId: 7, gameId: null, ratePercent: 5, minFee: 50, maxFee: null })));
  }, POPUP_TIMEOUT);

  it("lists, edits and deactivates rules from the manage popup", async () => {
    const user = userEvent.setup();
    const sellerRule = { ...globalRule, id: 9, scope: "SELLER" as const, sellerProfileId: 12, ratePercent: 3 };
    renderPage([globalRule, categoryRule, sellerRule], [{ id: 7, name: "กล่อง/ซองสุ่ม", gameId: null }]);
    vi.mocked(afterSalesApi.updateCommissionRule).mockResolvedValue(sellerRule);
    vi.mocked(afterSalesApi.deactivateCommissionRule).mockResolvedValue(undefined);
    expect(await screen.findByText("กล่อง/ซองสุ่ม")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /จัดการกฎทั้งหมด/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("ร้านค้า #12")).toBeTruthy();
    expect(within(dialog).getByText("ทุกเกม · กล่อง/ซองสุ่ม")).toBeTruthy();

    await user.click(within(dialog).getByRole("button", { name: "แก้ไขกฎ #9" }));
    expect(within(dialog).getByText("แก้ไขกฎ #9")).toBeTruthy();
    expect((within(dialog).getByLabelText("รหัสร้านค้า (seller profile ID)") as HTMLInputElement).value).toBe("12");
    const rate = within(dialog).getByLabelText("อัตราค่าคอมมิชชั่น");
    fireEvent.change(rate, { target: { value: "2.5" } });
    await user.click(within(dialog).getByRole("button", { name: "บันทึกการแก้ไข" }));
    await waitFor(() => expect(afterSalesApi.updateCommissionRule).toHaveBeenCalledWith(9,
      expect.objectContaining({ scope: "SELLER", sellerProfileId: 12, ratePercent: 2.5 })));

    await user.click(await within(dialog).findByRole("button", { name: "ปิดใช้งานกฎ #2" }));
    await user.click(within(dialog).getByRole("button", { name: "ยืนยัน" }));
    await waitFor(() => expect(afterSalesApi.deactivateCommissionRule).toHaveBeenCalledWith(2));
  }, POPUP_TIMEOUT);

  it("shows a missing seller from the API and clears it once the form changes", async () => {
    const user = userEvent.setup();
    renderPage();
    vi.mocked(afterSalesApi.createCommissionRule).mockRejectedValue(
      new ApiError({ status: 404, code: "SELLER_NOT_FOUND", message: "Seller not found" }));
    expect(await screen.findByText("One Piece")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "+ เพิ่มหมวดหมู่" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("radio", { name: "ผู้ขาย" }));
    fireEvent.change(within(dialog).getByLabelText("รหัสร้านค้า (seller profile ID)"), { target: { value: "999" } });
    await user.click(within(dialog).getByRole("button", { name: "สร้างกฎ" }));
    expect(await within(dialog).findByText("ไม่พบร้านค้ารหัสนี้")).toBeTruthy();
    await user.click(within(dialog).getByRole("radio", { name: "เกม" }));
    expect(within(dialog).queryByText("ไม่พบร้านค้ารหัสนี้")).toBeNull();
  }, POPUP_TIMEOUT);
});
