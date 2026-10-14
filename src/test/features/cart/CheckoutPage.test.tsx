import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient, render } from "@/test/utils";
import { CheckoutPage } from "@/features/cart/pages/CheckoutPage";
import * as authQueries from "@/features/auth/auth.queries";
import * as cartQueries from "@/features/cart/cart.queries";
import * as addressQueries from "@/features/account/address.queries";
import { checkoutApi } from "@/features/cart/checkout.api";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import type { CartResponse } from "@/features/cart/cart.types";
import type { Address } from "@/features/account/address.types";
import type { CheckoutResponse } from "@/features/cart/checkout.types";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCart: CartResponse = {
  id: 1,
  userId: 10,
  sessionKey: null,
  currency: "THB",
  totalQuantity: 2,
  itemsSubtotal: 800,
  expiresAt: null,
  items: [
    {
      id: 42,
      cartId: 1,
      listingId: 101,
      quantity: 1,
      unitPriceAtAdd: 300,
      currentPrice: 300,
      priceChanged: false,
      purchasable: true,
      quantityAvailable: 5,
      sellerProfileId: 1,
      catalogVariantId: 201,
      condition: "Near Mint",
      currency: "THB",
      addedAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      productName: "Pikachu Illustrator",
      variantLabel: "Holo",
      sellerName: "Store A",
      imageUrl: "https://example.com/pika.png",
      productId: 1,
    },
    {
      id: 45,
      cartId: 1,
      listingId: 102,
      quantity: 2,
      unitPriceAtAdd: 250,
      currentPrice: 250,
      priceChanged: false,
      purchasable: true,
      quantityAvailable: 10,
      sellerProfileId: 2,
      catalogVariantId: 202,
      condition: "Lightly Played",
      currency: "THB",
      addedAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      productName: "Charizard Base Set",
      variantLabel: "1st Edition",
      sellerName: "Store B",
      imageUrl: "https://example.com/char.png",
      productId: 2,
    },
  ],
};

const mockAddresses: Address[] = [
  {
    id: 1,
    userId: 10,
    label: "Home",
    recipientName: "Ash Ketchum",
    phone: "0812345678",
    line1: "123 Pallet Town",
    line2: null,
    subdistrict: "Kanto",
    district: "Pallet",
    province: "Bangkok",
    postalCode: "10110",
    countryCode: "TH",
    defaultShipping: true,
    defaultBilling: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    userId: 10,
    label: "Office",
    recipientName: "Ash Ketchum",
    phone: "0898765432",
    line1: "456 Oak Lab",
    line2: null,
    subdistrict: "Kanto",
    district: "Pallet",
    province: "Bangkok",
    postalCode: "10120",
    countryCode: "TH",
    defaultShipping: false,
    defaultBilling: false,
    createdAt: "2026-01-02T00:00:00Z",
  },
];

function renderCheckout(
  initialEntry: string | { pathname: string; search?: string; state?: unknown },
) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <CheckoutPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toast, "add").mockImplementation(vi.fn());

    vi.spyOn(authQueries, "useAuth").mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
    } as unknown as ReturnType<typeof authQueries.useAuth>);

    vi.spyOn(cartQueries, "useCart").mockReturnValue({
      data: mockCart,
      isLoading: false,
      isFetching: false,
      error: null,
    } as unknown as ReturnType<typeof cartQueries.useCart>);

    vi.spyOn(addressQueries, "useAddresses").mockReturnValue({
      data: mockAddresses,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof addressQueries.useAddresses>);
  });

  it("filters checkout items using URL query param (?items=42)", () => {
    renderCheckout("/checkout?items=42");

    // Only Pikachu should be shown, not Charizard
    expect(screen.getByText("Pikachu Illustrator")).toBeInTheDocument();
    expect(screen.queryByText("Charizard Base Set")).not.toBeInTheDocument();

    // Subtotal should be ฿300, shipping ฿50 (1 seller), grand total ฿350
    expect(screen.getByText("฿350")).toBeInTheDocument();
  });

  it("filters multiple checkout items using URL query param (?items=42,45)", () => {
    renderCheckout("/checkout?items=42,45");

    expect(screen.getByText("Pikachu Illustrator")).toBeInTheDocument();
    // Pikachu + Charizard (1 other item)
    expect(screen.getByText("+ 1 other item")).toBeInTheDocument();

    // Subtotal: 300 + (250*2) = 800. Sellers: Store A and Store B (2 sellers) -> 100 shipping fee. Grand Total: ฿900
    expect(screen.getByText("฿900")).toBeInTheDocument();
  });

  it("checks out only the clicked product and listing from the product query", () => {
    renderCheckout("/checkout?productId=2&listingId=102");

    expect(screen.getByText("Charizard Base Set")).toBeInTheDocument();
    expect(screen.queryByText("Pikachu Illustrator")).not.toBeInTheDocument();
  });

  it("falls back to location.state.selectedCartItemIds when query param is absent", () => {
    renderCheckout({
      pathname: "/checkout",
      state: { selectedCartItemIds: [45] },
    });

    expect(screen.getByText("Charizard Base Set")).toBeInTheDocument();
    expect(screen.queryByText("Pikachu Illustrator")).not.toBeInTheDocument();

    // Subtotal: 500, shipping 50 (1 seller) -> ฿550
    expect(screen.getByText("฿550")).toBeInTheDocument();
  });

  it("redirects to /cart with a toast notification when checkoutItems is empty after cart loads", async () => {
    renderCheckout("/checkout?items=999");

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "ไม่พบสินค้าที่เลือกสั่งซื้อ",
          type: "warning",
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/cart", { replace: true });
    });
  });

  it("waits for a background cart refresh before deciding the selected item is missing", () => {
    vi.spyOn(cartQueries, "useCart").mockReturnValue({
      data: { ...mockCart, items: [] },
      isLoading: false,
      isFetching: true,
      error: null,
    } as unknown as ReturnType<typeof cartQueries.useCart>);

    renderCheckout("/checkout?items=900&productId=1&listingId=101");

    expect(mockNavigate).not.toHaveBeenCalledWith("/cart", { replace: true });
    expect(toast.add).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "ไม่พบสินค้าที่เลือกสั่งซื้อ" }),
    );
  });

  it("derives activeAddress from default shipping address without useEffect setState", () => {
    renderCheckout("/checkout?items=42");

    // Active address should be defaultShipping address (id: 1, 123 Pallet Town)
    expect(screen.getByText(/123 Pallet Town/i)).toBeInTheDocument();
  });

  it("flags the missing shipping address in red and explains why Purchase is disabled", () => {
    vi.spyOn(addressQueries, "useAddresses").mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof addressQueries.useAddresses>);

    renderCheckout("/checkout?items=42");

    expect(screen.getByText("please enter your address").parentElement).toHaveClass(
      "text-destructive",
    );
    expect(screen.getByRole("button", { name: /^Purchase$/i })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please add a shipping address to continue.",
    );
  });

  it("does not show the missing address hint once an address is available", () => {
    renderCheckout("/checkout?items=42");

    expect(screen.getByText(/123 Pallet Town/i).parentElement).not.toHaveClass(
      "text-destructive",
    );
    expect(screen.getByRole("button", { name: /^Purchase$/i })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("submits checkout with crypto.randomUUID idempotency key and navigates to /payment?orderId={id}", async () => {
    const user = userEvent.setup();
    const mockOrderResponse: CheckoutResponse = {
      orderId: 1001,
      orderNumber: "ORD-1001",
      buyerId: 10,
      status: "PENDING_PAYMENT",
      currency: "THB",
      itemsSubtotal: 300,
      shippingTotal: 50,
      discountTotal: 0,
      grandTotal: 350,
      placedAt: "2026-01-01T00:00:00Z",
      sellerOrders: [],
      replayed: false,
    };

    const checkoutSpy = vi
      .spyOn(checkoutApi, "checkout")
      .mockResolvedValueOnce(mockOrderResponse);

    renderCheckout("/checkout?items=42");

    const purchaseButton = screen.getByRole("button", { name: /^Purchase$/i });
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(checkoutSpy).toHaveBeenCalledTimes(1);
    });

    const [payload, idempotencyKey] = checkoutSpy.mock.calls[0];
    expect(payload).toEqual({
      cartItemIds: [42],
      shippingAddressId: 1,
    });
    // Verify idempotencyKey is a valid UUID v4
    expect(idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    expect(mockNavigate).toHaveBeenCalledWith("/payment?orderId=1001", {
      state: {
        orderId: 1001,
        order: mockOrderResponse,
      },
    });
  });

  it("handles 409 INSUFFICIENT_STOCK error during checkout", async () => {
    const user = userEvent.setup();
    vi.spyOn(checkoutApi, "checkout").mockRejectedValueOnce(
      new ApiError({
        status: 409,
        code: "INSUFFICIENT_STOCK",
        message: "Item 42 is out of stock",
      }),
    );

    renderCheckout("/checkout?items=42");

    const purchaseButton = screen.getByRole("button", { name: /^Purchase$/i });
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Insufficient Stock",
          description: "Item 42 is out of stock",
          type: "error",
        }),
      );
    });
  });
});
