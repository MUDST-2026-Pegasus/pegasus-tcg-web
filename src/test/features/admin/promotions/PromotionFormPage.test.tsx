import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createTestQueryClient } from "@/test/utils";
import { AdminPromotionFormPage } from "@/features/admin/promotions/PromotionFormPage";
import { AdminPromotionsPage } from "@/features/admin/promotions/PromotionsPage";
import { adminPromotionApi } from "@/features/admin/promotions/api";
import type { AdminPromotion } from "@/features/admin/promotions/types";

vi.mock("@/features/admin/promotions/api", () => ({ adminPromotionApi: { get: vi.fn(), create: vi.fn(), list: vi.fn(), summary: vi.fn(), redemptions: vi.fn() } }));
vi.mock("@/features/admin/catalog.api", () => ({ getGames: vi.fn().mockResolvedValue([]) }));

const used: AdminPromotion = {
  id: 1, code: "PEGASUS10", name: "Welcome", description: null, ownerType: "PLATFORM", owner: null,
  discountType: "PERCENT", discountValue: 10, maxDiscount: 200, minSpend: 500,
  scopeType: "ALL", scopeIds: [], visibility: "PUBLIC", newBuyerOnly: false,
  usageLimitTotal: 500, usageLimitPerUser: 1, usedCount: 12, claimable: true,
  claimRequired: true, claimLimit: 500, claimedCount: 30, featuredOnHome: true,
  homeSort: 1, startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-12-01T00:00:00Z",
  status: "ACTIVE", pausedAt: null, pauseReason: null, createdAt: "2026-10-01T00:00:00Z",
};

describe("admin promotion editing locks", () => {
  it("locks identity and discount after use while keeping end date and higher quotas editable", async () => {
    vi.mocked(adminPromotionApi.get).mockResolvedValue(used);
    const router = createMemoryRouter([
      { path: "/admin/promotions/:id/edit", element: <AdminPromotionFormPage /> },
      { path: "/admin/promotions", element: <div>List</div> },
    ], { initialEntries: ["/admin/promotions/1/edit"] });
    render(<QueryClientProvider client={createTestQueryClient()}><RouterProvider router={router} /></QueryClientProvider>);
    expect(await screen.findByRole("textbox", { name: "รหัสโค้ด" })).toBeDisabled();
    expect(screen.getByRole("spinbutton", { name: "มูลค่าส่วนลด" })).toBeDisabled();
    expect(screen.getByLabelText("เริ่มใช้ได้")).toBeDisabled();
    expect(screen.getByLabelText("สิ้นสุด")).toBeEnabled();
    expect(screen.getByRole("spinbutton", { name: "จำนวนสิทธิ์ทั้งหมด" })).toBeEnabled();
    expect(screen.getByRole("switch", { name: "ต้องเก็บก่อนใช้" })).toHaveAttribute("aria-disabled", "true");
  });

  it("does not open the editor for a seller-owned code", async () => {
    vi.mocked(adminPromotionApi.get).mockResolvedValue({ ...used, ownerType: "SELLER" });
    const router = createMemoryRouter([{ path: "/admin/promotions/:id/edit", element: <AdminPromotionFormPage /> }], { initialEntries: ["/admin/promotions/1/edit"] });
    render(<QueryClientProvider client={createTestQueryClient()}><RouterProvider router={router} /></QueryClientProvider>);
    expect(await screen.findByText("โค้ดร้านค้าแก้ไขโดยแอดมินไม่ได้")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "บันทึก" })).not.toBeInTheDocument();
  });
});

describe("admin promotion create flow", () => {
  it("updates the calculation and campaign budget when the discount changes", async () => {
    const router = createMemoryRouter([{ path: "/admin/promotions/new", element: <AdminPromotionFormPage /> }], { initialEntries: ["/admin/promotions/new"] });
    const user = userEvent.setup();
    render(<QueryClientProvider client={createTestQueryClient()}><RouterProvider router={router} /></QueryClientProvider>);

    expect(screen.getByText("฿100,000")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /จำนวนเงิน/ }));
    await user.clear(screen.getByRole("spinbutton", { name: "มูลค่าส่วนลด" }));
    await user.type(screen.getByRole("spinbutton", { name: "มูลค่าส่วนลด" }), "150");

    expect(screen.getByText("− ฿150")).toBeInTheDocument();
    expect(screen.getByText("฿75,000")).toBeInTheDocument();
  });

  it("clears claim-only switches for private codes and sends consistent values", async () => {
    vi.mocked(adminPromotionApi.create).mockResolvedValue({ ...used, id: 2, status: "SCHEDULED" });
    const router = createMemoryRouter([
      { path: "/admin/promotions/new", element: <AdminPromotionFormPage /> },
      { path: "/admin/promotions", element: <div>List</div> },
    ], { initialEntries: ["/admin/promotions/new"] });
    const user = userEvent.setup();
    render(<QueryClientProvider client={createTestQueryClient()}><RouterProvider router={router} /></QueryClientProvider>);

    await user.click(screen.getByRole("radio", { name: /ส่วนตัว/ }));
    expect(screen.getByRole("switch", { name: "ให้ผู้ซื้อกดเก็บได้" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "แสดงบนหน้าแรก" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("switch", { name: "ต้องเก็บก่อนใช้" })).toHaveAttribute("aria-checked", "false");
    await user.type(screen.getByRole("textbox", { name: "รหัสโค้ด" }), "PRIVATE10");
    await user.type(screen.getByRole("textbox", { name: "ชื่อแคมเปญ" }), "Private offer");
    await user.click(screen.getByRole("button", { name: "บันทึกและเปิดใช้" }));
    await user.click(await screen.findByRole("button", { name: "เปิดใช้โค้ด" }));

    await waitFor(() => expect(adminPromotionApi.create).toHaveBeenCalledWith(expect.objectContaining({
      code: "PRIVATE10", visibility: "PRIVATE", claimable: false, claimRequired: false, featuredOnHome: false, homeSort: null,
    })));
  });

  it("confirms the full offer, creates it, and shows the new row after navigation", async () => {
    let items: AdminPromotion[] = [];
    vi.mocked(adminPromotionApi.list).mockImplementation(async () => ({ page: { items, page: 0, size: 20, totalItems: items.length, totalPages: 1 }, statusCounts: { ACTIVE: items.length, SCHEDULED: 0, PAUSED: 0, EXPIRED: 0, USED_UP: 0 } }));
    vi.mocked(adminPromotionApi.summary).mockResolvedValue({ activePlatformCodes: 0, activeSellerCodes: 0, redemptions30d: 0, redemptionsChangePercent: null, claims30d: 0, platformDiscountCost30d: 0, salesWithCodes30d: 0 });
    vi.mocked(adminPromotionApi.create).mockImplementation(async (input) => { const created = { ...used, ...input, id: 2, usedCount: 0, claimedCount: 0, status: "SCHEDULED" as const }; items = [created]; return created; });
    const router = createMemoryRouter([
      { path: "/admin/promotions/new", element: <AdminPromotionFormPage /> },
      { path: "/admin/promotions", element: <AdminPromotionsPage /> },
    ], { initialEntries: ["/admin/promotions/new"] });
    const user = userEvent.setup();
    render(<QueryClientProvider client={createTestQueryClient()}><RouterProvider router={router} /></QueryClientProvider>);
    await user.type(screen.getByRole("textbox", { name: "รหัสโค้ด" }), "PEGASUS20");
    await user.type(screen.getByRole("textbox", { name: "ชื่อแคมเปญ" }), "Weekend");
    expect(screen.getByRole("switch", { name: "แสดงบนหน้าแรก" })).toBeChecked();
    expect(screen.getByRole("spinbutton", { name: /ลำดับบนหน้าแรก/ })).toHaveValue(1);
    await user.click(screen.getByRole("button", { name: "บันทึกและเปิดใช้" }));
    expect(await screen.findByText("เปิดใช้โค้ด PEGASUS20?")).toBeInTheDocument();
    expect(screen.getByText(/งบสูงสุด \(/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "เปิดใช้โค้ด" }));
    await waitFor(() => expect(adminPromotionApi.create).toHaveBeenCalledWith(expect.objectContaining({ code: "PEGASUS20", homeSort: 0 })));
    await waitFor(() => expect(screen.getByRole("row", { name: /PEGASUS20/ })).toBeInTheDocument());
  });

  it("asks before leaving a form with unsaved changes", async () => {
    const router = createMemoryRouter([
      { path: "/admin/promotions/new", element: <AdminPromotionFormPage /> },
      { path: "/admin/promotions", element: <div>รายการโค้ด</div> },
    ], { initialEntries: ["/admin/promotions/new"] });
    const user = userEvent.setup();
    render(<QueryClientProvider client={createTestQueryClient()}><RouterProvider router={router} /></QueryClientProvider>);
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
