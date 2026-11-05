import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { SaleActionDialog, type SaleActionState } from "@/features/admin/components/SaleActionDialog";
import * as salesApi from "@/features/admin/sales.api";
import type { AdminSale } from "@/features/admin/sales.types";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/sales.api", () => ({
  deleteSale: vi.fn(),
  endSale: vi.fn(),
  pauseSale: vi.fn(),
  resumeSale: vi.fn(),
}));

const sale: AdminSale = {
  id: 3,
  name: "Pokémon Month",
  slug: "pokemon-month",
  ownerType: "PLATFORM",
  seller: null,
  saleType: "CATEGORY_SALE",
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscountPerUnit: 500,
  minDiscountPercent: null,
  maxDiscountPercent: null,
  scopeType: "GAME",
  scopeIds: [1],
  conditions: [],
  minUnitPrice: 100,
  excludedSellerIds: [],
  perListingQuota: null,
  perBuyerLimit: null,
  budgetCap: 50_000,
  subsidyReserved: 24_300,
  soldUnits: 1120,
  listingCount: 2140,
  orderCount: 0,
  bannerImageUrl: null,
  featuredOnHome: true,
  homeSort: 0,
  showOnSalePage: true,
  startsAt: "2026-11-01T00:00:00Z",
  endsAt: "2026-11-30T16:59:00Z",
  status: "ACTIVE",
  pausedAt: null,
  pauseReason: null,
  pausedByAdmin: false,
  endedAt: null,
  createdAt: "2026-10-20T00:00:00Z",
  updatedAt: "2026-10-20T00:00:00Z",
};

function Harness({ initial }: { initial: SaleActionState }) {
  const [action, setAction] = useState<SaleActionState | null>(initial);
  return <SaleActionDialog action={action} onChange={setAction} />;
}

describe("SaleActionDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("SALE_IN_USE on delete switches to the 'end instead' dialog", async () => {
    vi.mocked(salesApi.deleteSale).mockRejectedValue(
      new ApiError({ status: 409, code: "SALE_IN_USE", message: "in use" }),
    );
    vi.mocked(salesApi.endSale).mockResolvedValue({ ...sale, status: "ENDED" });
    renderWithProviders(<Harness initial={{ kind: "delete", sale }} />);

    await userEvent.click(screen.getByRole("button", { name: "ลบ" }));

    expect(await screen.findByText("ลบแคมเปญนี้ไม่ได้")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "จบแคมเปญแทน" }));
    expect(await screen.findByText("จบ Pokémon Month ตอนนี้?")).toBeInTheDocument();
    expect(screen.getByText("1,120 ชิ้น")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "จบแคมเปญ" }));
    await waitFor(() => expect(salesApi.endSale).toHaveBeenCalledWith(3));
  });

  it("pausing a shop's sale needs a reason the shop will see", async () => {
    vi.mocked(salesApi.pauseSale).mockResolvedValue({ ...sale, status: "PAUSED" });
    const shopSale: AdminSale = {
      ...sale,
      name: "Charizard week",
      ownerType: "SELLER",
      saleType: "SHOP_SALE",
      seller: { id: 9, username: "minmin_tcg", displayName: "minmin", avatarUrl: null },
    };
    renderWithProviders(<Harness initial={{ kind: "pause", sale: shopSale }} />);

    expect(screen.getByText("หยุด “Charizard week” ของ minmin_tcg?")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "หยุดการลดราคา" });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByRole("textbox"), "ราคาลด 90% ต่ำผิดปกติ");
    await userEvent.click(submit);

    await waitFor(() =>
      expect(salesApi.pauseSale).toHaveBeenCalledWith(3, "ราคาลด 90% ต่ำผิดปกติ", true),
    );
  });
});
