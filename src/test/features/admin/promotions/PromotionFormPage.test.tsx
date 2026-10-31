import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createTestQueryClient } from "@/test/utils";
import { AdminPromotionFormPage } from "@/features/admin/promotions/PromotionFormPage";
import { adminPromotionApi } from "@/features/admin/promotions/api";
import type { AdminPromotion } from "@/features/admin/promotions/types";

vi.mock("@/features/admin/promotions/api", () => ({ adminPromotionApi: { get: vi.fn() } }));
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
    expect(screen.getByRole("checkbox", { name: "ต้องเก็บก่อนใช้" })).toBeDisabled();
  });
});
