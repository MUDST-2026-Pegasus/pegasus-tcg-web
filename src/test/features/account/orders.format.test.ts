import { describe, expect, it } from "vitest";

import {
  formatOrderStatus,
  getOrderStatusBadge,
  snakeCaseToTitleCase,
} from "@/features/account/orders.format";

describe("orders.format", () => {
  describe("snakeCaseToTitleCase", () => {
    it("converts snake_case to title case", () => {
      expect(snakeCaseToTitleCase("RETURN_REQUESTED")).toBe("Return Requested");
      expect(snakeCaseToTitleCase("AWAITING_SHIPMENT")).toBe("Awaiting Shipment");
      expect(snakeCaseToTitleCase("PENDING")).toBe("Pending");
    });

    it("handles empty or falsy strings gracefully", () => {
      expect(snakeCaseToTitleCase("")).toBe("");
    });
  });

  describe("formatOrderStatus", () => {
    it("formats known backend status enums accurately", () => {
      expect(formatOrderStatus("PENDING_PAYMENT")).toBe("Pending Payment");
      expect(formatOrderStatus("PAID")).toBe("Paid");
      expect(formatOrderStatus("PREPARING")).toBe("Processing");
      expect(formatOrderStatus("PROCESSING")).toBe("Processing");
      expect(formatOrderStatus("SHIPPED")).toBe("Shipped");
      expect(formatOrderStatus("DELIVERED")).toBe("Completed");
      expect(formatOrderStatus("COMPLETED")).toBe("Completed");
      expect(formatOrderStatus("CANCELLED")).toBe("Cancelled");
      expect(formatOrderStatus("CANCELED")).toBe("Cancelled");
    });

    it("handles case-insensitive and trimmed inputs", () => {
      expect(formatOrderStatus("pending_payment")).toBe("Pending Payment");
      expect(formatOrderStatus("  paid  ")).toBe("Paid");
      expect(formatOrderStatus("preparing")).toBe("Processing");
      expect(formatOrderStatus("processing")).toBe("Processing");
    });

    it("falls back to title case for other SNAKE_CASE statuses", () => {
      expect(formatOrderStatus("RETURN_REQUESTED")).toBe("Return Requested");
      expect(formatOrderStatus("REFUNDED")).toBe("Refunded");
      expect(formatOrderStatus("CUSTOM_UNKNOWN_STATUS")).toBe("Custom Unknown Status");
    });

    it("returns empty string for null, undefined, or empty values", () => {
      expect(formatOrderStatus(null)).toBe("");
      expect(formatOrderStatus(undefined)).toBe("");
      expect(formatOrderStatus("")).toBe("");
    });
  });

  describe("getOrderStatusBadge", () => {
    it("returns correct variant and class for PENDING_PAYMENT", () => {
      const result = getOrderStatusBadge("PENDING_PAYMENT");
      expect(result.label).toBe("Pending Payment");
      expect(result.variant).toBe("secondary");
      expect(result.className).toContain("bg-amber-500");
    });

    it("returns correct variant and class for PAID and PROCESSING", () => {
      const paidResult = getOrderStatusBadge("PAID");
      expect(paidResult.label).toBe("Paid");
      expect(paidResult.variant).toBe("secondary");
      expect(paidResult.className).toContain("bg-blue-100");

      const procResult = getOrderStatusBadge("PROCESSING");
      expect(procResult.label).toBe("Processing");
      expect(procResult.variant).toBe("secondary");
      expect(procResult.className).toContain("bg-blue-100");
    });

    it("returns correct variant and class for SHIPPED", () => {
      const result = getOrderStatusBadge("SHIPPED");
      expect(result.label).toBe("Shipped");
      expect(result.variant).toBe("secondary");
      expect(result.className).toContain("bg-purple-100");
    });

    it("returns correct variant and class for COMPLETED and DELIVERED", () => {
      const compResult = getOrderStatusBadge("COMPLETED");
      expect(compResult.label).toBe("Completed");
      expect(compResult.variant).toBe("secondary");
      expect(compResult.className).toContain("bg-emerald-100");

      const delivResult = getOrderStatusBadge("DELIVERED");
      expect(delivResult.label).toBe("Completed");
      expect(delivResult.variant).toBe("secondary");
      expect(delivResult.className).toContain("bg-emerald-100");
    });

    it("returns outline variant for CANCELLED", () => {
      const result = getOrderStatusBadge("CANCELLED");
      expect(result.label).toBe("Cancelled");
      expect(result.variant).toBe("outline");
    });

    it("returns outline fallback for unknown statuses", () => {
      const result = getOrderStatusBadge("UNKNOWN_STATUS");
      expect(result.label).toBe("Unknown Status");
      expect(result.variant).toBe("outline");
    });
  });
});
