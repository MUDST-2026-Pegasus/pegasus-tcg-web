import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, renderWithProviders, userEvent } from "@/test/utils";
import { ApiError } from "@/lib/api/errors";
import { AdminPromotionsPage } from "@/features/admin/promotions/PromotionsPage";
import { adminPromotionApi } from "@/features/admin/promotions/api";
import type { AdminPromotion } from "@/features/admin/promotions/types";

vi.mock("@/features/admin/promotions/api", () => ({
  adminPromotionApi: {
    list: vi.fn(), summary: vi.fn(), get: vi.fn(), remove: vi.fn(), pause: vi.fn(),
    resume: vi.fn(), homeOrder: vi.fn(), redemptions: vi.fn(), update: vi.fn(),
  },
}));

const code: AdminPromotion = {
  id: 1, code: "PEGASUS10", name: "Welcome", description: null, ownerType: "PLATFORM", owner: null,
  discountType: "PERCENT", discountValue: 10, maxDiscount: 200, minSpend: 500,
  scopeType: "ALL", scopeIds: [], visibility: "PUBLIC", newBuyerOnly: false,
  usageLimitTotal: 500, usageLimitPerUser: 1, usedCount: 0, claimable: true,
  claimRequired: false, claimLimit: 500, claimedCount: 0, featuredOnHome: true,
  homeSort: 1, startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-12-01T00:00:00Z",
  status: "ACTIVE", pausedAt: null, pauseReason: null, createdAt: "2026-10-01T00:00:00Z",
};
const page = (items: AdminPromotion[], index = 0, totalPages = 1) => ({
  page: { items, page: index, size: 100, totalItems: items.length, totalPages },
  statusCounts: { ACTIVE: items.length, SCHEDULED: 0, PAUSED: 0, EXPIRED: 0, USED_UP: 0 },
});

describe("admin promotions actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminPromotionApi.list).mockImplementation(async ({ page: index }) => page([code], index));
    vi.mocked(adminPromotionApi.summary).mockResolvedValue({ activePlatformCodes: 1, activeSellerCodes: 0, redemptions30d: 0, redemptionsChangePercent: null, claims30d: 0, platformDiscountCost30d: 0, salesWithCodes30d: 0 });
    vi.mocked(adminPromotionApi.get).mockResolvedValue(code);
    vi.mocked(adminPromotionApi.remove).mockResolvedValue(undefined);
    vi.mocked(adminPromotionApi.pause).mockResolvedValue({ ...code, status: "PAUSED" });
    vi.mocked(adminPromotionApi.homeOrder).mockResolvedValue([]);
    vi.mocked(adminPromotionApi.update).mockResolvedValue({ ...code, status: "EXPIRED" });
    vi.mocked(adminPromotionApi.redemptions).mockResolvedValue({ items: [], page: 0, size: 20, totalItems: 0, totalPages: 1 });
  });

  it("requires the exact code before deleting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    await user.click(await screen.findByLabelText("จัดการ PEGASUS10"));
    await user.click(screen.getByRole("button", { name: "ลบ" }));
    const confirm = screen.getByRole("button", { name: "ลบโค้ด" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByPlaceholderText("PEGASUS10"), "PEGASUS10");
    await user.click(confirm);
    await waitFor(() => expect(adminPromotionApi.remove).toHaveBeenCalledWith(1));
  });

  it("offers pause when delete returns PROMO_IN_USE", async () => {
    vi.mocked(adminPromotionApi.remove).mockRejectedValueOnce(new ApiError({ status: 409, code: "PROMO_IN_USE", message: "In use" }));
    const user = userEvent.setup();
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    await user.click(await screen.findByLabelText("จัดการ PEGASUS10"));
    await user.click(screen.getByRole("button", { name: "ลบ" }));
    await user.type(screen.getByPlaceholderText("PEGASUS10"), "PEGASUS10");
    await user.click(screen.getByRole("button", { name: "ลบโค้ด" }));
    await user.click(await screen.findByRole("button", { name: "หยุดชั่วคราว" }));
    await user.click(screen.getByRole("button", { name: "หยุดชั่วคราว" }));
    await waitFor(() => expect(adminPromotionApi.pause).toHaveBeenCalledWith(1, "", true));
  });

  it("can end an unused but already claimed code today after delete is rejected", async () => {
    vi.mocked(adminPromotionApi.remove).mockRejectedValueOnce(new ApiError({ status: 409, code: "PROMO_IN_USE", message: "Claimed" }));
    const user = userEvent.setup();
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    await user.click(await screen.findByLabelText("จัดการ PEGASUS10"));
    await user.click(screen.getByRole("button", { name: "ลบ" }));
    await user.type(screen.getByPlaceholderText("PEGASUS10"), "PEGASUS10");
    await user.click(screen.getByRole("button", { name: "ลบโค้ด" }));
    await user.click(await screen.findByRole("button", { name: "สิ้นสุดวันนี้" }));
    await waitFor(() => expect(adminPromotionApi.update).toHaveBeenCalledWith(1, expect.objectContaining({ featuredOnHome: false })));
  });

  it("does not offer an unsupported end-date change after the code was used", async () => {
    vi.mocked(adminPromotionApi.list).mockImplementation(async () => page([{ ...code, usedCount: 1 }]));
    vi.mocked(adminPromotionApi.remove).mockRejectedValueOnce(new ApiError({ status: 409, code: "PROMO_IN_USE", message: "Used" }));
    const user = userEvent.setup();
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    await user.click(await screen.findByLabelText("จัดการ PEGASUS10"));
    await user.click(screen.getByRole("button", { name: "ลบ" }));
    await user.type(screen.getByPlaceholderText("PEGASUS10"), "PEGASUS10");
    await user.click(screen.getByRole("button", { name: "ลบโค้ด" }));
    expect(await screen.findByRole("button", { name: "สิ้นสุดวันนี้" })).toBeDisabled();
  });

  it("restores filters, page and redemption sheet from the URL", async () => {
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions?owner=PLATFORM&status=ACTIVE&q=welcome&page=2&promo=1&redemptionPage=1" });
    await waitFor(() => expect(adminPromotionApi.list).toHaveBeenCalledWith(expect.objectContaining({ owner: "PLATFORM", status: "ACTIVE", q: "welcome", page: 2 })));
    await waitFor(() => expect(adminPromotionApi.redemptions).toHaveBeenCalledWith(1, 1));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(await screen.findByText("ส่วนลดที่ Pegasus ออก")).toBeInTheDocument();
    expect(screen.getByText("ยอดขายจากโค้ดนี้")).toBeInTheDocument();
  });

  it("loads every page of home candidates and saves their order", async () => {
    const second = { ...code, id: 2, code: "WELCOME20", featuredOnHome: false };
    vi.mocked(adminPromotionApi.list).mockImplementation(async ({ owner, page: index }) => owner === "PLATFORM" ? page(index === 0 ? [code] : [second], index, 2) : page([code]));
    const user = userEvent.setup();
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    await user.click(await screen.findByRole("button", { name: /จัดลำดับหน้าแรก/ }));
    await user.click(await screen.findByRole("checkbox", { name: "WELCOME20" }));
    await user.click(screen.getByRole("button", { name: "บันทึก" }));
    await waitFor(() => expect(adminPromotionApi.homeOrder).toHaveBeenCalledWith([1, 2]));
  });

  it("refreshes the status row and tab count after pausing a code", async () => {
    let current = code;
    vi.mocked(adminPromotionApi.list).mockImplementation(async () => ({ page: { items: [current], page: 0, size: 20, totalItems: 1, totalPages: 1 }, statusCounts: { ACTIVE: current.status === "ACTIVE" ? 1 : 0, SCHEDULED: 0, PAUSED: current.status === "PAUSED" ? 1 : 0, EXPIRED: 0, USED_UP: 0 } }));
    vi.mocked(adminPromotionApi.pause).mockImplementation(async () => { current = { ...current, status: "PAUSED" }; return current; });
    const user = userEvent.setup();
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    await user.click(await screen.findByLabelText("จัดการ PEGASUS10"));
    await user.click(screen.getByRole("button", { name: "หยุดชั่วคราว" }));
    await user.click(screen.getByRole("button", { name: "หยุดชั่วคราว" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "หยุดชั่วคราว 1" })).toBeInTheDocument());
    expect(screen.getAllByText("หยุดชั่วคราว").length).toBeGreaterThan(0);
  });

  it("requires a category and explanation before pausing a seller code", async () => {
    vi.mocked(adminPromotionApi.list).mockImplementation(async () => page([{ ...code, ownerType: "SELLER" }]));
    const user = userEvent.setup();
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    await user.click(await screen.findByLabelText("จัดการ PEGASUS10"));
    await user.click(screen.getByRole("button", { name: "หยุดชั่วคราว" }));
    const confirm = screen.getByRole("button", { name: "หยุดชั่วคราว" });
    expect(confirm).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("เหตุผล *"), "ส่วนลดสูงผิดปกติ");
    await user.type(screen.getByLabelText("รายละเอียดที่แจ้งร้าน *"), "ตรวจพบราคาผิด");
    await user.click(confirm);
    await waitFor(() => expect(adminPromotionApi.pause).toHaveBeenCalledWith(1, "ส่วนลดสูงผิดปกติ: ตรวจพบราคาผิด", true));
  });
});
