import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "@/test/utils";
import { ReorderPreviewModal } from "@/features/account/components/ReorderPreviewModal";
import * as orderQueries from "@/features/account/orders.queries";
import type {
  OrderDetails,
  ReorderItemsResponse,
} from "@/features/account/orders.types";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockReorderResponse: ReorderItemsResponse = {
  orderId: 67,
  orderNumber: "PGS-TEST-REORDER-001",
  items: [
    {
      orderItemId: 1,
      catalogVariantId: 101,
      productSlug: "charizard-ex",
      productName: "Charizard ex",
      variantLabel: "EN / FOIL • Obsidian Flames #125",
      rarity: "HOLO",
      imageUrl: "https://example.com/charizard.png",
      originalCondition: "NM",
      originalPrice: 150,
      originalQuantity: 1,
      originalSellerName: "Card Kingdom TH",
    },
    {
      orderItemId: 2,
      catalogVariantId: 102,
      productSlug: "bio-broly-sr",
      productName: "Bio-Broly (SR)",
      variantLabel: "JP / FOIL • Dragon Ball Super Card Game",
      rarity: "SR",
      imageUrl: undefined,
      originalCondition: "DMG",
      originalPrice: 8000,
      originalQuantity: 1,
      originalSellerName: "Dragon Ball Store",
    },
    {
      orderItemId: 3,
      catalogVariantId: 103,
      productSlug: "son-goku-gt-scr",
      productName: "Son Goku : GT (SCR)",
      variantLabel: "EN / FOIL • Perfect Combination #BT18",
      rarity: "SCR",
      imageUrl: undefined,
      originalCondition: "NM",
      originalPrice: 3400,
      originalQuantity: 1,
      originalSellerName: "Goku Central",
    },
  ],
};

describe("ReorderPreviewModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the list of cards matching the mock data", () => {
    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: mockReorderResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(<ReorderPreviewModal isOpen orderId={67} />);

    // Header title and order number
    expect(
      screen.getByRole("heading", { name: /สั่งซื้อสินค้าอีกครั้ง/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/#pgs-test-reorder-001/i)).toBeInTheDocument();

    // Card Names
    expect(screen.getByText("Charizard ex")).toBeInTheDocument();
    expect(screen.getByText("Bio-Broly (SR)")).toBeInTheDocument();
    expect(screen.getByText("Son Goku : GT (SCR)")).toBeInTheDocument();

    // Rarity badges
    expect(screen.getByText("HOLO")).toBeInTheDocument();
    expect(screen.getByText("SR")).toBeInTheDocument();
    expect(screen.getByText("SCR")).toBeInTheDocument();

    // Variant / Set descriptions
    expect(
      screen.getByText("EN / FOIL • Obsidian Flames #125")
    ).toBeInTheDocument();
    expect(
      screen.getByText("JP / FOIL • Dragon Ball Super Card Game")
    ).toBeInTheDocument();
    expect(
      screen.getByText("EN / FOIL • Perfect Combination #BT18")
    ).toBeInTheDocument();

    // Action buttons
    const reorderButtons = screen.getAllByRole("button", {
      name: /สั่งซื้ออีกครั้ง/i,
    });
    expect(reorderButtons).toHaveLength(3);

    // Footer elements
    expect(
      screen.getByText("คลิกเพื่อไปดูสต็อกและราคาปัจจุบันในหน้ารายละเอียดสินค้า")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ปิด" })).toBeInTheDocument();
  });

  it("displays 'สภาพเดิม: {condition}' and 'ราคาเดิมที่เคยซื้อ...' correctly", () => {
    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: mockReorderResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(<ReorderPreviewModal isOpen orderId={67} />);

    // Condition Badges
    const nmBadges = screen.getAllByText("สภาพเดิม: NM");
    expect(nmBadges).toHaveLength(2);
    expect(screen.getByText("สภาพเดิม: DMG")).toBeInTheDocument();

    // Previous Purchase Tags
    expect(
      screen.getByText(/ราคาเดิมที่เคยซื้อ.*THB 150.00.*จำนวน 1 ใบ/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ราคาเดิมที่เคยซื้อ.*THB 8,000.00.*จำนวน 1 ใบ/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ราคาเดิมที่เคยซื้อ.*THB 3,400.00.*จำนวน 1 ใบ/)
    ).toBeInTheDocument();
  });

  it("triggers onClose and navigates to /products/${item.productSlug} when clicking 'สั่งซื้ออีกครั้ง →'", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: mockReorderResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(
      <ReorderPreviewModal isOpen onClose={handleClose} orderId={67} />
    );

    const reorderButtons = screen.getAllByRole("button", {
      name: /สั่งซื้ออีกครั้ง/i,
    });
    await user.click(reorderButtons[0]);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/products/charizard-ex");
  });

  it("navigates to /products/${item.catalogVariantId} as fallback when productSlug is missing", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    const noSlugResponse: ReorderItemsResponse = {
      orderId: 67,
      orderNumber: "PGS-TEST-REORDER-002",
      items: [
        {
          orderItemId: 1,
          catalogVariantId: 136,
          productSlug: "",
          productName: "Playmat",
          variantLabel: "ACCESSORY",
          originalCondition: "SEALED",
          originalPrice: 900,
          originalQuantity: 1,
        },
      ],
    };

    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: noSlugResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(
      <ReorderPreviewModal isOpen onClose={handleClose} orderId={67} />
    );

    const reorderButtons = screen.getAllByRole("button", {
      name: /สั่งซื้ออีกครั้ง/i,
    });
    await user.click(reorderButtons[0]);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/products/136");
  });

  it("deduplicates identical cards in an order and renders only 1 row", () => {
    const duplicatedResponse: ReorderItemsResponse = {
      orderId: 67,
      orderNumber: "PGS-TEST-DUPLICATES",
      items: [
        {
          orderItemId: 1,
          catalogVariantId: 101,
          productSlug: "charizard-ex",
          productName: "Charizard ex",
          variantLabel: "EN / FOIL • Obsidian Flames #125",
          rarity: "HOLO",
          imageUrl: "https://example.com/charizard.png",
          originalCondition: "NM",
          originalPrice: 150,
          originalQuantity: 1,
          originalSellerName: "Card Kingdom TH",
        },
        {
          orderItemId: 2,
          catalogVariantId: 101,
          productSlug: "charizard-ex",
          productName: "Charizard ex",
          variantLabel: "EN / FOIL • Obsidian Flames #125",
          rarity: "HOLO",
          imageUrl: "https://example.com/charizard.png",
          originalCondition: "NM",
          originalPrice: 150,
          originalQuantity: 2,
          originalSellerName: "Card Kingdom TH",
        },
        {
          orderItemId: 3,
          catalogVariantId: 102,
          productSlug: "bio-broly-sr",
          productName: "Bio-Broly (SR)",
          variantLabel: "JP / FOIL • Dragon Ball Super Card Game",
          rarity: "SR",
          imageUrl: undefined,
          originalCondition: "DMG",
          originalPrice: 8000,
          originalQuantity: 1,
          originalSellerName: "Dragon Ball Store",
        },
      ],
    };

    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: duplicatedResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(<ReorderPreviewModal isOpen orderId={67} />);

    // Charizard ex should appear only ONCE
    const charizards = screen.getAllByText("Charizard ex");
    expect(charizards).toHaveLength(1);

    // Total reorder buttons should be 2 (Charizard ex + Bio-Broly (SR))
    const reorderButtons = screen.getAllByRole("button", {
      name: /สั่งซื้ออีกครั้ง/i,
    });
    expect(reorderButtons).toHaveLength(2);
  });

  it("triggers onClose when clicking 'ปิด'", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: mockReorderResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(
      <ReorderPreviewModal isOpen onClose={handleClose} orderId={67} />
    );

    const closeBtn = screen.getByRole("button", { name: "ปิด" });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("triggers onClose when clicking (✕) close button in header", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: mockReorderResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(
      <ReorderPreviewModal isOpen onClose={handleClose} orderId={67} />
    );

    const closeIconBtn = screen.getByRole("button", { name: "ปิดหน้าต่าง" });
    await user.click(closeIconBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders loading skeleton while fetching reorder data", () => {
    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(<ReorderPreviewModal isOpen orderId={67} />);

    expect(screen.getByTestId("reorder-skeleton")).toBeInTheDocument();
  });

  it("renders error state with retry button when query fails", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(<ReorderPreviewModal isOpen orderId={67} />);

    expect(
      screen.getByText("ไม่สามารถโหลดข้อมูลรายการสั่งซื้อซ้ำได้")
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /ลองใหม่/i });
    await user.click(retryBtn);

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when there are no items in reorder response", () => {
    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: {
        orderId: 67,
        orderNumber: "PGS-TEST-EMPTY",
        items: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(<ReorderPreviewModal isOpen orderId={67} />);

    expect(
      screen.getByText("ไม่พบรายการสินค้าในคำสั่งซื้อนี้")
    ).toBeInTheDocument();
  });

  it("falls back to order prop items when query data is not yet available", () => {
    const fallbackOrder: OrderDetails = {
      id: 88,
      orderNumber: "ORD-88-FALLBACK",
      buyerId: 1,
      status: "COMPLETED",
      currency: "THB",
      itemsSubtotal: 500,
      shippingTotal: 0,
      discountTotal: 0,
      grandTotal: 500,
      shippingAddressId: 1,
      shippingAddressSnapshot: null,
      buyerNote: null,
      placedAt: "2026-11-01T00:00:00Z",
      paidAt: "2026-11-01T00:05:00Z",
      completedAt: "2026-11-02T00:00:00Z",
      cancelledAt: null,
      sellerOrders: [
        {
          id: 1,
          salesOrderId: 88,
          sellerProfileId: 1,
          sellerOrderNumber: "SO-1",
          status: "COMPLETED",
          itemsSubtotal: 500,
          shippingFee: 0,
          discountAmount: 0,
          grandTotal: 500,
          commissionAmount: 0,
          sellerNetAmount: 500,
          acceptedAt: null,
          shippedAt: null,
          deliveredAt: null,
          autoCompleteAt: null,
          completedAt: null,
          cancelledAt: null,
          cancelReason: null,
          createdAt: "2026-11-01T00:00:00Z",
          shipments: [],
          statusHistory: [],
          items: [
            {
              id: 991,
              listingId: 55,
              catalogVariantId: 205,
              quantity: 2,
              unitPrice: 250,
              lineTotal: 500,
              productName: "Fallback Card",
              variantLabel: "TH / NON-FOIL",
              condition: "LP",
              gameName: "Pokemon",
              imageKey: null,
              imageUrl: null,
              unitIds: [1, 2],
            },
          ],
        },
      ],
    };

    vi.spyOn(orderQueries, "useReorderItems").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof orderQueries.useReorderItems>);

    renderWithProviders(
      <ReorderPreviewModal isOpen order={fallbackOrder} orderId={88} />
    );

    expect(screen.getByText("Fallback Card")).toBeInTheDocument();
    expect(screen.getByText("สภาพเดิม: LP")).toBeInTheDocument();
    expect(
      screen.getByText(/ราคาเดิมที่เคยซื้อ.*THB 250.00.*จำนวน 2 ใบ/)
    ).toBeInTheDocument();
  });
});
