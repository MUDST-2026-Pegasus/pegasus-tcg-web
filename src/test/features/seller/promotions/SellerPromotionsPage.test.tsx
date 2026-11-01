import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/utils";
import { SellerPromotionsPage } from "@/features/seller/promotions/SellerPromotionsPage";
import { sellerPromotionApi } from "@/features/seller/promotions/promotions.api";
import { useSellerProfile } from "@/features/seller/shared/seller.queries";
import type { SellerPromotion } from "@/features/seller/promotions/promotions.types";

vi.mock("@/features/seller/shared/seller.queries", () => ({ useSellerProfile: vi.fn() }));
vi.mock("@/features/seller/promotions/promotions.api", () => ({ sellerPromotionApi: { list: vi.fn(), summary: vi.fn(), create: vi.fn(), update: vi.fn(), pause: vi.fn(), resume: vi.fn(), remove: vi.fn(), redemptions: vi.fn() } }));

const code: SellerPromotion = {
  id: 7, code: "SHOP100", name: "ลูกค้าประจำ", description: null, discountType: "FIXED", discountValue: 100,
  maxDiscount: null, minSpend: 1000, visibility: "PUBLIC", newBuyerOnly: false, usageLimitTotal: 50,
  usageLimitPerUser: 1, usedCount: 4, claimable: true, claimLimit: 100, claimedCount: 8, discountTotal: 400,
  startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-12-31T00:00:00Z", status: "ACTIVE", pausedAt: null,
  pausedBy: null, pauseReason: null, createdAt: "2026-10-01T00:00:00Z",
};

describe("SellerPromotionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSellerProfile).mockReturnValue({ data: { status: "VERIFIED" }, isPending: false } as ReturnType<typeof useSellerProfile>);
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({ page: { items: [code], page: 0, size: 20, totalItems: 1, totalPages: 1 }, statusCounts: { ACTIVE: 1, SCHEDULED: 0, PAUSED: 0, EXPIRED: 0, USED_UP: 0 } });
    vi.mocked(sellerPromotionApi.summary).mockResolvedValue({ activeCodes: 1, redemptions30d: 4, shopDiscount30d: 400, salesWithCodes30d: 4000 });
    vi.mocked(sellerPromotionApi.redemptions).mockResolvedValue({ items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 });
  });

  it("shows the seller ticket and active actions", async () => {
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    expect(await screen.findByText("SHOP100")).toBeInTheDocument();
    expect(screen.getByText("ใช้แล้ว 4 / 50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "หยุดชั่วคราว" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ลบ" })).not.toBeInTheDocument();
  });

  it("deletes an unused, unclaimed code and refreshes the list", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({ page: { items: [{ ...code, usedCount: 0, claimedCount: 0 }], page: 0, size: 20, totalItems: 1, totalPages: 1 }, statusCounts: { ACTIVE: 1, SCHEDULED: 0, PAUSED: 0, EXPIRED: 0, USED_UP: 0 } });
    vi.mocked(sellerPromotionApi.remove).mockResolvedValue(undefined);
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    await screen.findByText("SHOP100");
    await user.click(screen.getByRole("button", { name: "ลบ" }));
    expect(screen.getByText("ลบโค้ด SHOP100?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ลบโค้ด" }));
    expect(sellerPromotionApi.remove).toHaveBeenCalledWith(code.id);
  });

  it("shows resume for a seller paused code and no delete action", async () => {
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({
      page: { items: [{ ...code, status: "PAUSED", pausedBy: "SELLER" }],
        page: 0, size: 20, totalItems: 1, totalPages: 1 },
      statusCounts: { ACTIVE: 0, SCHEDULED: 0, PAUSED: 1, EXPIRED: 0, USED_UP: 0 },
    });
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions?status=PAUSED" });
    await screen.findByText("SHOP100");
    expect(screen.getByRole("button", { name: "เปิดใช้อีกครั้ง" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ลบ" })).not.toBeInTheDocument();
  });

  it("shows delete for a scheduled code and not pause", async () => {
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({
      page: { items: [{ ...code, status: "SCHEDULED" }],
        page: 0, size: 20, totalItems: 1, totalPages: 1 },
      statusCounts: { ACTIVE: 0, SCHEDULED: 1, PAUSED: 0, EXPIRED: 0, USED_UP: 0 },
    });
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    await screen.findByText("SHOP100");
    expect(screen.getByRole("button", { name: "ลบ" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "หยุดชั่วคราว" })).not.toBeInTheDocument();
  });

  it("explains a server PROMO_IN_USE response before trying another action", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({
      page: { items: [{ ...code, usedCount: 0, claimedCount: 0 }],
        page: 0, size: 20, totalItems: 1, totalPages: 1 },
      statusCounts: { ACTIVE: 1, SCHEDULED: 0, PAUSED: 0, EXPIRED: 0, USED_UP: 0 },
    });
    vi.mocked(sellerPromotionApi.remove).mockRejectedValue(new ApiError({
      status: 409, code: "PROMO_IN_USE", message: "Already used",
    }));
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    await screen.findByText("SHOP100");
    await user.click(screen.getByRole("button", { name: "ลบ" }));
    await user.click(screen.getByRole("button", { name: "ลบโค้ด" }));
    expect(await screen.findByText("ลบโค้ด SHOP100 ไม่ได้")).toBeInTheDocument();
    expect(screen.getByText(/ใบเสร็จและรายได้ย้อนหลัง/)).toBeInTheDocument();
  });

  it("prevents unverified sellers from creating codes", async () => {
    vi.mocked(useSellerProfile).mockReturnValue({ data: { status: "PENDING" }, isPending: false } as ReturnType<typeof useSellerProfile>);
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    expect(await screen.findByText("SHOP100")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "สร้างโค้ดร้าน" })).toBeDisabled();

  });

  it("does not offer resume when staff paused the code", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({ page: { items: [{ ...code, status: "PAUSED", pausedBy: "ADMIN", pauseReason: "ตรวจสอบการใช้งาน" }], page: 0, size: 20, totalItems: 1, totalPages: 1 }, statusCounts: { ACTIVE: 0, SCHEDULED: 0, PAUSED: 1, EXPIRED: 0, USED_UP: 0 } });
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    expect(await screen.findByText("SHOP100")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "เปิดใช้อีกครั้ง" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ติดต่อทีมงาน" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ติดต่อทีมงาน" }));
    expect(screen.getByText(/อ้างอิง #PRM-7/)).toBeInTheDocument();
  });

  it("shows reserved orders before pausing", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({ page: { items: [{ ...code, pendingOrderCount: 2 }], page: 0, size: 20, totalItems: 1, totalPages: 1 }, statusCounts: { ACTIVE: 1, SCHEDULED: 0, PAUSED: 0, EXPIRED: 0, USED_UP: 0 } });
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    await screen.findByText("SHOP100");
    await user.click(screen.getByRole("button", { name: "หยุดชั่วคราว" }));
    expect(screen.getByText("ออเดอร์รอชำระที่ใช้โค้ดนี้")).toBeInTheDocument();
    expect(screen.getByText("2 รายการ")).toBeInTheDocument();
  });

  it("shows staff support when resume returns PROMO_PAUSED", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({
      page: { items: [{ ...code, status: "PAUSED", pausedBy: "SELLER" }],
        page: 0, size: 20, totalItems: 1, totalPages: 1 },
      statusCounts: { ACTIVE: 0, SCHEDULED: 0, PAUSED: 1, EXPIRED: 0, USED_UP: 0 },
    });
    vi.mocked(sellerPromotionApi.resume).mockRejectedValue(new ApiError({
      status: 409, code: "PROMO_PAUSED", message: "Staff paused code",
    }));
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    await screen.findByText("SHOP100");
    await user.click(screen.getByRole("button", { name: "เปิดใช้อีกครั้ง" }));
    await user.click(screen.getByRole("button", { name: "เปิดใช้โค้ด" }));
    expect(await screen.findByText("ทีมงานหยุดโค้ด SHOP100")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ติดต่อทีมงาน" })).toBeInTheDocument();
  });

  it("links a redemption to its order detail", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.redemptions).mockResolvedValue({ items: [{ id: 9, sellerOrderId: 42, sellerOrderNumber: "SO-42", buyerDisplayName: "Somchai", amount: 100, status: "CONSUMED", createdAt: "2026-11-01T00:00:00Z" }], page: 0, size: 20, totalItems: 1, totalPages: 1 });
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    await screen.findByText("SHOP100");
    await user.click(screen.getByRole("button", { name: "ใช้แล้ว 4 / 50" }));
    expect(await screen.findByRole("link", { name: "SO-42" })).toHaveAttribute("href", "/seller/orders/42");
    expect(screen.getAllByText("ใช้แล้ว").length).toBeGreaterThan(0);
    expect(screen.getByText("S***i")).toBeInTheDocument();
  });

  it("forgets a PROMO_PAUSED answer when another action opens", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({
      page: { items: [
        { ...code, status: "PAUSED", pausedBy: "SELLER" },
        { ...code, id: 8, code: "FRESH10", usedCount: 0, claimedCount: 0 },
      ], page: 0, size: 20, totalItems: 2, totalPages: 1 },
      statusCounts: { ACTIVE: 1, SCHEDULED: 0, PAUSED: 1, EXPIRED: 0, USED_UP: 0 },
    });
    vi.mocked(sellerPromotionApi.resume).mockRejectedValue(new ApiError({
      status: 409, code: "PROMO_PAUSED", message: "Staff paused code",
    }));
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    await screen.findByText("FRESH10");
    await user.click(screen.getByRole("button", { name: "เปิดใช้อีกครั้ง" }));
    await user.click(screen.getByRole("button", { name: "เปิดใช้โค้ด" }));
    await user.click(await screen.findByRole("button", { name: "ปิด" }));
    await user.click(screen.getByRole("button", { name: "ลบ" }));
    expect(await screen.findByText("ลบโค้ด FRESH10?")).toBeInTheDocument();
    expect(screen.queryByText(/ทีมงานหยุดโค้ด/)).not.toBeInTheDocument();
  });

  it("submits form choices to the seller API", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.create).mockResolvedValue(code);
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    await screen.findByText("SHOP100");
    await user.click(screen.getByRole("button", { name: "สร้างโค้ดร้าน" }));
    await user.type(screen.getByRole("textbox", { name: /รหัสโค้ด/ }), "newcode10");
    await user.type(screen.getByRole("textbox", { name: /ชื่อที่ลูกค้าเห็น/ }), "สำหรับลูกค้า");
    await user.click(screen.getByRole("button", { name: "ลดเป็น %" }));
    await user.clear(screen.getByRole("spinbutton", { name: "ลด" }));
    await user.type(screen.getByRole("spinbutton", { name: "ลด" }), "50");
    await user.click(screen.getByRole("button", { name: /^สร้างโค้ด$/ }));
    expect(sellerPromotionApi.create).toHaveBeenCalledWith(expect.objectContaining({ code: "NEWCODE10", name: "สำหรับลูกค้า", discountType: "PERCENT", claimable: true, visibility: "PUBLIC" }));
  });
});
