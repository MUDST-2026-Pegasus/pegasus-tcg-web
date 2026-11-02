import { describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { ordersApi } from "@/features/account/orders.api";
import type { ReorderPreviewResponse } from "@/features/account/orders.types";

describe("ordersApi.getReorderPreview", () => {
  it("calls GET /orders/:orderId/reorder-preview", async () => {
    const mockResponse: ReorderPreviewResponse = {
      orderId: 101,
      sellerOrders: [
        {
          sellerProfileId: 1,
          sellerName: "Card Kingdom TH",
          sellerAvailable: true,
          vacationMode: false,
          items: [],
        },
      ],
    };

    const getSpy = vi.spyOn(api, "get").mockResolvedValue(mockResponse);

    const result = await ordersApi.getReorderPreview(101);

    expect(getSpy).toHaveBeenCalledWith("/orders/101/reorder-preview");
    expect(result).toEqual(mockResponse);
  });
});
