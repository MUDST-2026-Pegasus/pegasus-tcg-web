import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import * as catalogQueries from "@/features/catalog/catalog.queries";
import {
  CardAttributesCard,
  CardEffectsCard,
  ProductGallery,
  ProductImage,
} from "@/features/catalog/components/ProductDetailSections";
import { renderWithProviders } from "@/test/utils";

describe("Product detail shared sections", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows the image fallback after a failed product image load", () => {
    renderWithProviders(<ProductImage src="/card.jpg" alt="Front image" />);

    fireEvent.error(screen.getByAltText("Front image"));

    expect(screen.getByText(/โหลดรูปไม่ได้/)).toBeInTheDocument();
  });

  it("supports an empty gallery and selecting among multiple product photos", async () => {
    const onSelect = vi.fn();
    const user = (await import("@testing-library/user-event")).default.setup();
    const view = renderWithProviders(
      <ProductGallery images={[]} selectedId={null} onSelect={onSelect} emptyAction={<button>Upload a photo</button>} />,
    );
    expect(screen.getByText("ยังไม่มีรูปสินค้า")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload a photo" })).toBeInTheDocument();

    view.rerender(
      <ProductGallery
        images={[{ id: 1, url: "/front.jpg", alt: "Front" }, { id: 2, url: "/back.jpg", alt: "Back" }]}
        selectedId={2}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole("button", { name: "ดูรูปสินค้าที่ 2" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "ดูรูปสินค้าที่ 1" }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("renders present attributes, dashes for missing values, and an optional description", () => {
    renderWithProviders(
      <CardAttributesCard
        product={{
          id: 4,
          gameId: 1,
          categoryId: 1,
          cardSetId: null,
          productType: "SINGLE_CARD",
          name: "Charizard",
          nameLocal: null,
          slug: "charizard",
          cardNumber: null,
          rarityCode: "Rare",
          description: "A fire type card",
          attributes: { card_type: "Fire", hp: 120, stage: null },
          active: true,
        }}
      />,
    );

    expect(screen.getByText("Fire")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("A fire type card")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows empty and retryable effect states, then renders API effect details", async () => {
    const refetch = vi.fn();
    const querySpy = vi.spyOn(catalogQueries, "useProductCardEffects");
    querySpy.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch } as never);
    const view = renderWithProviders(<CardEffectsCard productId={4} />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    querySpy.mockReturnValue({ data: [], isPending: false, isError: false, refetch } as never);
    view.rerender(<CardEffectsCard productId={4} />);
    expect(screen.getByText(/ยังไม่มีข้อมูลความสามารถ/)).toBeInTheDocument();

    querySpy.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch } as never);
    view.rerender(<CardEffectsCard productId={4} />);
    fireEvent.click(screen.getByRole("button", { name: "ลองใหม่" }));
    expect(refetch).toHaveBeenCalledTimes(1);

    querySpy.mockReturnValue({
      data: [{ effectType: "ATTACK", name: "Flame Burst", effectText: "Deal damage", damage: 90, energyCost: ["R", "C"], displayOrder: 1, sourceUrl: null }],
      isPending: false,
      isError: false,
      refetch,
    } as never);
    view.rerender(<CardEffectsCard productId={4} />);
    expect(screen.getByText("Flame Burst")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("Energy: R · C")).toBeInTheDocument();
  });
});
