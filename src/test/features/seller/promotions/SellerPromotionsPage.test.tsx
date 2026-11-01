import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { SellerPromotionsPage } from "@/features/seller/promotions/SellerPromotionsPage";
import { sellerPromotionApi } from "@/features/seller/promotions/api";
import { useSellerProfile } from "@/features/seller/shared/seller.queries";
import type { SellerPromotion } from "@/features/seller/promotions/types";

vi.mock("@/features/seller/shared/seller.queries", () => ({ useSellerProfile: vi.fn() }));
vi.mock("@/features/seller/promotions/api", () => ({ sellerPromotionApi: { list: vi.fn(), summary: vi.fn(), create: vi.fn(), update: vi.fn(), pause: vi.fn(), resume: vi.fn(), remove: vi.fn(), redemptions: vi.fn() } }));

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

  it("shows the seller ticket and blocks deletion after claims", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    expect(await screen.findByText("SHOP100")).toBeInTheDocument();
    expect(screen.getByText("ใช้แล้ว 4 / 50")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ลบ" }));
    expect(await screen.findByText("ลบโค้ด SHOP100 ไม่ได้")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "หยุดชั่วคราวแทน" })).toBeInTheDocument();
    expect(sellerPromotionApi.remove).not.toHaveBeenCalled();
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

  it("prevents unverified sellers from creating codes", async () => {
    vi.mocked(useSellerProfile).mockReturnValue({ data: { status: "PENDING" }, isPending: false } as ReturnType<typeof useSellerProfile>);
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    expect(await screen.findByText("SHOP100")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "สร้างโค้ดร้าน" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("ยังสร้างโค้ดไม่ได้");
  });

  it("does not offer resume when staff paused the code", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({ page: { items: [{ ...code, status: "PAUSED", pausedBy: "ADMIN", pauseReason: "ตรวจสอบการใช้งาน" }], page: 0, size: 20, totalItems: 1, totalPages: 1 }, statusCounts: { ACTIVE: 0, SCHEDULED: 0, PAUSED: 1, EXPIRED: 0, USED_UP: 0 } });
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    expect(await screen.findByText("SHOP100")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "เปิดใช้อีกครั้ง" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ดูข้อกำหนด" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ดูข้อกำหนด" }));
    expect(screen.getByText(/เลขอ้างอิง: PRM-7/)).toBeInTheDocument();
  });

  it("shows reserved orders before pausing", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.list).mockResolvedValue({ page: { items: [{ ...code, pendingOrderCount: 2 }], page: 0, size: 20, totalItems: 1, totalPages: 1 }, statusCounts: { ACTIVE: 1, SCHEDULED: 0, PAUSED: 0, EXPIRED: 0, USED_UP: 0 } });
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    await screen.findByText("SHOP100");
    await user.click(screen.getByRole("button", { name: "หยุดชั่วคราว" }));
    expect(screen.getByText("ออเดอร์รอชำระ")).toBeInTheDocument();
    expect(screen.getByText("2 ออเดอร์")).toBeInTheDocument();
  });

  it("links a redemption to its order detail", async () => {
    const user = userEvent.setup();
    vi.mocked(sellerPromotionApi.redemptions).mockResolvedValue({ items: [{ id: 9, sellerOrderId: 42, sellerOrderNumber: "SO-42", buyerDisplayName: "Somchai", amount: 100, status: "CONSUMED", createdAt: "2026-11-01T00:00:00Z" }], page: 0, size: 20, totalItems: 1, totalPages: 1 });
    renderWithProviders(<SellerPromotionsPage />, { route: "/seller/promotions" });
    await screen.findByText("SHOP100");
    await user.click(screen.getByRole("button", { name: "ดูการใช้โค้ด" }));
    expect(await screen.findByRole("link", { name: "SO-42" })).toHaveAttribute("href", "/seller/orders/42");
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
    await user.clear(screen.getByRole("spinbutton", { name: /ลด \*/ }));
    await user.type(screen.getByRole("spinbutton", { name: /ลด \*/ }), "50");
    await user.click(screen.getByRole("button", { name: /^สร้างโค้ด$/ }));
    expect(sellerPromotionApi.create).toHaveBeenCalledWith(expect.objectContaining({ code: "NEWCODE10", name: "สำหรับลูกค้า", discountType: "PERCENT", claimable: true, visibility: "PUBLIC" }));
  });
});
