import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminPromotionFormPage } from "@/features/admin/pages/AdminPromotionFormPage";
import * as promotionsApi from "@/features/admin/promotions.api";
import type { AdminPromotion } from "@/features/admin/promotions.types";
import { SellerPromotionForm } from "@/features/seller/promotions/components/SellerPromotionFormDialog";
import { sellerPromotionApi } from "@/features/seller/promotions/promotions.api";
import type { SellerPromotion } from "@/features/seller/promotions/promotions.types";
import { ApiError } from "@/lib/api/errors";
import { createTestQueryClient, render, renderWithProviders, screen, userEvent, waitFor, within } from "@/test/utils";

vi.mock("@/features/admin/promotions.api", () => ({
  getPromotion: vi.fn(),
  createPromotion: vi.fn(),
  updatePromotion: vi.fn(),
  getAllPlatformPromotions: vi.fn(),
  getPromotionCategories: vi.fn(),
}));
vi.mock("@/features/admin/catalog.api", () => ({
  getGames: vi.fn().mockResolvedValue([{ id: 3, name: "Pokemon" }]),
}));
vi.mock("@/features/seller/promotions/promotions.api", () => ({
  sellerPromotionApi: { create: vi.fn(), update: vi.fn() },
}));

const NOW = new Date("2026-11-09T05:00:00.000Z");

const adminExisting: AdminPromotion = {
  id: 1,
  code: "PEGASUS10",
  name: "Welcome",
  description: "note",
  ownerType: "PLATFORM",
  owner: null,
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscount: 200,
  minSpend: 500,
  scopeType: "GAME",
  scopeIds: [3],
  visibility: "PUBLIC",
  newBuyerOnly: true,
  usageLimitTotal: 500,
  usageLimitPerUser: 2,
  usedCount: 0,
  claimable: true,
  claimRequired: true,
  claimLimit: 800,
  claimedCount: 0,
  featuredOnHome: true,
  homeSort: 1,
  startsAt: "2026-12-01T00:00:00.000Z",
  endsAt: "2026-12-31T00:00:00.000Z",
  status: "SCHEDULED",
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

const sellerExisting: SellerPromotion = {
  id: 7,
  code: "SHOP100",
  name: "ลูกค้าประจำ",
  description: "note",
  discountType: "FIXED",
  discountValue: 100,
  maxDiscount: null,
  minSpend: 1000,
  visibility: "PUBLIC",
  newBuyerOnly: false,
  usageLimitTotal: 50,
  usageLimitPerUser: 1,
  usedCount: 0,
  claimable: true,
  claimLimit: 100,
  claimedCount: 0,
  discountTotal: 0,
  startsAt: "2026-12-01T00:00:00.000Z",
  endsAt: "2026-12-31T00:00:00.000Z",
  status: "SCHEDULED",
  pausedAt: null,
  pausedBy: null,
  pauseReason: null,
  createdAt: "2026-10-01T00:00:00Z",
};

function renderAdmin(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/admin/promotions/new", element: <AdminPromotionFormPage /> },
      { path: "/admin/promotions/:id/edit", element: <AdminPromotionFormPage /> },
      { path: "/admin/promotions", element: <div>รายการโค้ด</div> },
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

/** รอ dialog ย้าย focus เข้ามาก่อน ไม่งั้น focus ที่มาทีหลังจะแย่งตัวอักษรระหว่าง `user.type` */
async function renderSeller(existing?: SellerPromotion, verified = true) {
  const onClose = vi.fn();
  renderWithProviders(<SellerPromotionForm existing={existing} open verified={verified} onClose={onClose} />);
  await waitFor(() => expect(document.activeElement).not.toBe(document.body));
  return { user: userEvent.setup(), onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.mocked(promotionsApi.getAllPlatformPromotions).mockResolvedValue([]);
  vi.mocked(promotionsApi.getPromotionCategories).mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("admin promotion form — payload", () => {
  it("sends every field of a new code", async () => {
    vi.mocked(promotionsApi.createPromotion).mockResolvedValue(adminExisting);
    const user = renderAdmin("/admin/promotions/new");
    await user.type(screen.getByRole("textbox", { name: "รหัสโค้ด" }), "new-code 10");
    await user.type(screen.getByRole("textbox", { name: "ชื่อแคมเปญ" }), "  Year end  ");
    await waitFor(() => expect(screen.getByRole("spinbutton", { name: "ลำดับบนหน้าแรก" })).toHaveValue(1));
    await user.click(screen.getByRole("button", { name: "บันทึกและเปิดใช้" }));
    await user.click(await screen.findByRole("button", { name: "เปิดใช้โค้ด" }));

    const start = new Date(NOW);
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 29);
    end.setHours(23, 59, 0, 0);
    await waitFor(() => expect(promotionsApi.createPromotion).toHaveBeenCalledTimes(1));
    expect(vi.mocked(promotionsApi.createPromotion).mock.calls[0][0]).toEqual({
      code: "NEWCODE10",
      name: "Year end",
      description: null,
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
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      claimable: true,
      claimRequired: false,
      claimLimit: 800,
      featuredOnHome: true,
      homeSort: 0,
    });
  });

  it("sends every field when editing, and clears the cap of a fixed discount", async () => {
    vi.mocked(promotionsApi.getPromotion).mockResolvedValue(adminExisting);
    vi.mocked(promotionsApi.updatePromotion).mockResolvedValue(adminExisting);
    const user = renderAdmin("/admin/promotions/1/edit");
    await user.click(await screen.findByRole("radio", { name: "จำนวนเงิน" }));
    await user.click(screen.getByRole("button", { name: "บันทึก" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "บันทึก" }));

    await waitFor(() => expect(promotionsApi.updatePromotion).toHaveBeenCalledTimes(1));
    expect(vi.mocked(promotionsApi.updatePromotion).mock.calls[0]).toEqual([
      1,
      {
        code: "PEGASUS10",
        name: "Welcome",
        description: "note",
        discountType: "FIXED",
        discountValue: 10,
        maxDiscount: null,
        minSpend: 500,
        scopeType: "GAME",
        scopeIds: [3],
        visibility: "PUBLIC",
        newBuyerOnly: true,
        usageLimitTotal: 500,
        usageLimitPerUser: 2,
        startsAt: "2026-12-01T00:00:00.000Z",
        endsAt: "2026-12-31T00:00:00.000Z",
        claimable: true,
        claimRequired: true,
        claimLimit: 800,
        featuredOnHome: true,
        homeSort: 1,
      },
    ]);
  });
});

describe("admin promotion form — errors", () => {
  it("refuses a percent over the cap", async () => {
    const user = renderAdmin("/admin/promotions/new");
    const value = screen.getByRole("spinbutton", { name: "มูลค่าส่วนลด" });
    await user.clear(value);
    await user.type(value, "95");
    await user.click(screen.getByRole("button", { name: "บันทึกและเปิดใช้" }));
    expect(await screen.findByText("เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90")).toBeInTheDocument();
    expect(promotionsApi.createPromotion).not.toHaveBeenCalled();
  });

  it("refuses an end date before the start", async () => {
    vi.mocked(promotionsApi.getPromotion).mockResolvedValue({
      ...adminExisting,
      endsAt: "2026-11-30T00:00:00.000Z",
    });
    const user = renderAdmin("/admin/promotions/1/edit");
    await screen.findByRole("textbox", { name: "รหัสโค้ด" });
    await user.click(screen.getByRole("button", { name: "บันทึก" }));
    expect(await screen.findByText("วันสิ้นสุดต้องหลังวันเริ่ม")).toBeInTheDocument();
  });
});

describe("seller promotion form — payload", () => {
  it("sends every field of a new code", async () => {
    vi.mocked(sellerPromotionApi.create).mockResolvedValue(sellerExisting);
    const { user, onClose } = await renderSeller();
    await user.type(screen.getByRole("textbox", { name: "รหัสโค้ด" }), "shop50");
    await user.type(screen.getByRole("textbox", { name: "ชื่อที่ลูกค้าเห็น" }), "ลูกค้าใหม่");
    await user.click(screen.getByRole("button", { name: "สร้างโค้ด" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(vi.mocked(sellerPromotionApi.create).mock.calls[0][0]).toEqual({
      code: "SHOP50",
      name: "ลูกค้าใหม่",
      description: null,
      discountType: "FIXED",
      discountValue: 100,
      maxDiscount: null,
      minSpend: 1000,
      visibility: "PUBLIC",
      newBuyerOnly: false,
      usageLimitTotal: 50,
      usageLimitPerUser: 1,
      claimable: true,
      claimLimit: 100,
      startsAt: NOW.toISOString(),
      endsAt: new Date(NOW.getTime() + 30 * 86_400_000).toISOString(),
    });
  });

  it("sends every field when editing an unused code", async () => {
    vi.mocked(sellerPromotionApi.update).mockResolvedValue(sellerExisting);
    const { user, onClose } = await renderSeller(sellerExisting);
    await user.click(screen.getByRole("button", { name: "ส่วนตัว (พิมพ์เอง)" }));
    await user.click(screen.getByRole("button", { name: "บันทึก" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(vi.mocked(sellerPromotionApi.update).mock.calls[0][0]).toBe(7);
    expect(vi.mocked(sellerPromotionApi.update).mock.calls[0][1]).toEqual({
      code: "SHOP100",
      name: "ลูกค้าประจำ",
      description: "note",
      discountType: "FIXED",
      discountValue: 100,
      maxDiscount: null,
      minSpend: 1000,
      visibility: "PRIVATE",
      newBuyerOnly: false,
      usageLimitTotal: 50,
      usageLimitPerUser: 1,
      claimable: false,
      claimLimit: 100,
      startsAt: "2026-12-01T00:00:00.000Z",
      endsAt: "2026-12-31T00:00:00.000Z",
    });
  });

  it("edits a used code through the locked form", async () => {
    vi.mocked(sellerPromotionApi.update).mockResolvedValue(sellerExisting);
    const { user } = await renderSeller({ ...sellerExisting, usedCount: 4, claimedCount: 8 });
    expect(screen.getByRole("textbox", { name: "รหัสโค้ด" })).toBeDisabled();
    expect(screen.getByRole("spinbutton", { name: "สิทธิ์ต่อคน" })).toBeDisabled();
    const quota = screen.getByRole("spinbutton", { name: "จำนวนสิทธิ์ (≥ 4)" });
    await user.clear(quota);
    await user.type(quota, "80");
    await user.click(screen.getByRole("button", { name: "บันทึก" }));
    await waitFor(() =>
      expect(sellerPromotionApi.update).toHaveBeenCalledWith(7, expect.objectContaining({ usageLimitTotal: 80 })),
    );
  });
});

describe("seller promotion form — errors and states", () => {
  it("shows PROMO_CODE_TAKEN under the code", async () => {
    vi.mocked(sellerPromotionApi.create).mockRejectedValue(
      new ApiError({ status: 409, code: "PROMO_CODE_TAKEN", message: "taken" }),
    );
    const { user, onClose } = await renderSeller();
    await user.type(screen.getByRole("textbox", { name: "รหัสโค้ด" }), "shop50");
    await user.type(screen.getByRole("textbox", { name: "ชื่อที่ลูกค้าเห็น" }), "ลูกค้าใหม่");
    await user.click(screen.getByRole("button", { name: "สร้างโค้ด" }));
    expect(await screen.findByText("โค้ดนี้ถูกใช้แล้วในระบบ (PROMO_CODE_TAKEN)")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("refuses a fixed discount over the minimum spend and an end before the start", async () => {
    const { user } = await renderSeller({ ...sellerExisting, endsAt: "2026-11-30T00:00:00.000Z", discountValue: 2000 });
    await user.click(screen.getByRole("button", { name: "บันทึก" }));
    expect(await screen.findByText("ส่วนลดต้องไม่เกินยอดขั้นต่ำ ฿1,000")).toBeInTheDocument();
    expect(screen.getByText("วันสิ้นสุดต้องหลังวันเริ่ม")).toBeInTheDocument();
    expect(sellerPromotionApi.update).not.toHaveBeenCalled();
  });

  it("disables saving until the shop is verified", async () => {
    await renderSeller(undefined, false);
    expect(screen.getByRole("button", { name: "สร้างโค้ด" })).toBeDisabled();
  });

  it("closes straight away when nothing changed", async () => {
    const { user, onClose } = await renderSeller();
    await user.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("asks before discarding changes", async () => {
    const { user, onClose } = await renderSeller();
    await user.type(screen.getByRole("textbox", { name: "ชื่อที่ลูกค้าเห็น" }), "ร่าง");
    await user.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(await screen.findByText("ทิ้งการแก้ไข?")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "ทิ้งการแก้ไข" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks visibility and claiming once buyers collected the code", async () => {
    await renderSeller({ ...sellerExisting, claimedCount: 8 });
    expect(screen.getByRole("switch", { name: "ให้ลูกค้ากดเก็บที่หน้าร้าน" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("มีลูกค้าเก็บโค้ดแล้ว จึงเปลี่ยนการกดเก็บไม่ได้")).toBeInTheDocument();
  });
});
