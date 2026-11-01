import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminPromotionFormPage } from "@/features/admin/pages/AdminPromotionFormPage";
import { AdminPromotionsPage } from "@/features/admin/pages/AdminPromotionsPage";
import * as promotionsApi from "@/features/admin/promotions.api";
import type { AdminPromotion } from "@/features/admin/promotions.types";
import { ApiError } from "@/lib/api/errors";
import { createTestQueryClient, render, screen, userEvent, waitFor, within } from "@/test/utils";

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
  endPromotion: vi.fn(),
  getAllPlatformPromotions: vi.fn(),
  getPromotionCategories: vi.fn(),
}));
vi.mock("@/features/admin/catalog.api", () => ({ getGames: vi.fn().mockResolvedValue([]) }));

const used: AdminPromotion = {
  id: 1,
  code: "PEGASUS10",
  name: "Welcome",
  description: null,
  ownerType: "PLATFORM",
  owner: null,
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscount: 200,
  minSpend: 500,
  scopeType: "ALL",
  scopeIds: [],
  visibility: "PUBLIC",
  newBuyerOnly: false,
  usageLimitTotal: 500,
  usageLimitPerUser: 1,
  usedCount: 12,
  claimable: true,
  claimRequired: true,
  claimLimit: 500,
  claimedCount: 30,
  featuredOnHome: true,
  homeSort: 1,
  startsAt: "2026-10-01T00:00:00Z",
  endsAt: "2026-12-01T00:00:00Z",
  status: "ACTIVE",
  pausedAt: null,
  pauseReason: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  createdBy: null,
  pausedBy: null,
  discountTotal: 0,
  salesTotal: 0,
  reservedOrders: 0,
};

function renderAt(path: string, extra: RouteObject[] = [{ path: "/admin/promotions", element: <div>รายการโค้ด</div> }]) {
  const router = createMemoryRouter(
    [
      { path: "/admin/promotions/new", element: <AdminPromotionFormPage /> },
      { path: "/admin/promotions/:id/edit", element: <AdminPromotionFormPage /> },
      ...extra,
    ],
    { initialEntries: [path] },
  );
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

describe("AdminPromotionFormPage — editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(promotionsApi.getAllPlatformPromotions).mockResolvedValue([]);
    vi.mocked(promotionsApi.getPromotion).mockResolvedValue(used);
  });

  it("locks identity and discount after use while keeping the end date and higher quotas editable", async () => {
    renderAt("/admin/promotions/1/edit");
    expect(await screen.findByRole("textbox", { name: "รหัสโค้ด" })).toBeDisabled();
    expect(screen.getByRole("spinbutton", { name: "มูลค่าส่วนลด" })).toBeDisabled();
    expect(screen.getByLabelText("เริ่มใช้ได้")).toBeDisabled();
    expect(screen.getByLabelText("สิ้นสุด")).toBeEnabled();
    expect(screen.getByText("สิ้นสุด (ยืดได้เท่านั้น)")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "จำนวนสิทธิ์ทั้งหมด" })).toBeEnabled();
    expect(screen.getByText("จำนวนสิทธิ์ทั้งหมด (เพิ่มได้เท่านั้น ≥ 500)")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "ต้องเก็บก่อนใช้" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByLabelText("ล็อก").length).toBeGreaterThan(0);
  });

  it("does not open the editor for a shop's code", async () => {
    vi.mocked(promotionsApi.getPromotion).mockResolvedValue({ ...used, ownerType: "SELLER" });
    renderAt("/admin/promotions/1/edit");
    expect(await screen.findByText("โค้ดร้านค้าแก้ไขโดยแอดมินไม่ได้")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "บันทึก" })).not.toBeInTheDocument();
  });

  it("shows readable old → new values and the new budget before saving", async () => {
    vi.mocked(promotionsApi.updatePromotion).mockResolvedValue(used);
    const user = renderAt("/admin/promotions/1/edit");
    const limit = await screen.findByRole("spinbutton", { name: "จำนวนสิทธิ์ทั้งหมด" });
    await user.clear(limit);
    await user.type(limit, "800");
    await user.click(screen.getByRole("button", { name: "บันทึก" }));
    const dialog = await screen.findByRole("alertdialog", { name: "บันทึกการเปลี่ยนแปลง?" });
    expect(within(dialog).getByText("จำนวนสิทธิ์ใช้")).toBeInTheDocument();
    expect(within(dialog).getByText("800")).toBeInTheDocument();
    expect(within(dialog).getByText("฿160,000")).toBeInTheDocument();
    expect(within(dialog).getByText("บันทึกใน Activity Log")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "บันทึก" }));
    await waitFor(() =>
      expect(promotionsApi.updatePromotion).toHaveBeenCalledWith(1, expect.objectContaining({ usageLimitTotal: 800 })),
    );
  });

  it("does not let a used code lose quota", async () => {
    const user = renderAt("/admin/promotions/1/edit");
    const limit = await screen.findByRole("spinbutton", { name: "จำนวนสิทธิ์ทั้งหมด" });
    await user.clear(limit);
    await user.type(limit, "100");
    await user.click(screen.getByRole("button", { name: "บันทึก" }));
    expect(await screen.findByText("หลังมีการใช้โค้ดแล้ว เพิ่มจำนวนสิทธิ์ได้อย่างเดียว")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});

describe("AdminPromotionFormPage — creating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(promotionsApi.getAllPlatformPromotions).mockResolvedValue([]);
  });

  it("updates the calculation and campaign budget as the discount changes", async () => {
    const user = renderAt("/admin/promotions/new");
    expect(screen.getByText("฿100,000")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "จำนวนเงิน" }));
    const value = screen.getByRole("spinbutton", { name: "มูลค่าส่วนลด" });
    await user.clear(value);
    await user.type(value, "150");
    expect(screen.getByText("− ฿150")).toBeInTheDocument();
    expect(screen.getByText("฿75,000")).toBeInTheDocument();
  });

  it("budgets free shipping from the cap it shows", async () => {
    const user = renderAt("/admin/promotions/new");
    await user.click(screen.getByRole("radio", { name: "ส่งฟรี" }));
    expect(screen.getByText(/500 สิทธิ์ × ส่วนลดสูงสุด ฿200/)).toBeInTheDocument();
    expect(screen.getByText("฿100,000")).toBeInTheDocument();
  });

  it("clears claim-only switches for private codes and sends consistent values", async () => {
    vi.mocked(promotionsApi.createPromotion).mockResolvedValue({ ...used, id: 2 });
    const user = renderAt("/admin/promotions/new");
    await user.click(screen.getByRole("radio", { name: "ส่วนตัว" }));
    expect(screen.getByRole("switch", { name: "ให้ผู้ซื้อกดเก็บได้" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "แสดงบนหน้าแรก" })).toHaveAttribute("aria-disabled", "true");
    await user.type(screen.getByRole("textbox", { name: "รหัสโค้ด" }), "private10");
    await user.type(screen.getByRole("textbox", { name: "ชื่อแคมเปญ" }), "Private offer");
    await user.click(screen.getByRole("button", { name: "บันทึกและเปิดใช้" }));
    await user.click(await screen.findByRole("button", { name: "เปิดใช้โค้ด" }));
    await waitFor(() =>
      expect(promotionsApi.createPromotion).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "PRIVATE10",
          visibility: "PRIVATE",
          claimable: false,
          claimLimit: null,
          claimRequired: false,
          featuredOnHome: false,
          homeSort: null,
        }),
      ),
    );
  });

  it("shows PROMO_CODE_TAKEN under the code field", async () => {
    vi.mocked(promotionsApi.createPromotion).mockRejectedValue(
      new ApiError({ status: 409, code: "PROMO_CODE_TAKEN", message: "taken" }),
    );
    const user = renderAt("/admin/promotions/new");
    await user.type(screen.getByRole("textbox", { name: "รหัสโค้ด" }), "PEGASUS10");
    await user.type(screen.getByRole("textbox", { name: "ชื่อแคมเปญ" }), "Weekend");
    await user.click(screen.getByRole("button", { name: "บันทึกและเปิดใช้" }));
    await user.click(await screen.findByRole("button", { name: "เปิดใช้โค้ด" }));
    expect(await screen.findByText(/PROMO_CODE_TAKEN/)).toBeInTheDocument();
  });

  it("confirms the full offer, creates it at the end of the home strip, and lists it", async () => {
    let items: AdminPromotion[] = [];
    vi.mocked(promotionsApi.getAllPlatformPromotions).mockResolvedValue([{ ...used, id: 5, status: "ACTIVE", homeSort: 0 }]);
    vi.mocked(promotionsApi.getPromotions).mockImplementation(async () => ({
      page: { items, page: 0, size: 8, totalItems: items.length, totalPages: 1 },
      statusCounts: { ACTIVE: 0, SCHEDULED: items.length, PAUSED: 0, EXPIRED: 0, USED_UP: 0 },
    }));
    vi.mocked(promotionsApi.getPromotionSummary).mockResolvedValue({
      activePlatformCodes: 0,
      activeSellerCodes: 0,
      redemptions30d: 0,
      redemptionsChangePercent: null,
      claims30d: 0,
      platformDiscountCost30d: 0,
      salesWithCodes30d: 0,
      gmv30d: 0,
      paidOrders30d: 0,
      ordersWithCodes30d: 0,
    });
    vi.mocked(promotionsApi.getPromotionCategories).mockResolvedValue([]);
    vi.mocked(promotionsApi.createPromotion).mockImplementation(async (input) => {
      const created = { ...used, ...input, id: 2, usedCount: 0, claimedCount: 0, status: "SCHEDULED" as const };
      items = [created];
      return created;
    });
    const user = renderAt("/admin/promotions/new", [{ path: "/admin/promotions", element: <AdminPromotionsPage /> }]);
    await user.type(screen.getByRole("textbox", { name: "รหัสโค้ด" }), "PEGASUS20");
    await user.type(screen.getByRole("textbox", { name: "ชื่อแคมเปญ" }), "Weekend");
    expect(screen.getByRole("switch", { name: "แสดงบนหน้าแรก" })).toBeChecked();
    expect(await screen.findByDisplayValue("2")).toBe(screen.getByRole("spinbutton", { name: "ลำดับบนหน้าแรก" }));
    await user.click(screen.getByRole("button", { name: "บันทึกและเปิดใช้" }));
    const dialog = await screen.findByRole("alertdialog", { name: "เปิดใช้โค้ด PEGASUS20?" });
    expect(within(dialog).getByText("งบสูงสุด (500 × ฿200)")).toBeInTheDocument();
    expect(within(dialog).getByText("800 ใบ · หน้าแรก ลำดับ 2")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "เปิดใช้โค้ด" }));
    await waitFor(() =>
      expect(promotionsApi.createPromotion).toHaveBeenCalledWith(expect.objectContaining({ code: "PEGASUS20", homeSort: 1 })),
    );
    expect(await screen.findByRole("row", { name: /PEGASUS20/ })).toBeInTheDocument();
  });

  it("asks before leaving a form with unsaved changes", async () => {
    const user = renderAt("/admin/promotions/new");
    await user.type(screen.getByRole("textbox", { name: "ชื่อแคมเปญ" }), "Draft");
    await user.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(await screen.findByText("ออกจากหน้านี้?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "อยู่ต่อ" }));
    expect(screen.getByRole("textbox", { name: "ชื่อแคมเปญ" })).toHaveValue("Draft");
    await user.click(screen.getByRole("button", { name: "ยกเลิก" }));
    await user.click(screen.getByRole("button", { name: "ออกโดยไม่บันทึก" }));
    expect(await screen.findByText("รายการโค้ด")).toBeInTheDocument();
  });
});
