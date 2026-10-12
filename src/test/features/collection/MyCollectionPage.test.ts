import { describe, expect, it } from "vitest";

import { payloadOf } from "@/features/collection/collection.payload";
import type { CollectionItem } from "@/features/collection/collection.types";

describe("collection updates", () => {
  it("changes visibility without clearing the owner's other card fields", () => {
    const item = {
      card: { variantId: 7 }, imageKey: "collections/photo.jpg", publicItem: false,
      condition: "NM", quantity: 1, acquiredPrice: 120, personalNote: "First pull",
      gradingCompany: null, gradeValue: null, certNumber: null, acquiredAt: null,
    } as CollectionItem;

    expect(payloadOf(item, { publicItem: true })).toMatchObject({
      catalogVariantId: 7, imageKey: "collections/photo.jpg", publicItem: true,
      acquiredPrice: 120, personalNote: "First pull",
    });
  });
});
