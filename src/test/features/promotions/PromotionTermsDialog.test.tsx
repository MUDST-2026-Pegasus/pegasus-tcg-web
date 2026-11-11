import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PromotionTermsDialog } from "@/features/promotions/PromotionTermsDialog";
import * as claimQueries from "@/features/promotions/claim.queries";
import type { PromotionTerms } from "@/features/promotions/claim.types";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/promotions/claim.queries", () => ({
  usePromotionTerms: vi.fn(),
}));

const terms: PromotionTerms = {
  id: 21,
  code: "CARD10",
  name: "ลดการ์ด 10%",
  description: "ส่วนลดจากร้าน",
  ownerType: "SELLER",
  shop: { sellerProfileId: 9, name: "Card Corner", username: "cardcorner" },
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscount: 250,
  minSpend: 500,
  scopeType: "ALL",
  scopeTargets: [],
  startsAt: "2026-11-01T00:00:00Z",
  endsAt: "2026-11-30T23:59:59Z",
  usageLimitPerUser: 1,
  newBuyerOnly: false,
  stacksWithShopCodes: true,
  claimable: true,
  claimRequired: true,
  remainingClaims: 7,
  status: "ACTIVE",
  claimed: false,
};

describe("PromotionTermsDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows loading and retryable API-error states", async () => {
    const refetch = vi.fn();
    vi.mocked(claimQueries.usePromotionTerms).mockReturnValue({ data: undefined, isPending: true, isError: false, error: null, refetch } as never);
    const view = renderWithProviders(<PromotionTermsDialog code="CARD10" onOpenChange={vi.fn()} onCopy={vi.fn()} />);
    expect(screen.getByRole("status", { name: "กำลังโหลดเงื่อนไขโค้ด" })).toBeInTheDocument();

    vi.mocked(claimQueries.usePromotionTerms).mockReturnValue({ data: undefined, isPending: false, isError: true, error: new Error("offline"), refetch } as never);
    view.rerender(<PromotionTermsDialog code="CARD10" onOpenChange={vi.fn()} onCopy={vi.fn()} />);
    await userEvent.setup().click(await screen.findByRole("button", { name: "ลองใหม่" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders API terms, sends the selected terms to claim, and disables claim while pending", async () => {
    const onClaim = vi.fn();
    vi.mocked(claimQueries.usePromotionTerms).mockReturnValue({ data: terms, isPending: false, isError: false, error: null, refetch: vi.fn() } as never);
    const user = userEvent.setup();
    const baseView = renderWithProviders(<PromotionTermsDialog code="CARD10" onOpenChange={vi.fn()} onClaim={onClaim} onCopy={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "ลดการ์ด 10%" })).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "เงื่อนไข" });
    expect(within(list).getByText("THB 500.00 จากสินค้าของ Card Corner")).toBeInTheDocument();
    expect(within(list).getByText("THB 250.00 ต่อคำสั่งซื้อ")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "เก็บโค้ด" }));
    expect(onClaim).toHaveBeenCalledWith(terms);
    baseView.unmount();

    const view = renderWithProviders(<PromotionTermsDialog code="CARD10" onOpenChange={vi.fn()} onClaim={onClaim} onCopy={vi.fn()} claiming />);
    expect(screen.getByRole("button", { name: "เก็บโค้ด CARD10" })).toBeDisabled();
    view.unmount();
  });

  it("hides claim for owner view and forwards copy interaction", async () => {
    const onCopy = vi.fn();
    vi.mocked(claimQueries.usePromotionTerms).mockReturnValue({ data: terms, isPending: false, isError: false, error: null, refetch: vi.fn() } as never);
    const user = userEvent.setup();
    renderWithProviders(<PromotionTermsDialog code="CARD10" ownerView onOpenChange={vi.fn()} onClaim={vi.fn()} onCopy={onCopy} />);

    expect(screen.queryByRole("button", { name: "เก็บโค้ด" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "คัดลอก" }));
    expect(onCopy).toHaveBeenCalledWith("CARD10");
  });
});
