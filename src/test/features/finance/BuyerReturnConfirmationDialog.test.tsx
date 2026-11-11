import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import type { SellerOrderDetails } from "@/features/account/orders.types";
import { BuyerReturnConfirmationDialog } from "@/features/finance/components/BuyerReturnConfirmationDialog";
import { renderWithProviders } from "@/test/utils";
import type { Language } from "@/lib/i18n";

const order: SellerOrderDetails = {
  id: 12,
  salesOrderId: 1,
  sellerProfileId: 2,
  sellerName: "minmin_tcg",
  sellerOrderNumber: "PGS-20261030-0123-S12",
  status: "SHIPPED",
  itemsSubtotal: 830,
  shippingFee: 45,
  discountAmount: 99.06,
  grandTotal: 775.94,
  commissionAmount: 39,
  sellerNetAmount: 786,
  acceptedAt: null,
  shippedAt: "2026-10-30T00:00:00Z",
  deliveredAt: null,
  autoCompleteAt: "2026-11-06T00:00:00Z",
  completedAt: null,
  cancelledAt: null,
  cancelReason: null,
  createdAt: "2026-10-30T00:00:00Z",
  items: [{
    id: 3,
    listingId: 4,
    catalogVariantId: 5,
    quantity: 1,
    unitPrice: 380,
    lineTotal: 380,
    productName: "Gengar",
    variantLabel: "Holo Rare",
    condition: "NM",
    gameName: "Pokemon",
    imageKey: null,
    unitIds: [10],
    discountAllocated: 45.35,
    sellerDiscountAllocated: 22.89,
    platformDiscountAllocated: 22.46,
    refundEstimatePerUnit: 334.65,
  }],
  shipments: [],
  statusHistory: [],
  promotions: [
    { code: "MINMIN50", ownerType: "SELLER", sellerProfileId: 2, amount: 50, status: "CONSUMED" },
    { code: "PEGASUS10", ownerType: "PLATFORM", sellerProfileId: null, amount: 49.06, status: "CONSUMED" },
  ],
};

function renderDialog(currentOrder: SellerOrderDetails, quantities = { 3: 1 }, language: Language = "th") {
  return renderWithProviders(
    <BuyerReturnConfirmationDialog
      open
      onOpenChange={vi.fn()}
      order={currentOrder}
      quantities={quantities}
      reason="NOT_AS_DESCRIBED"
      reasons={["NOT_AS_DESCRIBED", "OTHER"]}
      onReasonChange={vi.fn()}
      isSubmitting={false}
      onConfirm={vi.fn()}
    />,
    { language },
  );
}

describe("BuyerReturnConfirmationDialog", () => {
  it("shows the API's per-item discount allocations and refund estimate", () => {
    renderDialog(order);

    expect(screen.getByRole("heading", { name: "ขอคืน Gengar · Holo Rare?" })).toBeInTheDocument();
    expect(screen.getByText("ส่วนลดร้านต่อใบ · MINMIN50")).toBeInTheDocument();
    expect(screen.getByText("ส่วนลด Pegasus ต่อใบ · PEGASUS10")).toBeInTheDocument();
    expect(screen.getByText("− ฿22.89")).toBeInTheDocument();
    expect(screen.getByText("− ฿22.46")).toBeInTheDocument();
    expect(screen.getByText("฿334.65")).toBeInTheDocument();
    expect(screen.getByText(/ยอดจริงยืนยันหลังร้านรับของคืน/)).toBeInTheDocument();
  });

  it("keeps the no-discount dialog free of promotion allocation details", () => {
    renderDialog({
      ...order,
      discountAmount: 0,
      promotions: [],
      items: [{ ...order.items[0], discountAllocated: 0, sellerDiscountAllocated: 0, platformDiscountAllocated: 0 }],
    });

    expect(screen.getByRole("heading", { name: "ยืนยันคำขอคืนสินค้า" })).toBeInTheDocument();
    expect(screen.getByText("Gengar × 1")).toBeInTheDocument();
    expect(screen.queryByText(/ส่วนลดร้านต่อใบ/)).not.toBeInTheDocument();
    expect(screen.queryByText("ยอดคืนโดยประมาณ")).not.toBeInTheDocument();
    expect(screen.queryByText(/โค้ดไม่ได้คืนสิทธิ์/)).not.toBeInTheDocument();
  });

  it("renders in English with zero Thai UI text when language is en", () => {
    renderDialog(order, { 3: 1 }, "en");
    expect(screen.getByRole("heading", { name: "Return Gengar · Holo Rare?" })).toBeInTheDocument();
    expect(screen.getByText("Store discount per card · MINMIN50")).toBeInTheDocument();
    expect(screen.getByText("Pegasus discount per card · PEGASUS10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit return request" })).toBeInTheDocument();
  });
});
