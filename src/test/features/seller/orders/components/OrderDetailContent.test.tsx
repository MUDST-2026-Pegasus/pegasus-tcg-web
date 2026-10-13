import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { OrderDetailContent } from "@/features/seller/orders/components/detail/OrderDetailContent";
import type { SellerOrderDetail } from "@/features/seller/orders/orders.types";
import type { SellerOrderStatus } from "@/features/seller/shared/seller.types";
import { renderWithProviders } from "@/test/utils";

function detail(status: SellerOrderStatus): SellerOrderDetail {
  return {
    summary: {
      order: {
        id: 41,
        salesOrderId: 9,
        sellerProfileId: 3,
        sellerOrderNumber: "PGS-20261013-000009-S3",
        status,
        itemsSubtotal: 1800,
        shippingFee: 50,
        discountAmount: 0,
        grandTotal: 1850,
        commissionAmount: 92.5,
        sellerNetAmount: 1757.5,
        acceptedAt: null,
        shippedAt: "2026-10-13T05:00:00Z",
        deliveredAt: null,
        autoCompleteAt: null,
        completedAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: "2026-10-13T02:00:00Z",
        items: [],
        shipments: [],
        statusHistory: [],
        sellerName: null,
      },
      orderNumber: "PGS-20261013-000009",
      buyer: { id: 5, username: "nattapong_p", displayName: "Nattapong" },
      paidAt: "2026-10-13T03:00:00Z",
      shipBy: "2026-10-15T03:00:00Z",
      shippingAddressSnapshot: null,
      buyerNote: null,
    },
    payment: null,
    costTotal: 980,
    buyerOrderCount: 1,
  };
}

describe("OrderDetailContent", () => {
  it("sends the seller to the returns page to answer a return request", () => {
    renderWithProviders(<OrderDetailContent detail={detail("RETURN_REQUESTED")} />);

    // หน้านี้อนุมัติ/ปฏิเสธคำขอคืนไม่ได้ ต้องมีทางไปหน้าที่ทำได้
    expect(screen.getByRole("button", { name: "ตอบคำขอคืนสินค้า" })).toHaveAttribute(
      "href",
      "/seller/returns",
    );
  });

  it("still links the returns page once the return is settled", () => {
    renderWithProviders(<OrderDetailContent detail={detail("REFUNDED")} />);

    expect(screen.getByRole("button", { name: "ดูคำขอคืนสินค้า" })).toHaveAttribute(
      "href",
      "/seller/returns",
    );
  });

  it("offers no returns link on an order that was never returned", () => {
    renderWithProviders(<OrderDetailContent detail={detail("SHIPPED")} />);

    expect(screen.queryByRole("button", { name: /คำขอคืนสินค้า/ })).not.toBeInTheDocument();
  });
});
