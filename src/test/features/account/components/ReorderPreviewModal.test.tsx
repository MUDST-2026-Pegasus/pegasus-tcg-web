import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/utils";
import { ReorderPreviewModal } from "@/features/account/components/ReorderPreviewModal";
import * as orderQueries from "@/features/account/orders.queries";
import { cartApi } from "@/features/cart/cart.api";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import type { CartResponse } from "@/features/cart/cart.types";
import type {
  OrderDetails,
  ReorderPreviewResponse,
} from "@/features/account/orders.types";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockOrder: OrderDetails = {
  id: 67,
  orderNumber: "PGS-20261016Z-000067",
  buyerId: 1,
  status: "COMPLETED",
  currency: "THB",
  itemsSubtotal: 8000,
  shippingTotal: 0,
  discountTotal: 0,
  grandTotal: 8000,
  shippingAddressId: 1,
  shippingAddressSnapshot: null,
  buyerNote: null,
  placedAt: "2026-10-17T12:00:00Z",
  paidAt: "2026-10-17T12:05:00Z",
  completedAt: "2026-10-19T14:00:00Z",
  cancelledAt: null,
  sellerOrders: [
    {
      id: 88,
      salesOrderId: 67,
      sellerProfileId: 1,
      sellerName: "Card Kingdom TH",
      sellerOrderNumber: "SO-88",
      status: "COMPLETED",
      itemsSubtotal: 8000,
      shippingFee: 0,
      discountAmount: 0,
      grandTotal: 8000,
      commissionAmount: 0,
      sellerNetAmount: 8000,
      acceptedAt: null,
      shippedAt: null,
      deliveredAt: null,
      autoCompleteAt: null,
      completedAt: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: "2026-10-17T12:00:00Z",
      items: [
        {
          id: 501,
          listingId: 10,
          catalogVariantId: 10,
          quantity: 1,
          unitPrice: 8000,
          lineTotal: 8000,
          productName: "Bio-Broly (SR)",
          variantLabel: "JP • FOIL",
          condition: "DMG",
          gameName: "Dragon Ball Super Card Game",
          imageKey: null,
          imageUrl: null,
          unitIds: [1],
        },
      ],
      shipments: [],
      statusHistory: [],
    },
  ],
};

const mockPreviewData: ReorderPreviewResponse = {
  orderId: 67,
  sellerOrders: [
    {
      sellerProfileId: 1,
      sellerName: "Card Kingdom TH",
      sellerAvailable: true,
      vacationMode: false,
      items: [
        {
          originalOrderItemId: 501,
          catalogVariantId: 10,
          productName: "Bio-Broly (SR)",
          variantLabel: "JP • FOIL • Dragon Ball Super Card Game",
          originalCondition: "DMG",
          originalPrice: 8000,
          originalQuantity: 1,
          imageUrl: null,
          currentListing: {
            listingId: 1001,
            condition: "NM",
            price: 9500,
            quantityAvailable: 2,
            isAvailable: true,
          },
          alternativeConditions: [
            {
              listingId: 1002,
              condition: "LP",
              price: 8900,
              quantityAvailable: 1,
              isAvailable: true,
            },
            {
              listingId: 1003,
              condition: "MP",
              price: 8500,
              quantityAvailable: 0,
              isAvailable: false,
            },
          ],
          status: "AVAILABLE",
        },
        {
          originalOrderItemId: 502,
          catalogVariantId: 11,
          productName: "Mega Evolution Booster Box",
          variantLabel: "EN • Factory Sealed Box",
          originalCondition: "SEALED",
          originalPrice: 7750,
          originalQuantity: 1,
          imageUrl: null,
          currentListing: null,
          alternativeConditions: [],
          status: "OUT_OF_STOCK",
        },
      ],
    },
  ],
};

describe("ReorderPreviewModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    vi.spyOn(toast, "add").mockImplementation(vi.fn());
    vi.spyOn(cartApi, "addBatchItems").mockResolvedValue({
      id: 1,
      userId: 1,
      sessionKey: null,
      currency: "THB",
      items: [],
      totalQuantity: 1,
      itemsSubtotal: 9500,
      expiresAt: null,
    } as CartResponse);
  });

  it("renders modal header, seller info, blue alert banner, and order item from API query", () => {
    vi.spyOn(orderQueries, "useReorderPreview").mockReturnValue({
      data: mockPreviewData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderPreview>);

    renderWithProviders(
      <ReorderPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        orderId={67}
        order={mockOrder}
      />
    );

    expect(
      screen.getByRole("heading", { name: /reorder items \(สั่งซื้อสินค้าอีกครั้ง\)/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/card kingdom th/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/#pgs-20261016z-000067/i)).toBeInTheDocument();

    // Blue alert banner text
    expect(
      screen.getByText(/รายการที่เลือกจะถูกเพิ่มเข้าตะกร้าสินค้าและติ๊กเลือกให้อัตโนมัติ/i)
    ).toBeInTheDocument();

    // Item details
    expect(screen.getByText("Bio-Broly (SR)")).toBeInTheDocument();
    expect(screen.getByText(/previously ordered:/i)).toBeInTheDocument();
    expect(screen.getByText(/dmg \(฿8,000\)/i)).toBeInTheDocument();

    // Price change warning tag because NM price is 9500 vs original 8000
    expect(screen.getByText(/ราคาเปลี่ยนแปลงจากตอนที่เคยซื้อ/i)).toBeInTheDocument();

    // Condition Guide link
    expect(screen.getByText(/condition guide \(คู่มือสภาพการ์ด\)/i)).toBeInTheDocument();

    // Out of stock item details
    expect(screen.getByText("Mega Evolution Booster Box")).toBeInTheDocument();
    expect(screen.getByText(/out of stock from this seller/i)).toBeInTheDocument();

    // CTA button
    expect(screen.getByRole("button", { name: /สั่งสินค้านี้อีกครั้ง/i })).toBeInTheDocument();
  });

  it("allows selecting available card conditions and updates price, max quantity, and subtotal", async () => {
    const user = userEvent.setup();
    vi.spyOn(orderQueries, "useReorderPreview").mockReturnValue({
      data: mockPreviewData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderPreview>);

    renderWithProviders(
      <ReorderPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        orderId={67}
      />
    );

    // Initial default condition is NM (9,500)
    expect(screen.getByRole("button", { name: /^nm/i })).toBeInTheDocument();
    expect(screen.getAllByText("฿9,500").length).toBeGreaterThanOrEqual(1);

    // Select LP (8,900)
    const lpBtn = screen.getByRole("button", { name: /^lp/i });
    await user.click(lpBtn);

    // Subtotal updates to LP price
    expect(screen.getAllByText("฿8,900").length).toBeGreaterThanOrEqual(1);
  });

  it("does not allow selecting disabled/out-of-stock condition pills", async () => {
    const user = userEvent.setup();
    vi.spyOn(orderQueries, "useReorderPreview").mockReturnValue({
      data: mockPreviewData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderPreview>);

    renderWithProviders(
      <ReorderPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        orderId={67}
      />
    );

    // MP is out of stock (not a button, but aria-disabled)
    const mpPill = screen.getByText(/^mp$/i).closest("[aria-disabled='true']");
    expect(mpPill).toBeInTheDocument();

    if (mpPill) {
      await user.click(mpPill);
    }

    // Subtotal should remain at NM price (9,500)
    expect(screen.getAllByText("฿9,500").length).toBeGreaterThanOrEqual(1);
  });

  it("allows adjusting quantity with stepper and triggers onConfirmReorder with payload", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirmReorder = vi.fn();

    vi.spyOn(orderQueries, "useReorderPreview").mockReturnValue({
      data: mockPreviewData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderPreview>);

    renderWithProviders(
      <ReorderPreviewModal
        isOpen={true}
        onClose={onClose}
        orderId={67}
        onConfirmReorder={onConfirmReorder}
      />
    );

    // Increase quantity from 1 to 2 (max for NM is 2)
    const plusBtn = screen.getByRole("button", { name: /increase quantity/i });
    await user.click(plusBtn);

    // Plus button should now be disabled because max stock (2) reached
    expect(plusBtn).toBeDisabled();

    // Subtotal should be 9500 * 2 = 19,000
    expect(screen.getAllByText("฿19,000").length).toBeGreaterThanOrEqual(1);

    // Click CTA button
    const ctaBtn = screen.getByRole("button", { name: /สั่งสินค้านี้อีกครั้ง/i });
    await user.click(ctaBtn);

    await waitFor(() => {
      expect(onConfirmReorder).toHaveBeenCalledWith([
        {
          listingId: 1001,
          quantity: 2,
        },
      ]);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("submits batch add to cart and navigates to /cart with reorderListingIds on success", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const addBatchSpy = vi.spyOn(cartApi, "addBatchItems").mockResolvedValue({
      id: 1,
      userId: 1,
      sessionKey: null,
      currency: "THB",
      items: [],
      totalQuantity: 1,
      itemsSubtotal: 9500,
      expiresAt: null,
    });

    vi.spyOn(orderQueries, "useReorderPreview").mockReturnValue({
      data: mockPreviewData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderPreview>);

    renderWithProviders(
      <ReorderPreviewModal
        isOpen={true}
        onClose={onClose}
        orderId={67}
      />
    );

    const ctaBtn = screen.getByRole("button", { name: /สั่งสินค้านี้อีกครั้ง/i });
    await user.click(ctaBtn);

    await waitFor(() => {
      expect(addBatchSpy).toHaveBeenCalledWith([
        {
          listingId: 1001,
          quantity: 1,
        },
      ]);
      expect(onClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/cart", {
        state: { reorderListingIds: [1001] },
      });
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "เพิ่มสินค้าเข้าตะกร้าแล้ว",
        })
      );
    });
  });

  it("handles 409 conflict error without closing modal and displays specific card name", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const conflictError = new ApiError({
      status: 409,
      code: "LISTING_NOT_PURCHASABLE",
      message: "Listing 1001 is not available for purchase",
      details: { listingId: 1001 },
    });
    vi.spyOn(cartApi, "addBatchItems").mockRejectedValue(conflictError);

    vi.spyOn(orderQueries, "useReorderPreview").mockReturnValue({
      data: mockPreviewData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderPreview>);

    renderWithProviders(
      <ReorderPreviewModal
        isOpen={true}
        onClose={onClose}
        orderId={67}
      />
    );

    const ctaBtn = screen.getByRole("button", { name: /สั่งสินค้านี้อีกครั้ง/i });
    await user.click(ctaBtn);

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(within(alert).getByText(/Bio-Broly \(SR\)/)).toBeInTheDocument();
      expect(
        screen.getByText(/สินค้าหมดสต็อกหรือไม่พร้อมจำหน่าย กรุณาเลือกสภาพการ์ดอื่น/)
      ).toBeInTheDocument();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "สินค้าบางรายการไม่สามารถสั่งซื้อได้",
        })
      );
    });

    // Modal should NOT be closed
    expect(onClose).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("renders vacation mode warning banner and disables CTA button when seller is on vacation", () => {
    const vacationData: ReorderPreviewResponse = {
      orderId: 67,
      sellerOrders: [
        {
          ...mockPreviewData.sellerOrders[0],
          sellerAvailable: false,
          vacationMode: true,
        },
      ],
    };

    vi.spyOn(orderQueries, "useReorderPreview").mockReturnValue({
      data: vacationData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderPreview>);

    renderWithProviders(
      <ReorderPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        orderId={67}
      />
    );

    // Vacation warning banner
    expect(screen.getByText(/ร้านค้าเปิดโหมดพักร้อนอยู่ในขณะนี้/i)).toBeInTheDocument();
    expect(
      screen.getByText(/ผู้ขายกำลังอยู่ในช่วงพักร้อน ไม่สามารถสั่งซื้อสินค้าจากร้านค้านี้ได้ชั่วคราว/i)
    ).toBeInTheDocument();

    // CTA button is disabled
    const ctaBtn = screen.getByRole("button", { name: /สั่งสินค้านี้อีกครั้ง/i });
    expect(ctaBtn).toBeDisabled();
  });

  it("renders loading skeleton while query is loading", () => {
    vi.spyOn(orderQueries, "useReorderPreview").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderPreview>);

    renderWithProviders(
      <ReorderPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        orderId={67}
      />
    );

    expect(screen.getByTestId("reorder-skeleton")).toBeInTheDocument();
  });

  it("renders error state with retry button when query fails", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    vi.spyOn(orderQueries, "useReorderPreview").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof orderQueries.useReorderPreview>);

    renderWithProviders(
      <ReorderPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        orderId={67}
      />
    );

    expect(
      screen.getByText(/ไม่สามารถโหลดข้อมูลรายการสั่งซื้อซ้ำได้/i)
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /ลองใหม่/i });
    await user.click(retryBtn);

    expect(refetch).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    vi.spyOn(orderQueries, "useReorderPreview").mockReturnValue({
      data: mockPreviewData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderPreview>);

    renderWithProviders(
      <ReorderPreviewModal
        isOpen={true}
        onClose={onClose}
        orderId={67}
      />
    );

    const closeBtn = screen.getByRole("button", { name: /close/i });
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
