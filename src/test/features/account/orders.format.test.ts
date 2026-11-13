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
      expect(formatOrderStatus("PENDING_PAYMENT")).toBe("รอชำระเงิน");
      expect(formatOrderStatus("PAID")).toBe("ชำระแล้ว");
      expect(formatOrderStatus("PREPARING")).toBe("กำลังเตรียมสินค้า");
      expect(formatOrderStatus("PROCESSING")).toBe("กำลังเตรียมสินค้า");
      expect(formatOrderStatus("SHIPPED")).toBe("จัดส่งแล้ว");
      expect(formatOrderStatus("DELIVERED")).toBe("สำเร็จ");
      expect(formatOrderStatus("COMPLETED")).toBe("สำเร็จ");
      expect(formatOrderStatus("CANCELLED")).toBe("ยกเลิกแล้ว");
      expect(formatOrderStatus("CANCELED")).toBe("ยกเลิกแล้ว");
    });

    it("handles case-insensitive and trimmed inputs", () => {
      expect(formatOrderStatus("pending_payment")).toBe("รอชำระเงิน");
      expect(formatOrderStatus("  paid  ")).toBe("ชำระแล้ว");
      expect(formatOrderStatus("preparing")).toBe("กำลังเตรียมสินค้า");
      expect(formatOrderStatus("processing")).toBe("กำลังเตรียมสินค้า");
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
      expect(result.label).toBe("รอชำระเงิน");
      expect(result.variant).toBe("secondary");
      expect(result.className).toContain("bg-amber-500");
    });

    it("returns correct variant and class for PAID and PROCESSING", () => {
      const paidResult = getOrderStatusBadge("PAID");
      expect(paidResult.label).toBe("ชำระแล้ว");
      expect(paidResult.variant).toBe("secondary");
      expect(paidResult.className).toContain("bg-blue-100");

      const procResult = getOrderStatusBadge("PROCESSING");
      expect(procResult.label).toBe("กำลังเตรียมสินค้า");
      expect(procResult.variant).toBe("secondary");
      expect(procResult.className).toContain("bg-blue-100");
    });

    it("returns correct variant and class for SHIPPED", () => {
      const result = getOrderStatusBadge("SHIPPED");
      expect(result.label).toBe("จัดส่งแล้ว");
      expect(result.variant).toBe("secondary");
      expect(result.className).toContain("bg-purple-100");
    });

    it("returns correct variant and class for COMPLETED and DELIVERED", () => {
      const compResult = getOrderStatusBadge("COMPLETED");
      expect(compResult.label).toBe("สำเร็จ");
      expect(compResult.variant).toBe("secondary");
      expect(compResult.className).toContain("bg-emerald-100");

      const delivResult = getOrderStatusBadge("DELIVERED");
      expect(delivResult.label).toBe("สำเร็จ");
      expect(delivResult.variant).toBe("secondary");
      expect(delivResult.className).toContain("bg-emerald-100");
    });

    it("returns outline variant for CANCELLED", () => {
      const result = getOrderStatusBadge("CANCELLED");
      expect(result.label).toBe("ยกเลิกแล้ว");
      expect(result.variant).toBe("outline");
    });

    it("returns outline fallback for unknown statuses", () => {
      const result = getOrderStatusBadge("UNKNOWN_STATUS");
      expect(result.label).toBe("Unknown Status");
      expect(result.variant).toBe("outline");
    });
  });
});
