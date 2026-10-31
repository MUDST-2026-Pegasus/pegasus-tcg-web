import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminPromotionsPage } from "@/features/admin/pages/AdminPromotionsPage";
import * as promotionsApi from "@/features/admin/promotions.api";
import type { AdminPromotion, AdminPromotionPage } from "@/features/admin/promotions.types";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders, screen, userEvent, waitFor, within } from "@/test/utils";

vi.mock("@/features/admin/promotions.api", () => ({
  getPromotions: vi.fn(),
  getPromotionSummary: vi.fn(),
  getPromotion: vi.fn(),
  createPromotion: vi.fn(),
  updatePromotion: vi.fn(),
  deletePromotion: vi.fn(),
  pausePromotion: vi.fn(),
  resumePromotion: vi.fn(),
  setHomeOrder: vi.fn(),
  getRedemptions: vi.fn(),
  getAllPlatformPromotions: vi.fn(),
  getPromotionCategories: vi.fn(),
}));
vi.mock("@/features/admin/catalog.api", () => ({ getGames: vi.fn().mockResolvedValue([]) }));

const code: AdminPromotion = {
  id: 1,
  code: "PEGASUS10",
  name: "Welcome",
  description: null,
  ownerType: "PLATFORM",
  owner: null,
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscount: 200,
  minSpend: 0,
  scopeType: "ALL",
  scopeIds: [],
  visibility: "PUBLIC",
  newBuyerOnly: false,
  usageLimitTotal: 500,
  usageLimitPerUser: 1,
  usedCount: 0,
  claimable: true,
  claimRequired: false,
  claimLimit: 500,
  claimedCount: 0,
  featuredOnHome: true,
  homeSort: 0,
  startsAt: "2026-10-01T00:00:00Z",
  endsAt: "2027-12-01T00:00:00Z",
  status: "ACTIVE",
  pausedAt: null,
  pauseReason: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};

const shopCode: AdminPromotion = {
  ...code,
  id: 9,
  code: "SHADY90",
  name: "ล้างสต็อก",
  ownerType: "SELLER",
  owner: { id: 5, username: "shady_cards", displayName: "Shady Cards", avatarUrl: null },
  featuredOnHome: false,
  homeSort: null,
};

const page = (items: AdminPromotion[], index = 0, totalPages = 1): AdminPromotionPage => ({
  page: { items, page: index, size: 8, totalItems: items.length, totalPages },
  statusCounts: {
    ACTIVE: items.filter((item) => item.status === "ACTIVE").length,
    SCHEDULED: 0,
    PAUSED: items.filter((item) => item.status === "PAUSED").length,
    EXPIRED: 0,
    USED_UP: 0,
  },
});

async function openMenuItem(promotionCode: string, item: string) {
  const user = userEvent.setup();
  const trigger = await screen.findByLabelText(`จัดการ ${promotionCode}`);
  await user.click(trigger);
  await user.click(await screen.findByRole("menuitem", { name: item }));
  return user;
}

describe("AdminPromotionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(promotionsApi.getPromotions).mockImplementation(async ({ page: index }) => page([code], index));
    vi.mocked(promotionsApi.getPromotionSummary).mockResolvedValue({
      activePlatformCodes: 1,
      activeSellerCodes: 0,
      redemptions30d: 0,
      redemptionsChangePercent: 18,
      claims30d: 0,
      platformDiscountCost30d: 0,
      salesWithCodes30d: 0,
    });
    vi.mocked(promotionsApi.getAllPlatformPromotions).mockResolvedValue([code]);
    vi.mocked(promotionsApi.getPromotionCategories).mockResolvedValue([]);
    vi.mocked(promotionsApi.getPromotion).mockResolvedValue(code);
    vi.mocked(promotionsApi.deletePromotion).mockResolvedValue(undefined);
    vi.mocked(promotionsApi.pausePromotion).mockResolvedValue({ ...code, status: "PAUSED" });
    vi.mocked(promotionsApi.setHomeOrder).mockResolvedValue([]);
    vi.mocked(promotionsApi.updatePromotion).mockResolvedValue({ ...code, status: "EXPIRED" });
    vi.mocked(promotionsApi.getRedemptions).mockResolvedValue({ items: [], page: 0, size: 20, totalItems: 0, totalPages: 1 });
  });

  it("shows rows in the Figma wording, with the shop's username on shop codes", async () => {
    vi.mocked(promotionsApi.getPromotions).mockResolvedValue(page([code, shopCode]));
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    const row = await screen.findByRole("row", { name: /PEGASUS10/ });
    expect(within(row).getByText("ไม่มีขั้นต่ำ")).toBeInTheDocument();
    expect(within(row).getByText("สูงสุด ฿200")).toBeInTheDocument();
    expect(within(row).getByLabelText("แสดงบนหน้าแรก")).toBeInTheDocument();
    expect(screen.getByText("shady_cards · ล้างสต็อก")).toBeInTheDocument();
    expect(screen.getByText("+18% จากเดือนก่อน")).toBeInTheDocument();
  });

  it("requires the exact code before deleting an untouched code", async () => {
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    const user = await openMenuItem("PEGASUS10", "ลบ");
    const confirm = screen.getByRole("button", { name: "ลบโค้ด" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByPlaceholderText("PEGASUS10"), "pegasus10");
    await user.click(confirm);
    await waitFor(() => expect(promotionsApi.deletePromotion).toHaveBeenCalledWith(1));
  });

  it("goes straight to the blocked dialog for a claimed code and can end it today", async () => {
    vi.mocked(promotionsApi.getPromotions).mockResolvedValue(page([{ ...code, claimedCount: 3 }]));
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    const user = await openMenuItem("PEGASUS10", "ลบ");
    expect(await screen.findByText("ลบโค้ดนี้ไม่ได้")).toBeInTheDocument();
    expect(promotionsApi.deletePromotion).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "สิ้นสุดวันนี้" }));
    await waitFor(() =>
      expect(promotionsApi.updatePromotion).toHaveBeenCalledWith(1, expect.objectContaining({ featuredOnHome: false, homeSort: null })),
    );
  });

  it("offers only pausing for a used code, since its end date cannot move earlier", async () => {
    vi.mocked(promotionsApi.getPromotions).mockResolvedValue(page([{ ...code, usedCount: 4, featuredOnHome: false }]));
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    const user = await openMenuItem("PEGASUS10", "ลบ");
    expect(await screen.findByText(/สิ้นสุดก่อนวันที่ตั้งไว้ไม่ได้/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "สิ้นสุดวันนี้" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "หยุดชั่วคราว" }));
    await user.click(await screen.findByRole("button", { name: "หยุดโค้ด" }));
    await waitFor(() => expect(promotionsApi.pausePromotion).toHaveBeenCalledWith(1, null, false));
  });

  it("falls back to the blocked dialog when the API answers PROMO_IN_USE", async () => {
    vi.mocked(promotionsApi.deletePromotion).mockRejectedValueOnce(
      new ApiError({ status: 409, code: "PROMO_IN_USE", message: "In use" }),
    );
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    const user = await openMenuItem("PEGASUS10", "ลบ");
    await user.type(screen.getByPlaceholderText("PEGASUS10"), "PEGASUS10");
    await user.click(screen.getByRole("button", { name: "ลบโค้ด" }));
    expect(await screen.findByText("ลบโค้ดนี้ไม่ได้")).toBeInTheDocument();
  });

  it("takes a paused Pegasus code off the home page when asked", async () => {
    vi.mocked(promotionsApi.getAllPlatformPromotions).mockResolvedValue([code, { ...code, id: 2, code: "FREESHIP", homeSort: 1 }]);
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    const user = await openMenuItem("PEGASUS10", "หยุดชั่วคราว");
    expect(screen.getByRole("checkbox", { name: "ซ่อนจากหน้าแรกระหว่างหยุด" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "หยุดโค้ด" }));
    await waitFor(() => expect(promotionsApi.setHomeOrder).toHaveBeenCalledWith([2]));
  });

  it("restores filters, page and the redemption sheet from the URL", async () => {
    vi.mocked(promotionsApi.getPromotions).mockImplementation(async ({ page: index }) => page([code], index, 3));
    vi.mocked(promotionsApi.getRedemptions).mockResolvedValue({
      items: [
        {
          id: 3,
          salesOrderId: 9,
          orderNumber: "PG-20261029-0412",
          buyer: { id: 7, username: "thanapat", displayName: "ธนภัทร สมใจ", avatarUrl: null },
          amount: 200,
          status: "CONSUMED",
          createdAt: "2026-10-29T00:00:00Z",
        },
      ],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
    });
    renderWithProviders(<AdminPromotionsPage />, {
      route: "/admin/promotions?owner=PLATFORM&status=ACTIVE&q=PEGA&page=1&promo=1",
    });
    await waitFor(() =>
      expect(promotionsApi.getPromotions).toHaveBeenCalledWith({ owner: "PLATFORM", status: "ACTIVE", q: "PEGA", page: 1, size: 8 }),
    );
    expect(await screen.findByText("ธนภัทร ส.")).toBeInTheDocument();
    expect(screen.getByText("ใช้แล้ว")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "PG-20261029-0412" })).toHaveAttribute(
      "href",
      "/admin/orders?q=PG-20261029-0412",
    );
    // sheet เปิดอยู่ ตารางข้างหลังจึงถูกซ่อนจาก accessibility tree
    expect(screen.getByRole("button", { name: "หน้า 2", hidden: true })).toHaveAttribute("aria-current", "page");
  });

  it("refreshes the row and tab count after pausing", async () => {
    let current = code;
    vi.mocked(promotionsApi.getPromotions).mockImplementation(async () => page([current]));
    vi.mocked(promotionsApi.pausePromotion).mockImplementation(async () => {
      current = { ...current, status: "PAUSED" };
      return current;
    });
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    const user = await openMenuItem("PEGASUS10", "หยุดชั่วคราว");
    await user.click(screen.getByRole("button", { name: "หยุดโค้ด" }));
    const pausedTab = await screen.findByRole("tab", { name: /หยุดชั่วคราว/ });
    await waitFor(() => expect(pausedTab).toHaveTextContent("1"));
  });

  it("needs a reason and a message before pausing a shop's code", async () => {
    vi.mocked(promotionsApi.getPromotions).mockResolvedValue(page([shopCode]));
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    const user = await openMenuItem("SHADY90", "หยุดชั่วคราว");
    expect(screen.getByText("หยุดโค้ด SHADY90 ของร้าน shady_cards?")).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "หยุดโค้ดร้าน" });
    expect(confirm).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox"), "ข้อมูลโค้ดไม่ถูกต้อง");
    expect(confirm).toBeDisabled();
    await user.type(screen.getByPlaceholderText("ระบุรายละเอียดที่ร้านจะได้รับ"), "แก้ส่วนลด");
    await user.click(confirm);
    await waitFor(() => expect(promotionsApi.pausePromotion).toHaveBeenCalledWith(9, "ข้อมูลโค้ดไม่ถูกต้อง: แก้ส่วนลด", true));
  });

  it("reorders the home strip with the arrow buttons and saves it", async () => {
    const second = { ...code, id: 2, code: "FREESHIP", homeSort: 1 };
    vi.mocked(promotionsApi.getAllPlatformPromotions).mockResolvedValue([code, second]);
    const user = userEvent.setup();
    renderWithProviders(<AdminPromotionsPage />, { route: "/admin/promotions" });
    await user.click(await screen.findByRole("button", { name: "จัดลำดับหน้าแรก" }));
    await user.click(screen.getByRole("button", { name: "เลื่อน FREESHIP ขึ้น" }));
    await user.click(screen.getByRole("button", { name: "บันทึกลำดับ" }));
    await waitFor(() => expect(promotionsApi.setHomeOrder).toHaveBeenCalledWith([2, 1]));
  });
});
