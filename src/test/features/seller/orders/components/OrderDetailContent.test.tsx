import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OrderDetailContent } from "@/features/seller/orders/components/detail/OrderDetailContent";
import * as ordersApi from "@/features/seller/orders/orders.api";
import type { SellerOrderDetail } from "@/features/seller/orders/orders.types";
import type { SellerOrderStatus } from "@/features/seller/shared/seller.types";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

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
}

describe("OrderDetailContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:order-summary"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

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

  it("downloads the seller PDF once, preserves its filename, and reports success", async () => {
    const pdf = new Blob(["%PDF-test"], { type: "application/pdf" });
    let finish!: (value: Awaited<ReturnType<typeof ordersApi.downloadSellerOrderSummary>>) => void;
    vi.spyOn(ordersApi, "downloadSellerOrderSummary").mockReturnValue(new Promise((resolve) => {
      finish = resolve;
    }));
    let downloadedFilename = "";
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloadedFilename = this.download;
    });
    const user = userEvent.setup();
    renderWithProviders(<OrderDetailContent detail={detail("PAID")} />);

    const button = screen.getByRole("button", { name: "Download Order Summary (PDF)" });
    await user.click(button);
    expect(ordersApi.downloadSellerOrderSummary).toHaveBeenCalledOnce();
    expect(ordersApi.downloadSellerOrderSummary).toHaveBeenCalledWith(41);
    expect(screen.getByRole("button", { name: "กำลังสร้าง PDF..." })).toBeDisabled();

    finish({
      blob: pdf,
      filename: "order-summary-PGS-20261013-000009.pdf",
    });

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(downloadedFilename).toBe("order-summary-PGS-20261013-000009.pdf");
    expect(URL.createObjectURL).toHaveBeenCalledWith(pdf);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:order-summary");
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
      type: "success",
      title: "ดาวน์โหลด Order Summary แล้ว",
    }));
  });

  it("shows an actionable error and does not create a file when the order is hidden", async () => {
    vi.spyOn(ordersApi, "downloadSellerOrderSummary").mockRejectedValue(new ApiError({
      status: 404,
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
    }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderWithProviders(<OrderDetailContent detail={detail("COMPLETED")} />);

    await user.click(screen.getByRole("button", { name: "Download Order Summary (PDF)" }));

    await waitFor(() => expect(toast.add).toHaveBeenCalledWith({
      type: "error",
      title: "ดาวน์โหลด Order Summary ไม่สำเร็จ",
      description: "ไม่พบคำสั่งซื้อนี้ในร้านของคุณ",
    }));
    expect(click).not.toHaveBeenCalled();
  });
});
