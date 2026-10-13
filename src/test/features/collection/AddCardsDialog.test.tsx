import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toast } from "@/components/ui/toast";
import * as catalogQueries from "@/features/catalog/catalog.queries";
import type { ProductSummaryDto } from "@/features/catalog/catalog.types";
import * as collectionApi from "@/features/collection/collection.api";
import { AddCardsDialog } from "@/features/collection/components/AddCardsDialog";
import type { CollectionItem, CollectionVariant } from "@/features/collection/collection.types";
import { renderWithProviders } from "@/test/utils";

function product(id: number, name: string, cardNumber: string, rarityCode: string): ProductSummaryDto {
  return {
    id,
    slug: `card-${id}`,
    name,
    nameLocal: null,
    gameId: 1,
    categoryId: 1,
    cardSetId: 1,
    productType: "SINGLE_CARD",
    cardNumber,
    rarityCode,
    primaryImageUrl: null,
    variantCount: 1,
    lowestPrice: null,
    listingCount: 0,
  };
}

function variant(id: number, languageCode: string): CollectionVariant {
  return { id, sku: `SKU-${id}`, languageCode, finish: "FOIL", edition: "UNLIMITED", printingNote: null, active: true };
}

const VARIANTS: Record<number, CollectionVariant[]> = {
  1: [variant(11, "JP")],
  2: [variant(21, "JP"), variant(22, "EN")],
};

/** Opens the styled dropdown named `label` and picks the row reading `option`. */
async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("AddCardsDialog", () => {
  const onOpenChange = vi.fn();
  const addItems = vi.spyOn(collectionApi, "addCollectionItems");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toast, "add").mockImplementation(vi.fn());

    vi.spyOn(catalogQueries, "useGameList").mockReturnValue({
      data: [{ id: 1, name: "Pokemon TCG" }],
    } as unknown as ReturnType<typeof catalogQueries.useGameList>);
    vi.spyOn(catalogQueries, "useCardSetList").mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof catalogQueries.useCardSetList>);
    vi.spyOn(catalogQueries, "useProductSearch").mockReturnValue({
      data: {
        items: [product(1, "Umbreon ex", "161/131", "SIR"), product(2, "Charizard ex", "006/165", "SAR")],
        page: 0,
        totalPages: 1,
        totalItems: 2,
      },
      isPending: false,
      isError: false,
      isPlaceholderData: false,
    } as unknown as ReturnType<typeof catalogQueries.useProductSearch>);

    vi.spyOn(collectionApi, "getCollectionVariants").mockImplementation((productId) =>
      Promise.resolve(VARIANTS[productId] ?? []),
    );
    addItems.mockImplementation((payloads) =>
      Promise.resolve(payloads.map(() => ({ status: "fulfilled", value: {} as CollectionItem }))),
    );
  });

  it("shows catalogue cards with their number and rarity, and nothing can be added until one is picked", () => {
    renderWithProviders(<AddCardsDialog open onOpenChange={onOpenChange} />);

    expect(screen.getByRole("button", { name: /Umbreon ex/ })).toHaveTextContent("161/131 · SIR");
    expect(screen.getByText("0 cards selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("adds a picked card with its details and no photo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddCardsDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: /Umbreon ex/ }));
    expect(screen.getByText("1 card selected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));

    // The only printing is chosen without asking.
    expect(await screen.findByRole("combobox", { name: "Printing of Umbreon ex" })).toHaveTextContent(
      "JP / FOIL / UNLIMITED",
    );
    await choose(user, "Condition of Umbreon ex", "Lightly Played");
    await user.click(screen.getByRole("button", { name: "Add 1 card" }));

    await waitFor(() => expect(addItems).toHaveBeenCalledTimes(1));
    expect(addItems.mock.calls[0][0]).toEqual([
      { catalogVariantId: 11, imageKey: null, publicItem: true, condition: "LP", quantity: 1 },
    ]);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("waits for a printing to be chosen when a card has several", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddCardsDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: /Charizard ex/ }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByRole("combobox", { name: "Printing of Charizard ex" })).toHaveTextContent(
      "Choose printing",
    );
    expect(screen.getByRole("button", { name: "Add 1 card" })).toBeDisabled();

    await choose(user, "Printing of Charizard ex", "EN / FOIL / UNLIMITED");
    expect(screen.getByRole("button", { name: "Add 1 card" })).toBeEnabled();
  });

  it("searches one game's cards once that game is chosen, and resets to the first page", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddCardsDialog open onOpenChange={onOpenChange} />);

    expect(screen.getByRole("combobox", { name: "Set" })).toBeDisabled();
    await choose(user, "Game", "Pokemon TCG");

    expect(catalogQueries.useProductSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ gameId: [1], cardSetId: undefined, page: 0 }),
    );
    expect(screen.getByRole("combobox", { name: "Set" })).toBeEnabled();
  });

  it("keeps a card that failed and shows why, so it can be retried", async () => {
    addItems.mockResolvedValueOnce([
      { status: "fulfilled", value: {} as CollectionItem },
      { status: "rejected", reason: new Error("Variant is no longer available") },
    ]);
    const user = userEvent.setup();
    renderWithProviders(<AddCardsDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: /Umbreon ex/ }));
    await user.click(screen.getByRole("button", { name: /Charizard ex/ }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("combobox", { name: "Printing of Charizard ex" });
    await choose(user, "Printing of Charizard ex", "JP / FOIL / UNLIMITED");
    await user.click(screen.getByRole("button", { name: "Add 2 cards" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Variant is no longer available");
    expect(screen.queryByRole("combobox", { name: "Printing of Umbreon ex" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Printing of Charizard ex" })).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
