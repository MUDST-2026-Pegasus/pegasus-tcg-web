import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as catalogApi from "@/features/admin/catalog.api";
import type { Game, ProductDetail } from "@/features/admin/catalog.types";
import { CatalogProductSheet } from "@/features/admin/components/CatalogProductSheet";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/catalog.api", () => ({
  getProduct: vi.fn(),
  getGameAttributes: vi.fn(),
  getCardSets: vi.fn(),
  getCategories: vi.fn(),
  getCardEffects: vi.fn(),
  deleteProduct: vi.fn(),
}));

const pokemon: Game = {
  id: 1,
  code: "POKEMON",
  name: "Pokémon",
  nameLocal: null,
  slug: "pokemon",
  logoUrl: null,
  logoImageUrl: null,
  displayOrder: 1,
  active: true,
  createdBy: 1,
  createdAt: "2026-01-01T00:00:00Z",
};

const pikachu: ProductDetail = {
  product: {
    id: 10,
    gameId: 1,
    categoryId: 1,
    cardSetId: null,
    productType: "SINGLE_CARD",
    name: "Pikachu typo",
    nameLocal: null,
    slug: "pikachu-typo",
    cardNumber: "058/102",
    rarityCode: null,
    description: null,
    attributes: {},
    active: true,
    createdBy: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  variants: [],
  images: [],
};

function renderSheet(onClose = vi.fn()) {
  renderWithProviders(
    <CatalogProductSheet
      target={10}
      tab="details"
      onTabChange={vi.fn()}
      games={[pokemon]}
      defaultGameId={1}
      onCreated={vi.fn()}
      onClose={onClose}
    />,
  );
  return onClose;
}

describe("CatalogProductSheet — deleting a product", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogApi.getProduct).mockResolvedValue(pikachu);
    vi.mocked(catalogApi.getGameAttributes).mockResolvedValue([]);
    vi.mocked(catalogApi.getCardSets).mockResolvedValue([]);
    vi.mocked(catalogApi.getCategories).mockResolvedValue([]);
    vi.mocked(catalogApi.getCardEffects).mockResolvedValue([]);
  });

  it("asks first, then deletes and closes the sheet", async () => {
    const user = userEvent.setup();
    vi.mocked(catalogApi.deleteProduct).mockResolvedValue(undefined);
    const onClose = renderSheet();

    await user.click(await screen.findByRole("button", { name: "ลบสินค้า" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(catalogApi.deleteProduct).not.toHaveBeenCalled();

    await user.click(
      Array.from(dialog.querySelectorAll("button")).find(
        (button) => button.textContent === "ลบสินค้า",
      )!,
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(catalogApi.deleteProduct).toHaveBeenCalledWith(10);
  });

  it("explains a product in use and keeps the sheet open", async () => {
    const user = userEvent.setup();
    vi.mocked(catalogApi.deleteProduct).mockRejectedValue(
      new ApiError({
        status: 409,
        code: "PRODUCT_IN_USE",
        message: "Listings, orders or collections still use this product",
      }),
    );
    const onClose = renderSheet();

    await user.click(await screen.findByRole("button", { name: "ลบสินค้า" }));
    const dialog = await screen.findByRole("alertdialog");
    const confirm = Array.from(dialog.querySelectorAll("button")).find(
      (button) => button.textContent === "ลบสินค้า",
    )!;
    await user.click(confirm);

    expect(
      await screen.findByText(/มีประกาศขาย คำสั่งซื้อ หรือคอลเลกชันอ้างถึงอยู่/),
    ).toBeInTheDocument();
    expect(confirm).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
