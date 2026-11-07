import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  buyBoxState,
  displayValue,
  listingTotal,
  marketHint,
  sortedEffects,
  versionOffers,
} from "@/features/catalog/listing-detail.format";
import { InformationGroup } from "@/features/catalog/components/ListingDetailSections";
import type {
  MarketStatDto,
  PublicListingDetailDto,
} from "@/features/catalog/catalog.types";
const listing: PublicListingDetailDto["listing"] = {
  id: 1,
  card: {
    variantId: 1,
    sku: "A",
    variantLabel: "EN",
    productId: 1,
    productName: "Card",
    productSlug: "card",
    gameId: 1,
    officialImageUrl: null,
  },
  condition: "NM",
  price: 100,
  currency: "THB",
  quantityAvailable: 3,
  status: "ACTIVE",
  publishedAt: null,
  publicNote: null,
  gradingCompany: null,
  gradeValue: null,
  primaryPhotoUrl: null,
  seller: {
    username: "seller",
    displayName: null,
    avatarUrl: null,
    verified: true,
    ratingAvg: null,
    ratingCount: 0,
    salesCount: 0,
  },
  delivery: {
    fastestEstDaysMin: null,
    fastestEstDaysMax: null,
    freeShipping: false,
    optionCount: 1,
  },
};
const pricing = {
  listPrice: 100,
  salePrice: 70,
  discountPercent: 30,
  sale: {
    id: 1,
    slug: "flash",
    name: "Flash",
    type: "FLASH_SALE" as const,
    endsAt: "2099-01-01",
    quotaLeft: 20,
    perBuyerLimit: 2,
  },
};
const market: MarketStatDto = {
  medianPrice: 100,
  sampleSize: 3,
  statDate: "2026-11-07",
  minPrice: 80,
  maxPrice: 120,
  p25Price: null,
  p75Price: null,
  activeListingCount: 5,
  soldQuantity30d: 10,
};
describe("listing detail rules", () => {
  it.each([
    [97, "equal"],
    [103, "equal"],
    [96.99, "below"],
    [103.01, "above"],
  ])("market boundaries at %s", (price, kind) =>
    expect(marketHint(market, Number(price)).kind).toBe(kind),
  );
  it("handles missing, zero median and low sample", () => {
    expect(marketHint(null, 100).kind).toBe("none");
    expect(marketHint({ ...market, medianPrice: 0 }, 100).kind).toBe("none");
    expect(marketHint({ ...market, sampleSize: 2 }, 70).kind).toBe("low");
    expect(marketHint({ ...market, sampleSize: 0, medianPrice: null }, 70).kind).toBe("low");
    expect(marketHint(market, pricing.salePrice).kind).toBe("below");
  });
  it("selects all seven states with owner and sold-out precedence", () => {
    expect(buyBoxState(listing)).toBe("raw");
    expect(
      buyBoxState({
        ...listing,
        pricing: { ...pricing, sale: { ...pricing.sale, type: "SHOP_SALE" } },
      }),
    ).toBe("sale");
    expect(buyBoxState({ ...listing, pricing })).toBe("flash");
    expect(buyBoxState({ ...listing, gradingCompany: "PSA" })).toBe("graded");
    expect(buyBoxState({ ...listing, quantityAvailable: 1 })).toBe("last-item");
    expect(buyBoxState({ ...listing, status: "SOLD_OUT", pricing })).toBe(
      "sold-out",
    );
    expect(buyBoxState({ ...listing, quantityAvailable: 0, pricing })).toBe(
      "sold-out",
    );
    expect(buyBoxState({ ...listing, pricing }, "seller")).toBe("own");
  });
  it("totals limited sale units and excess at list price", () => {
    expect(listingTotal({ ...listing, pricing }, 1)).toBe(70);
    expect(listingTotal({ ...listing, pricing }, 2)).toBe(140);
    expect(listingTotal({ ...listing, pricing }, 4)).toBe(340);
    expect(listingTotal(listing, 4)).toBe(400);
    expect(
      listingTotal(
        {
          ...listing,
          pricing: {
            ...pricing,
            sale: { ...pricing.sale, perBuyerLimit: null },
          },
        },
        4,
      ),
    ).toBe(280);
  });
  it("hides the whole row for empty values while retaining zero", () => {
    render(
      <InformationGroup
        title="Details"
        rows={[
          ["Missing", null],
          ["Blank", " "],
          ["Placeholder", "—"],
          ["NA", "NOT_APPLICABLE"],
          ["HP", 0],
          ["Finish", "Holo"],
        ]}
      />,
    );
    expect(screen.queryByText("Missing")).not.toBeInTheDocument();
    expect(screen.queryByText("Blank")).not.toBeInTheDocument();
    expect(screen.queryByText("Placeholder")).not.toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(displayValue({})).toBeNull();
  });
  it("chooses variant offers by API effective price and counts listings", () => {
    const variants = [
      {
        id: 1,
        catalogProductId: 1,
        sku: "a",
        languageCode: "EN",
        finish: "HOLO",
        edition: "UNLIMITED",
        printingNote: null,
        imageUrl: null,
        active: true,
      },
      {
        id: 2,
        catalogProductId: 1,
        sku: "b",
        languageCode: "JP",
        finish: "HOLO",
        edition: "UNLIMITED",
        printingNote: null,
        imageUrl: null,
        active: true,
      },
    ];
    const offers = versionOffers(variants, [
      listing,
      { ...listing, id: 2, pricing },
      { ...listing, id: 3, quantityAvailable: 0 },
    ]);
    expect(offers[0].cheapest.id).toBe(2);
    expect(offers[0].count).toBe(2);
    expect(offers[1].cheapest).toBeUndefined();
  });
  it("keeps rule effects last regardless of display order", () => {
    const effect = {
      name: "",
      effectText: null,
      damage: null,
      energyCost: [],
      sourceUrl: null,
    };
    expect(
      sortedEffects([
        { ...effect, effectType: "RULE", displayOrder: 0 },
        { ...effect, effectType: "ATTACK", displayOrder: 2 },
        { ...effect, effectType: "ABILITY", displayOrder: 1 },
      ]).map((e) => e.effectType),
    ).toEqual(["ABILITY", "ATTACK", "RULE"]);
  });
});
