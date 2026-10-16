import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShipmentForm } from "@/features/seller/orders/components/ShipmentForm";
import { OrderDetailContent } from "@/features/seller/orders/components/detail/OrderDetailContent";
import * as ordersApi from "@/features/seller/orders/orders.api";
import type { SellerOrderDetail } from "@/features/seller/orders/orders.types";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/seller/orders/orders.api", () => ({
  shipSellerOrder: vi.fn(),
  acceptSellerOrder: vi.fn(),
  cancelSellerOrder: vi.fn(),
}));
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

const paidOrder: SellerOrderDetail = {
  summary: {
    order: {
      id: 41,
      salesOrderId: 9,
      sellerProfileId: 3,
      sellerOrderNumber: "PGS-20261013-000009-S3",
      status: "PAID",
      itemsSubtotal: 1800,
      shippingFee: 50,
      discountAmount: 0,
      grandTotal: 1850,
      commissionAmount: 92.5,
      sellerNetAmount: 1757.5,
      acceptedAt: null,
      shippedAt: null,
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
    buyer: { id: 5, username: "nattapong_p", displayName: "Nattapong", avatarUrl: null },
    paidAt: "2026-10-13T03:00:00Z",
    shipBy: "2026-10-15T03:00:00Z",
    shippingAddressSnapshot: null,
    buyerNote: null,
  },
  payment: null,
  costTotal: 980,
  buyerOrderCount: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ordersApi.shipSellerOrder).mockResolvedValue(paidOrder);
});

describe("confirming a shipment", () => {
  it("asks again on the order list before the parcel is marked as shipped", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShipmentForm orderId={41} orderNumber="PGS-20261013-000009-S3" />);

    await user.type(screen.getByRole("textbox", { name: /เลขพัสดุ/ }), "TH2408000091");
    await user.click(screen.getByRole("button", { name: "ยืนยันจัดส่ง" }));

    // ส่งแล้วย้อนไม่ได้ — ต้องเห็นสรุปก่อน และยังไม่ยิงอะไรไป
    const dialog = screen.getByRole("alertdialog", { name: "ยืนยันจัดส่ง PGS-20261013-000009-S3?" });
    expect(dialog).toHaveTextContent("Kerry Express");
    expect(dialog).toHaveTextContent("TH2408000091");
    expect(ordersApi.shipSellerOrder).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "กลับไปแก้" }));
    expect(ordersApi.shipSellerOrder).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "ยืนยันจัดส่ง" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "ยืนยันจัดส่ง" }),
    );

    await waitFor(() =>
      expect(ordersApi.shipSellerOrder).toHaveBeenCalledWith(41, {
        carrierCode: "KERRY",
        carrierName: "Kerry Express",
        trackingNumber: "TH2408000091",
      }),
    );
    expect(ordersApi.shipSellerOrder).toHaveBeenCalledTimes(1);
  });

  it("asks again on the order detail page too", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrderDetailContent detail={paidOrder} />);

    await user.type(screen.getByPlaceholderText(/TH2408/), "TH2408000091");
    await user.click(screen.getByRole("button", { name: "ยืนยันจัดส่ง" }));

    const dialog = screen.getByRole("alertdialog", { name: "ยืนยันจัดส่ง PGS-20261013-000009-S3?" });
    expect(ordersApi.shipSellerOrder).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "ยืนยันจัดส่ง" }));

    await waitFor(() => expect(ordersApi.shipSellerOrder).toHaveBeenCalledTimes(1));
  });
});
