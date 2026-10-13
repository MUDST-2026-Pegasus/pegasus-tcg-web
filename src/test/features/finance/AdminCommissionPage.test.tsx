import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminCommissionPage } from "@/features/admin/pages/AdminCommissionPage";
import { afterSalesApi } from "@/features/finance/after-sales.api";
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

  it("replaces empty zero fields and creates a rule with the selected game", async () => {
    vi.clearAllMocks();
    vi.mocked(useGameList).mockReturnValue({ isSuccess: true, data: [{ id: 4, name: "One Piece" }] } as never);
    vi.mocked(useCategoryList).mockReturnValue({ isSuccess: true, data: [] } as never);
    vi.mocked(afterSalesApi.defaultCommissionRate).mockResolvedValue({ key: "commission.default_rate", value: "5.0", description: "", updatedBy: null });
    vi.mocked(afterSalesApi.commissionRules).mockResolvedValue([]);
    vi.mocked(afterSalesApi.createCommissionRule).mockResolvedValue({ ...globalRule, id: 3, scope: "GAME", gameId: 4, ratePercent: 8 } as never);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><AdminCommissionPage /></QueryClientProvider>);
    expect(await screen.findByText("One Piece")).toBeTruthy();
    fireEvent.click(screen.getByText("กฎเพิ่มเติมและการตั้งค่าขั้นสูง"));
    fireEvent.change(screen.getByLabelText("ขอบเขต"), { target: { value: "GAME" } });
    const game = screen.getByLabelText("เกม") as HTMLSelectElement;
    expect(game.textContent).toContain("One Piece");
    fireEvent.change(game, { target: { value: "4" } });
    const rate = screen.getByLabelText("อัตรา (%)") as HTMLInputElement;
    const fixedFee = screen.getByLabelText("ค่าธรรมเนียมคงที่ (บาท)") as HTMLInputElement;
    const priority = screen.getByLabelText("ลำดับความสำคัญ") as HTMLInputElement;
    expect(rate.value).toBe("");
    expect(fixedFee.value).toBe("");
    expect(priority.value).toBe("");
    fireEvent.change(rate, { target: { value: "8" } });
    fireEvent.change(fixedFee, { target: { value: "2.50" } });
    fireEvent.change(priority, { target: { value: "101" } });
    expect(rate.value).toBe("8");
    expect(fixedFee.value).toBe("2.50");
    expect(priority.value).toBe("101");
    fireEvent.click(screen.getByRole("button", { name: "สร้างกฎ" }));
    await waitFor(() => expect(afterSalesApi.createCommissionRule).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "GAME", gameId: 4, categoryId: null, ratePercent: 8, fixedFee: 2.5, priority: 101 })));
  });

  it("selects a category by name and blocks a missing selection", async () => {
    vi.clearAllMocks();
    vi.mocked(useGameList).mockReturnValue({ isSuccess: true, data: [{ id: 4, name: "One Piece" }] } as never);
    vi.mocked(useCategoryList).mockReturnValue({ isSuccess: true, data: [{ id: 7, name: "กล่อง/ซองสุ่ม", gameId: 4 }] } as never);
    vi.mocked(afterSalesApi.defaultCommissionRate).mockResolvedValue({ key: "commission.default_rate", value: "5.0", description: "", updatedBy: null });
    vi.mocked(afterSalesApi.commissionRules).mockResolvedValue([]);
    vi.mocked(afterSalesApi.createCommissionRule).mockResolvedValue({ ...categoryRule, id: 3 } as never);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><AdminCommissionPage /></QueryClientProvider>);
    expect(await screen.findByText("One Piece")).toBeTruthy();
    fireEvent.click(screen.getByText("กฎเพิ่มเติมและการตั้งค่าขั้นสูง"));
    fireEvent.change(screen.getByLabelText("ขอบเขต"), { target: { value: "CATEGORY" } });
    const category = screen.getByLabelText("หมวดหมู่") as HTMLSelectElement;
    expect(category.textContent).toContain("One Piece · กล่อง/ซองสุ่ม");
    fireEvent.click(screen.getByRole("button", { name: "สร้างกฎ" }));
    expect(afterSalesApi.createCommissionRule).not.toHaveBeenCalled();
    fireEvent.change(category, { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("อัตรา (%)"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "สร้างกฎ" }));
    await waitFor(() => expect(afterSalesApi.createCommissionRule).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "CATEGORY", categoryId: 7, gameId: null, ratePercent: 7 })));
  });
});
