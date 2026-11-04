import { describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { ordersApi } from "@/features/account/orders.api";
import type { ReorderItemsResponse } from "@/features/account/orders.types";

describe("ordersApi.getReorderItems", () => {
  it("calls GET /orders/:orderId/reorder-items", async () => {
    const mockResponse: ReorderItemsResponse = {
      orderId: 101,
      orderNumber: "ORD-101",
      items: [
        {
          orderItemId: 1,
          catalogVariantId: 10,
          productSlug: "charizard-ex",
          productName: "Charizard ex",
          variantLabel: "EN / FOIL • Obsidian Flames #125",
          rarity: "HOLO",
          imageUrl: undefined,
          originalCondition: "NM",
          originalPrice: 150,
          originalQuantity: 1,
          originalSellerName: "Card Kingdom TH",
        },
      ],
    };

    const getSpy = vi.spyOn(api, "get").mockResolvedValue(mockResponse);

    const result = await ordersApi.getReorderItems(101);

    expect(getSpy).toHaveBeenCalledWith("/orders/101/reorder-items");
    expect(result).toEqual(mockResponse);
  });

  it("calls GET /orders/:orderId/reorder-items through getReorderPreview for backwards compatibility", async () => {
    const mockResponse: ReorderItemsResponse = {
      orderId: 101,
      orderNumber: "ORD-101",
      items: [],
    };

    const getSpy = vi.spyOn(api, "get").mockResolvedValue(mockResponse);

    const result = await ordersApi.getReorderPreview(101);

    expect(getSpy).toHaveBeenCalledWith("/orders/101/reorder-items");
    expect(result).toEqual(mockResponse);
  });
});
