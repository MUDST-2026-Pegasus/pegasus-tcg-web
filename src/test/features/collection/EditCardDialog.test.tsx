import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as collectionApi from "@/features/collection/collection.api";
import { EditCardDialog } from "@/features/collection/components/EditCardDialog";
import type { CollectionItem, CollectionVariant } from "@/features/collection/collection.types";
import { renderWithProviders } from "@/test/utils";

function variant(id: number, languageCode: string, active = true): CollectionVariant {
  return { id, sku: `SKU-${id}`, languageCode, finish: "FOIL", edition: "UNLIMITED", printingNote: null, active };
}

const item: CollectionItem = {
  id: 6,
  card: {
    variantId: 21,
    variantLabel: "JP / FOIL / UNLIMITED",
    productId: 2,
    productName: "Charizard ex",
    productSlug: "charizard-ex",
    officialImageUrl: null,
  },
  imageKey: "collections/charizard.jpg",
  photoUrl: "https://example.com/charizard.jpg",
  publicItem: true,
  condition: "NM",
  quantity: 1,
  gradingCompany: null,
  gradeValue: null,
  certNumber: null,
  acquiredPrice: 120,
  acquiredAt: null,
  personalNote: "First pull",
};

describe("EditCardDialog", () => {
  const onClose = vi.fn();
  const updateItem = vi.spyOn(collectionApi, "updateCollectionItem");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(collectionApi, "getCollectionVariants").mockResolvedValue([variant(21, "JP"), variant(22, "EN")]);
    updateItem.mockResolvedValue(item);
  });

  it("opens on the card's current printing, condition and quantity", async () => {
    renderWithProviders(<EditCardDialog item={item} onClose={onClose} />);

    expect(await screen.findByRole("combobox", { name: "Printing of Charizard ex" })).toHaveTextContent(
      "JP / FOIL / UNLIMITED",
    );
    expect(screen.getByRole("combobox", { name: "Condition of Charizard ex" })).toHaveTextContent("Near Mint");
    expect(screen.getByLabelText("Quantity of Charizard ex")).toHaveValue(1);
    expect(screen.getByAltText("Your photo of Charizard ex")).toHaveAttribute("src", item.photoUrl);
  });

  it("saves the changed details and keeps the photo and the owner's private fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditCardDialog item={item} onClose={onClose} />);

    await screen.findByRole("combobox", { name: "Printing of Charizard ex" });
    await user.click(screen.getByRole("combobox", { name: "Printing of Charizard ex" }));
    await user.click(await screen.findByRole("option", { name: "EN / FOIL / UNLIMITED" }));
    await user.click(screen.getByRole("combobox", { name: "Condition of Charizard ex" }));
    await user.click(await screen.findByRole("option", { name: "Lightly Played" }));
    await user.clear(screen.getByLabelText("Quantity of Charizard ex"));
    await user.type(screen.getByLabelText("Quantity of Charizard ex"), "3");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateItem).toHaveBeenCalledTimes(1));
    expect(updateItem.mock.calls[0][0]).toBe(6);
    expect(updateItem.mock.calls[0][1]).toMatchObject({
      catalogVariantId: 22,
      condition: "LP",
      quantity: 3,
      imageKey: "collections/charizard.jpg",
      publicItem: true,
      acquiredPrice: 120,
      personalNote: "First pull",
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("takes the photo off the card when it is removed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditCardDialog item={item} onClose={onClose} />);

    await user.click(await screen.findByRole("button", { name: "Remove photo of Charizard ex" }));
    expect(screen.queryByAltText("Your photo of Charizard ex")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateItem).toHaveBeenCalledTimes(1));
    expect(updateItem.mock.calls[0][1]).toMatchObject({ catalogVariantId: 21, imageKey: null });
  });

  it("still offers the card's printing after the catalogue retires it", async () => {
    vi.spyOn(collectionApi, "getCollectionVariants").mockResolvedValue([variant(21, "JP", false), variant(22, "EN")]);
    renderWithProviders(<EditCardDialog item={item} onClose={onClose} />);

    expect(await screen.findByRole("combobox", { name: "Printing of Charizard ex" })).toHaveTextContent(
      "JP / FOIL / UNLIMITED",
    );
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
  });
});
