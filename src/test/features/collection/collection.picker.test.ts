import { afterEach, describe, expect, it, vi } from "vitest";

import { addCollectionItems } from "@/features/collection/collection.api";
import {
  DEFAULT_DRAFT,
  clampQuantity,
  metaOf,
  resolveVariantId,
  toPayload,
  variantLabelOf,
} from "@/features/collection/collection.picker";
import type { CollectionVariant } from "@/features/collection/collection.types";
import { api } from "@/lib/api";

function variant(id: number, active = true): CollectionVariant {
  return { id, sku: `SKU-${id}`, languageCode: "EN", finish: "FOIL", edition: "UNLIMITED", printingNote: null, active };
}

describe("variantLabelOf", () => {
  it("reads like the label on a collection card", () => {
    expect(variantLabelOf(variant(1))).toBe("EN / FOIL / UNLIMITED");
  });

  it("drops the parts a product does not have", () => {
    expect(variantLabelOf({ ...variant(1), finish: "NOT_APPLICABLE", edition: "NOT_APPLICABLE" })).toBe("EN");
    expect(variantLabelOf({ ...variant(1), edition: "NOT_APPLICABLE", printingNote: "Staff stamp" })).toBe(
      "EN / FOIL / Staff stamp",
    );
  });
});

describe("metaOf", () => {
  it("joins the card number and rarity", () => {
    expect(metaOf({ cardNumber: "161/131", rarityCode: "SIR" })).toBe("161/131 · SIR");
  });

  it("leaves out whatever a product does not have", () => {
    expect(metaOf({ cardNumber: null, rarityCode: "SIR" })).toBe("SIR");
    expect(metaOf({ cardNumber: null, rarityCode: null })).toBe("");
  });
});

describe("clampQuantity", () => {
  it("keeps the quantity inside what the API accepts", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(3.9)).toBe(3);
    expect(clampQuantity(12000)).toBe(9999);
  });

  it("falls back to one card when the box is empty", () => {
    expect(clampQuantity(Number.NaN)).toBe(1);
  });
});

describe("resolveVariantId", () => {
  it("picks the only printing without asking", () => {
    expect(resolveVariantId(DEFAULT_DRAFT, [variant(7)])).toBe(7);
  });

  it("waits for a choice when there are several printings", () => {
    expect(resolveVariantId(DEFAULT_DRAFT, [variant(7), variant(8)])).toBeNull();
    expect(resolveVariantId({ ...DEFAULT_DRAFT, variantId: 8 }, [variant(7), variant(8)])).toBe(8);
  });

  it("ignores retired printings", () => {
    expect(resolveVariantId(DEFAULT_DRAFT, [variant(7, false), variant(8)])).toBe(8);
    expect(resolveVariantId({ ...DEFAULT_DRAFT, variantId: 7 }, [variant(7, false)])).toBeNull();
  });

  it("has nothing to offer while printings are still loading", () => {
    expect(resolveVariantId(DEFAULT_DRAFT, undefined)).toBeNull();
  });
});

describe("toPayload", () => {
  it("adds a card without a photo when none was uploaded", () => {
    expect(toPayload(7, { variantId: 7, condition: "LP", quantity: 2 }, null, true)).toEqual({
      catalogVariantId: 7,
      imageKey: null,
      publicItem: true,
      condition: "LP",
      quantity: 2,
    });
  });

  it("sends a usable quantity even when the box was left empty", () => {
    expect(toPayload(7, { ...DEFAULT_DRAFT, quantity: Number.NaN }, "collections/a.jpg", false)).toMatchObject({
      imageKey: "collections/a.jpg",
      publicItem: false,
      quantity: 1,
    });
  });
});

describe("addCollectionItems", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps adding after one card fails and reports each outcome in order", async () => {
    const post = vi
      .spyOn(api, "post")
      .mockResolvedValueOnce({ id: 1 })
      .mockRejectedValueOnce(new Error("Variant is no longer available"))
      .mockResolvedValueOnce({ id: 3 });

    const outcomes = await addCollectionItems([
      { catalogVariantId: 1, imageKey: null, publicItem: true },
      { catalogVariantId: 2, imageKey: null, publicItem: true },
      { catalogVariantId: 3, imageKey: null, publicItem: true },
    ]);

    expect(post).toHaveBeenCalledTimes(3);
    expect(outcomes.map((outcome) => outcome.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
  });
});
