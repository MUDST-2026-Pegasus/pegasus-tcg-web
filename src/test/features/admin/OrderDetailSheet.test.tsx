import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { toast } from "@/components/ui/toast";
import * as ordersApi from "@/features/admin/orders.api";
import type { AdminOrderDetail } from "@/features/admin/orders.types";
import { OrderDetailSheet } from "@/features/admin/components/OrderDetailSheet";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

vi.mock("@/features/admin/orders.api", () => ({
  getOrderBoard: vi.fn(),
  getAdminOrders: vi.fn(),
  getAdminOrder: vi.fn(),
  downloadAdminOrderSummary: vi.fn(),
}));

const detail: AdminOrderDetail = {
  summary: {
    sellerOrderId: 12,
    sellerOrderNumber: "PGS-20261030-0123-S12",
    salesOrderId: 1,
    orderNumber: "PGS-20261030-0123",
    status: "COMPLETED",
    grandTotal: 775.94,
    itemCount: 1,
    seller: { id: 2, username: "minmin_tcg", displayName: "minmin_tcg" },
    buyer: { id: 3, username: "buyer", displayName: "Buyer" },
    createdAt: "2026-10-30T00:00:00Z",
    paidAt: "2026-10-30T01:00:00Z",
    shippedAt: "2026-10-31T00:00:00Z",
    completedAt: "2026-11-01T00:00:00Z",
    cancelledAt: null,
    tracking: null,
    returnReasonCode: null,
    reviewRating: null,
  },
  order: {
    id: 12,
    salesOrderId: 1,
    sellerProfileId: 2,
    sellerOrderNumber: "PGS-20261030-0123-S12",
    status: "COMPLETED",
    itemsSubtotal: 830,
    shippingFee: 45,
    discountAmount: 99.06,
    grandTotal: 775.94,
    commissionAmount: 39,
    sellerNetAmount: 786,
    acceptedAt: null,
    shippedAt: null,
    deliveredAt: null,
    autoCompleteAt: null,
    completedAt: "2026-11-01T00:00:00Z",
    cancelledAt: null,
    cancelReason: null,
    createdAt: "2026-10-30T00:00:00Z",
    items: [],
    shipments: [],
    statusHistory: [],
    sellerName: "minmin_tcg",
    sellerDiscount: 50,
    platformDiscount: 49.06,
    platformSubsidy: 49.06,
    commissionBase: 780,
    promotions: [
      { code: "MINMIN50", ownerType: "SELLER", amount: 50 },
      { code: "PEGASUS10", ownerType: "PLATFORM", amount: 49.06 },
    ],
  },
  shippingAddressSnapshot: null,
  buyerNote: null,
  payment: null,
};

describe("OrderDetailSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:admin-order-summary"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("shows one per-shop table row with split codes and the O1 payable/commission/net values", async () => {
    vi.mocked(ordersApi.getAdminOrder).mockResolvedValue(detail);
    renderWithProviders(<OrderDetailSheet sellerOrderId={12} onClose={vi.fn()} />);

    const table = await screen.findByRole("table", { name: "ยอดเงินตามร้าน" });
    expect(table).toHaveTextContent("minmin_tcg");
    expect(table).toHaveTextContent("MINMIN50");
    expect(table).toHaveTextContent("PEGASUS10");
    expect(table).toHaveTextContent("฿775.94");
    expect(table).toHaveTextContent("฿39.00");
    expect(table).toHaveTextContent("฿786.00");
    expect(screen.queryByText("ส่วนลด", { exact: true })).not.toBeInTheDocument();
  });

  it("keeps the existing amount summary for orders without promotions", async () => {
    vi.mocked(ordersApi.getAdminOrder).mockResolvedValue({
      ...detail,
      order: { ...detail.order, discountAmount: 0, sellerDiscount: 0, platformDiscount: 0, promotions: [] },
    });
    renderWithProviders(<OrderDetailSheet sellerOrderId={12} onClose={vi.fn()} />);

    expect(await screen.findByText("ค่าสินค้า")).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "ยอดเงินตามร้าน" })).not.toBeInTheDocument();
  });

  it("downloads the selected seller order PDF once and preserves its filename", async () => {
    vi.mocked(ordersApi.getAdminOrder).mockResolvedValue(detail);
    const pdf = new Blob(["%PDF-test"], { type: "application/pdf" });
    let finish!: (value: Awaited<ReturnType<typeof ordersApi.downloadAdminOrderSummary>>) => void;
    vi.mocked(ordersApi.downloadAdminOrderSummary).mockReturnValue(new Promise((resolve) => {
      finish = resolve;
    }));
    let downloadedFilename = "";
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloadedFilename = this.download;
    });
    const user = userEvent.setup();
    renderWithProviders(<OrderDetailSheet sellerOrderId={12} onClose={vi.fn()} />);

    const button = await screen.findByRole("button", { name: "ดาวน์โหลดสรุปคำสั่งซื้อ (PDF)" });
    await user.click(button);

    expect(ordersApi.downloadAdminOrderSummary).toHaveBeenCalledOnce();
    expect(ordersApi.downloadAdminOrderSummary).toHaveBeenCalledWith(12);
    const loadingButton = screen.getByRole("button", { name: "กำลังสร้าง PDF..." });
    expect(loadingButton).toBeDisabled();
    await user.click(loadingButton);
    expect(ordersApi.downloadAdminOrderSummary).toHaveBeenCalledOnce();

    finish({ blob: pdf, filename: "order-summary-PGS-20261030-0123.pdf" });

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(downloadedFilename).toBe("order-summary-PGS-20261030-0123.pdf");
    expect(URL.createObjectURL).toHaveBeenCalledWith(pdf);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:admin-order-summary");
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
      type: "success",
      title: "ดาวน์โหลด Order Summary แล้ว",
    }));
  });

  it("shows an actionable error without creating a file when the order is missing", async () => {
    vi.mocked(ordersApi.getAdminOrder).mockResolvedValue(detail);
    vi.mocked(ordersApi.downloadAdminOrderSummary).mockRejectedValue(new ApiError({
      status: 404,
      code: "ORDER_NOT_FOUND",
      message: "ไม่พบคำสั่งซื้อ",
    }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderWithProviders(<OrderDetailSheet sellerOrderId={12} onClose={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: "ดาวน์โหลดสรุปคำสั่งซื้อ (PDF)" }));

    await waitFor(() => expect(toast.add).toHaveBeenCalledWith({
      type: "error",
      title: "ดาวน์โหลด Order Summary ไม่สำเร็จ",
      description: "ไม่พบคำสั่งซื้อที่เลือก หรือรายการถูกลบแล้ว",
    }));
    expect(click).not.toHaveBeenCalled();
  });
});
