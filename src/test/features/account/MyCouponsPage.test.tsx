import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as authQueries from "@/features/auth/auth.queries";
import { MyCouponsPage } from "@/features/account/pages/MyCouponsPage";
import { claimApi } from "@/features/promotions/claim.api";
import type { PromotionTerms, Wallet, WalletCode } from "@/features/promotions/claim.types";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

const walletCode: WalletCode = {
  id: 1,
  code: "FREESHIP",
  name: "ส่งฟรีทุกร้าน",
  description: null,
  ownerType: "PLATFORM",
  shop: null,
  discountType: "FREE_SHIPPING",
  discountValue: 0,
  maxDiscount: 60,
  minSpend: 300,
  startsAt: "2026-11-01T00:00:00Z",
  endsAt: soon,
  status: "ACTIVE",
  claimedAt: "2026-11-01T00:00:00Z",
  usesLeft: 1,
  uses: [],
};

const shopWalletCode: WalletCode = {
  ...walletCode,
  id: 2,
  code: "CVBKK100",
  ownerType: "SELLER",
  shop: { sellerProfileId: 6, name: "CardVault BKK", username: "cardvaultbkk" },
  discountType: "FIXED",
  discountValue: 100,
  maxDiscount: null,
  minSpend: 2000,
  endsAt: "2099-12-31T16:59:59Z",
};

const wallet: Wallet = {
  tab: "AVAILABLE",
  items: [walletCode, shopWalletCode],
  counts: { AVAILABLE: 2, USED: 3, EXPIRED: 0 },
};

const terms: PromotionTerms = {
  id: 9,
  code: "TCGFAN",
  name: "ลด ฿80 ทุกเกม",
  description: null,
  ownerType: "PLATFORM",
  shop: null,
  discountType: "FIXED",
  discountValue: 80,
  maxDiscount: null,
  minSpend: 600,
  scopeType: "ALL",
  scopeTargets: [],
  startsAt: "2026-11-01T00:00:00Z",
  endsAt: "2026-12-15T16:59:59Z",
  usageLimitPerUser: 1,
  newBuyerOnly: false,
  stacksWithShopCodes: true,
  claimable: true,
  claimRequired: false,
  remainingClaims: null,
  status: "ACTIVE",
  claimed: true,
};

describe("MyCouponsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authQueries, "useAuth").mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 7, displayName: "Somchai Jaidee", email: "s@example.com", avatarUrl: null },
      roles: [],
      hasRole: () => false,
    } as unknown as ReturnType<typeof authQueries.useAuth>);
    vi.spyOn(claimApi, "wallet").mockResolvedValue(wallet);
    vi.spyOn(claimApi, "terms").mockResolvedValue(terms);
  });

  it("lists codes with counts, shop links and an orange near-expiry date", async () => {
    renderWithProviders(<MyCouponsPage />, { route: "/account/coupons" });
    const list = await screen.findByRole("list", { name: "รายการโค้ด" });
    expect(within(list).getByText("หมดอายุใน 2 วัน")).toHaveClass("text-orange-600");
    expect(within(list).getByText("ไปที่ร้าน", { selector: "a" })).toHaveAttribute("href", "/u/cardvaultbkk");
    expect(within(list).getByText("ช้อปเลย", { selector: "a" })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("tab", { name: /ใช้แล้ว\s*3/ })).toBeInTheDocument();
  });

  it("filters by owner and switches tabs", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyCouponsPage />, { route: "/account/coupons" });
    await screen.findByRole("list", { name: "รายการโค้ด" });
    await user.click(screen.getByRole("button", { name: "โค้ดร้าน" }));
    await waitFor(() => expect(claimApi.wallet).toHaveBeenLastCalledWith("AVAILABLE", "SELLER"));
    await user.click(screen.getByRole("tab", { name: /ใช้แล้ว/ }));
    await waitFor(() => expect(claimApi.wallet).toHaveBeenLastCalledWith("USED", "SELLER"));
  });

  it("collects a typed code and shows the success modal", async () => {
    const user = userEvent.setup();
    vi.spyOn(claimApi, "claimByCode").mockResolvedValue({
      claim: { id: 3, promotionId: 9, code: "TCGFAN", source: "WALLET_INPUT", claimedAt: "2026-11-02T00:00:00Z" },
      alreadyClaimed: false,
    });
    renderWithProviders(<MyCouponsPage />, { route: "/account/coupons" });
    await user.type(screen.getByRole("textbox", { name: "มีโค้ดจากโซเชียล?" }), "tcgfan");
    await user.click(screen.getByRole("button", { name: "เก็บโค้ด" }));

    expect(claimApi.claimByCode).toHaveBeenCalledWith("TCGFAN");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("เก็บ TCGFAN แล้ว")).toBeInTheDocument();
    expect(await within(dialog).findByText("ลด ฿80 ทุกเกม")).toBeInTheDocument();
  });

  it("says when a typed code was collected already", async () => {
    const user = userEvent.setup();
    vi.spyOn(claimApi, "claimByCode").mockResolvedValue({
      claim: { id: 3, promotionId: 1, code: "PEGASUS10", source: "HOME", claimedAt: "2026-11-01T00:00:00Z" },
      alreadyClaimed: true,
    });
    renderWithProviders(<MyCouponsPage />, { route: "/account/coupons" });
    await user.type(screen.getByRole("textbox", { name: "มีโค้ดจากโซเชียล?" }), "PEGASUS10");
    await user.click(screen.getByRole("button", { name: "เก็บโค้ด" }));
    expect(await screen.findByText("เก็บโค้ดนี้ไว้แล้ว — ดูในแท็บ “ใช้ได้”")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    ["PROMO_NOT_FOUND", 404, "ไม่พบโค้ด ตรวจสอบตัวสะกดอีกครั้ง"],
    ["PROMO_EXPIRED", 400, "โค้ดนี้หมดอายุแล้ว"],
    ["PROMO_CLAIM_FULL", 409, "โค้ดนี้ถูกเก็บครบแล้ว"],
  ])("shows %s under the field", async (code, status, message) => {
    const user = userEvent.setup();
    vi.spyOn(claimApi, "claimByCode").mockRejectedValue(new ApiError({ status, code, message: code }));
    renderWithProviders(<MyCouponsPage />, { route: "/account/coupons" });
    await user.type(screen.getByRole("textbox", { name: "มีโค้ดจากโซเชียล?" }), "ABCD1234");
    await user.click(screen.getByRole("button", { name: "เก็บโค้ด" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });
});
