import { describe, it, expect } from "vitest";

import {
  autoPricePreview,
  marketSnapshotFrom,
  sanitizeSignedDecimal,
  variantLabelOf,
} from "@/features/seller/products/listing-form.format";
import {
  detailsChanged,
  emptyListingForm,
  listingIssues,
  pricingChanged,
  toCreatePayload,
  toListingForm,
  toPricePayload,
  type ListingFormValues,
} from "@/features/seller/products/listing-form.schema";
import type { CatalogVariant } from "@/features/seller/products/listing-form.types";
import type { SellerListing } from "@/features/seller/products/products.types";

function filled(overrides: Partial<ListingFormValues> = {}): ListingFormValues {
  return {
    ...emptyListingForm(),
    catalogVariantId: 902,
    condition: "NM",
    price: "1290",
    unitCost: "980",
    quantity: "3",
    ...overrides,
  };
}

const paths = (values: ListingFormValues, mode: "create" | "edit" = "create") =>
  listingIssues(values, mode).map((issue) => issue.path);

describe("listingIssues", () => {
  it("accepts a complete manual listing", () => {
    expect(paths(filled())).toEqual([]);
  });

  it("asks for the card, the condition, the price, the cost and the quantity on create", () => {
    expect(paths({ ...emptyListingForm(), quantity: "" })).toEqual([
      "catalogVariantId",
      "condition",
      "price",
      "unitCost",
      "quantity",
    ]);
  });

  it("allows a zero cost but not a zero price", () => {
    expect(paths(filled({ unitCost: "0" }))).toEqual([]);
    expect(paths(filled({ price: "0" }))).toEqual(["price"]);
  });

  it("caps one stock-in at 100 whole cards", () => {
    expect(paths(filled({ quantity: "101" }))).toEqual(["quantity"]);
    expect(paths(filled({ quantity: "100" }))).toEqual([]);
  });

  it("requires both bounds in AUTO_MEDIAN and keeps the floor under the ceiling", () => {
    const auto = filled({ pricingMode: "AUTO_MEDIAN" });
    expect(paths(auto)).toEqual(["autoPriceFloor", "autoPriceCeiling"]);
    expect(
      paths({ ...auto, autoPriceFloor: "1500", autoPriceCeiling: "1000" }),
    ).toEqual(["autoPriceCeiling"]);
    expect(
      paths({ ...auto, autoPriceFloor: "1000", autoPriceCeiling: "1500" }),
    ).toEqual([]);
  });

  it("keeps the offset inside what the backend stores", () => {
    const auto = filled({
      pricingMode: "AUTO_MEDIAN",
      autoPriceFloor: "1000",
      autoPriceCeiling: "1500",
    });
    expect(paths({ ...auto, autoPriceOffsetPercent: "-5" })).toEqual([]);
    expect(paths({ ...auto, autoPriceOffsetPercent: "-100" })).toEqual([
      "autoPriceOffsetPercent",
    ]);
  });

  it("asks who graded the card once a grade is given", () => {
    expect(paths(filled({ gradeValue: "9.5" }))).toEqual(["gradingCompany"]);
    expect(paths(filled({ gradeValue: "9.5", gradingCompany: "PSA" }))).toEqual([]);
    expect(paths(filled({ gradeValue: "9.25", gradingCompany: "PSA" }))).toEqual([
      "gradeValue",
    ]);
  });

  it("does not ask for the card, cost or quantity when editing", () => {
    expect(
      paths({ ...filled(), catalogVariantId: null, unitCost: "", quantity: "" }, "edit"),
    ).toEqual([]);
  });
});

describe("payloads", () => {
  it("sends AUTO_MEDIAN bounds and drops them for MANUAL", () => {
    const auto = filled({
      pricingMode: "AUTO_MEDIAN",
      autoPriceOffsetPercent: "-5",
      autoPriceFloor: "1000",
      autoPriceCeiling: "1500",
      lotLabel: "  BOX-01 ",
    });
    expect(toCreatePayload(auto)).toMatchObject({
      catalogVariantId: 902,
      price: 1290,
      pricingMode: "AUTO_MEDIAN",
      autoPriceOffsetPercent: -5,
      autoPriceFloor: 1000,
      autoPriceCeiling: 1500,
      lotLabel: "BOX-01",
      gradingCompany: null,
    });
    expect(toCreatePayload(filled())).toMatchObject({
      autoPriceOffsetPercent: null,
      autoPriceFloor: null,
      autoPriceCeiling: null,
    });
    expect(toPricePayload(filled())).toEqual({ pricingMode: "MANUAL", price: 1290 });
  });
});

const listing = {
  id: 7,
  card: { variantId: 902 },
  condition: "NM",
  price: 1290,
  pricingMode: "MANUAL",
  autoPriceOffsetPercent: null,
  autoPriceFloor: null,
  autoPriceCeiling: null,
  gradingCompany: null,
  gradeValue: null,
  lotLabel: "BOX-01",
  publicNote: null,
  photos: [
    { imageKey: "listings/a.jpg", url: "a", primary: true },
    { imageKey: "listings/b.jpg", url: "b", primary: false },
  ],
} as unknown as SellerListing;

describe("edit change detection", () => {
  it("sees nothing changed on the form it was loaded from", () => {
    const values = toListingForm(listing);
    expect(pricingChanged(values, listing)).toBe(false);
    expect(detailsChanged(values, listing)).toBe(false);
  });

  it("notices a new price, and photos put in another order", () => {
    const values = toListingForm(listing);
    expect(pricingChanged({ ...values, price: "1200" }, listing)).toBe(true);
    expect(
      detailsChanged(
        { ...values, imageKeys: ["listings/b.jpg", "listings/a.jpg"] },
        listing,
      ),
    ).toBe(true);
  });
});

describe("market helpers", () => {
  it("takes the median the way percentile_cont(0.5) does", () => {
    const page = (prices: number[]) => ({
      items: prices.map((price, id) => ({ id, price, quantityAvailable: 1, condition: "NM" as const })),
      page: 0,
      size: 100,
      totalItems: prices.length,
      totalPages: 1,
    });
    expect(marketSnapshotFrom(page([900, 1200, 1100]))).toEqual({
      listingCount: 3,
      low: 900,
      median: 1100,
      high: 1200,
    });
    expect(marketSnapshotFrom(page([1000, 1200]))?.median).toBe(1100);
    expect(marketSnapshotFrom(page([]))).toBeNull();
  });

  it("prices like AutoPriceCalculator: median × (1 + offset), held between the bounds", () => {
    expect(
      autoPricePreview({ median: 1358, offsetPercent: -5, floor: null, ceiling: null }),
    ).toEqual({ price: 1290.1, heldAt: null });
    expect(
      autoPricePreview({ median: 1358, offsetPercent: -5, floor: 1300, ceiling: 1500 }),
    ).toEqual({ price: 1300, heldAt: "floor" });
    expect(
      autoPricePreview({ median: 2000, offsetPercent: 0, floor: 1000, ceiling: 1500 }),
    ).toEqual({ price: 1500, heldAt: "ceiling" });
  });

  it("labels a printing like CatalogVariant.label()", () => {
    const variant = {
      languageCode: "EN",
      finish: "FOIL",
      edition: "NOT_APPLICABLE",
      printingNote: "Alt Art",
    } as CatalogVariant;
    expect(variantLabelOf(variant)).toBe("EN / FOIL / Alt Art");
  });

  it("keeps a leading minus and two decimals in the offset", () => {
    expect(sanitizeSignedDecimal("-5.555")).toBe("-5.55");
    expect(sanitizeSignedDecimal("12a")).toBe("12");
  });
});
