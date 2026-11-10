import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSyncExternalStore } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { TolgeeProvider } from "@tolgee/react";
import { testTolgee } from "@/test/i18n";
import { createTestQueryClient, render } from "@/test/utils";
import { CheckoutPage } from "@/features/cart/pages/CheckoutPage";
import * as authQueries from "@/features/auth/auth.queries";
import * as cartQueries from "@/features/cart/cart.queries";
import * as addressQueries from "@/features/account/address.queries";
import { checkoutApi } from "@/features/cart/checkout.api";
import { cartApi } from "@/features/cart/cart.api";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import type { CartResponse } from "@/features/cart/cart.types";
import type { Address } from "@/features/account/address.types";
import type { CheckoutResponse } from "@/features/cart/checkout.types";
import { PROMOTION_SELECTION_KEY } from "@/features/cart/promotions.storage";

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
  const view = render(
    <QueryClientProvider client={queryClient}>
      <TolgeeProvider tolgee={testTolgee("th")} fallback={null}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <CheckoutPage />
        </MemoryRouter>
      </TolgeeProvider>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

const option = (id: number, name: string, fee: number) => ({
  id, name, carrierCode: "KERRY", baseFee: fee, perItemFee: 5,
  freeThreshold: null, estDaysMin: 1, estDaysMax: 3, fee, free: false, amountToFree: null,
});
const quoteA = { sellerProfileId: 1, sellerName: "Store A", itemCount: 1, itemsSubtotal: 300, defaultOptionId: 11, options: [option(11, "Kerry Express", 40), option(12, "EMS", 65)] };
const quoteB = { sellerProfileId: 2, sellerName: "Store B", itemCount: 2, itemsSubtotal: 500, defaultOptionId: 21, options: [{ ...option(21, "Flash", 0), free: true, freeThreshold: 500 }] };
const orderResponse: CheckoutResponse = { orderId: 1001, orderNumber: "ORD-1001", buyerId: 10, status: "PENDING_PAYMENT", currency: "THB", itemsSubtotal: 300, shippingTotal: 40, discountTotal: 0, grandTotal: 340, placedAt: "2026-01-01T00:00:00Z", sellerOrders: [], replayed: false };
const purchase = () => screen.getByRole("button", { name: "สั่งซื้อและไปชำระเงิน" });
async function ready() { await waitFor(() => expect(purchase()).toBeEnabled()); }

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.removeItem(PROMOTION_SELECTION_KEY);
    mockNavigate.mockReset();
    vi.spyOn(toast, "add").mockImplementation(vi.fn());
    vi.spyOn(authQueries, "useAuth").mockReturnValue({
      isAuthenticated: true, isLoading: false, user: { id: 10 },
    } as unknown as ReturnType<typeof authQueries.useAuth>);
    vi.spyOn(cartQueries, "useCart").mockReturnValue({
      data: mockCart, isLoading: false, isFetching: false, error: null,
    } as unknown as ReturnType<typeof cartQueries.useCart>);
    vi.spyOn(addressQueries, "useAddresses").mockReturnValue({
      data: mockAddresses, isLoading: false, error: null, refetch: vi.fn(),
    } as unknown as ReturnType<typeof addressQueries.useAddresses>);
    vi.spyOn(checkoutApi, "getShippingQuotes").mockImplementation(async (ids) =>
      [quoteA, quoteB].filter(q => ids.includes(q.sellerProfileId === 1 ? 42 : 45)));
    vi.spyOn(checkoutApi, "getPromotions").mockResolvedValue([]);
    vi.spyOn(checkoutApi, "previewPromotions").mockImplementation(async (request) => {
      const sellers = [
        ...(request.cartItemIds.includes(42) ? [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300, shippingFee: request.shippingOptionBySeller?.[1] === 12 ? 65 : 40, sellerDiscount: 0, platformDiscount: 0, grandTotal: request.shippingOptionBySeller?.[1] === 12 ? 365 : 340 }] : []),
        ...(request.cartItemIds.includes(45) ? [{ sellerProfileId: 2, sellerName: "Store B", itemsSubtotal: 500, shippingFee: 0, sellerDiscount: 0, platformDiscount: 0, grandTotal: 500 }] : []),
      ];
      return { sellers, itemsSubtotal: sellers.reduce((sum, seller) => sum + seller.itemsSubtotal, 0), shippingTotal: sellers.reduce((sum, seller) => sum + seller.shippingFee, 0), sellerDiscountTotal: 0, platformDiscountTotal: 0, grandTotal: sellers.reduce((sum, seller) => sum + seller.grandTotal, 0), shippingEstimated: false, codes: [], bestPick: null };
    });
  });

  it("quotes only selected cart items and uses the API fee instead of a flat 50", async () => {
    renderCheckout("/checkout?items=42");
    await ready();
    expect(checkoutApi.getShippingQuotes).toHaveBeenCalledWith([42]);
    expect(screen.getByText("Pikachu Illustrator")).toBeInTheDocument();
    expect(screen.queryByText("Charizard Base Set")).not.toBeInTheDocument();
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿340");
  });

  it("keeps cart promotion codes and submits the total returned by preview", async () => {
    sessionStorage.setItem(PROMOTION_SELECTION_KEY, JSON.stringify({ platformCode: "PEGASUS10", sellerCodes: { 1: "STORE50" } }));
    vi.spyOn(checkoutApi, "previewPromotions").mockImplementation(async (request) => ({
      sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300, shippingFee: 40, sellerDiscount: 50, platformDiscount: 29, grandTotal: 261 }],
      itemsSubtotal: 300, shippingTotal: 40, sellerDiscountTotal: 50, platformDiscountTotal: 29, grandTotal: 261,
      shippingEstimated: false, bestPick: null,
      codes: [{ code: request.platformCode || "", ownerType: "PLATFORM", sellerProfileId: null, sellerName: null, status: "APPLIED", discount: 29, shortfall: null, pendingShipping: false }],
    }));
    const submit = vi.spyOn(checkoutApi, "checkout").mockResolvedValue(orderResponse);
    renderCheckout("/checkout?items=42");
    await ready();
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿261");
    await userEvent.setup().click(purchase());
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0]).toEqual(expect.objectContaining({
      platformCode: "PEGASUS10", sellerCodes: { 1: "STORE50" }, expectedGrandTotal: 261,
    }));
    await waitFor(() => expect(sessionStorage.getItem(PROMOTION_SELECTION_KEY)).toBeNull());
  });

  it("asks for confirmation when the promotion total changes before ordering", async () => {
    sessionStorage.setItem(
      PROMOTION_SELECTION_KEY,
      JSON.stringify({ platformCode: "PEGASUS10", sellerCodes: {} }),
    );
    let changed = false;
    vi.spyOn(checkoutApi, "previewPromotions").mockImplementation(async (request) => ({
      sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300, shippingFee: 40, sellerDiscount: 0, platformDiscount: changed ? 40 : 0, grandTotal: changed ? 300 : 340 }],
      itemsSubtotal: 300, shippingTotal: 40, sellerDiscountTotal: 0,
      platformDiscountTotal: changed ? 40 : 0, grandTotal: changed ? 300 : 340,
      shippingEstimated: false,
      codes: request.platformCode
        ? [{ code: request.platformCode, ownerType: "PLATFORM", sellerProfileId: null, sellerName: null, status: "APPLIED", discount: changed ? 40 : 0, shortfall: null, pendingShipping: false }]
        : [],
      bestPick: null,
    }));
    const submit = vi.spyOn(checkoutApi, "checkout")
      .mockImplementationOnce(async () => { changed = true; throw new ApiError({ status: 409, code: "PROMO_CHANGED", message: "total changed", details: { grandTotal: 300, code: "PEGASUS10" } }); })
      .mockResolvedValue(orderResponse);
    renderCheckout("/checkout?items=42");
    await ready();
    await userEvent.setup().click(purchase());
    expect(await screen.findByRole("dialog", { name: "ยอดชำระเปลี่ยนไป" })).toBeInTheDocument();
    expect(screen.getByText(/ยอดเดิม: ฿340/)).toBeInTheDocument();
    expect(await screen.findByText(/ยอดใหม่: ฿300/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "สั่งซื้อด้วยยอดใหม่" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    expect(submit.mock.calls[1][0].expectedGrandTotal).toBe(300);
  });

  it("opens the seller picker when PROMO_CHANGED identifies a selected seller code", async () => {
    sessionStorage.setItem(
      PROMOTION_SELECTION_KEY,
      JSON.stringify({ platformCode: null, sellerCodes: { 1: "STORE50" } }),
    );
    vi.spyOn(checkoutApi, "previewPromotions").mockImplementation(async (request) => ({
      sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300, shippingFee: 40, sellerDiscount: 50, platformDiscount: 0, grandTotal: 290 }],
      itemsSubtotal: 300,
      shippingTotal: 40,
      sellerDiscountTotal: 50,
      platformDiscountTotal: 0,
      grandTotal: 290,
      shippingEstimated: false,
      codes: request.sellerCodes[1]
        ? [{ code: "STORE50", ownerType: "SELLER", sellerProfileId: 1, sellerName: "Store A", status: "APPLIED", discount: 50, shortfall: null, pendingShipping: false }]
        : [],
      bestPick: null,
    }));
    vi.spyOn(checkoutApi, "checkout").mockRejectedValueOnce(
      new ApiError({
        status: 409,
        code: "PROMO_CHANGED",
        message: "total changed",
        details: { grandTotal: 340, code: "STORE50" },
      }),
    );

    renderCheckout("/checkout?items=42");
    await ready();
    await userEvent.setup().click(purchase());
    await userEvent.setup().click(
      await screen.findByRole("button", { name: "เลือกโค้ดอื่น" }),
    );
    expect(await screen.findByRole("dialog", { name: "โค้ดร้าน Store A" })).toBeInTheDocument();
  });

  it("keeps the seller picker open and shows an invalid typed-code error", async () => {
    vi.spyOn(checkoutApi, "previewPromotions").mockImplementation(async (request) => ({
      sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300, shippingFee: 40, sellerDiscount: 0, platformDiscount: 0, grandTotal: 340 }],
      itemsSubtotal: 300,
      shippingTotal: 40,
      sellerDiscountTotal: 0,
      platformDiscountTotal: 0,
      grandTotal: 340,
      shippingEstimated: false,
      codes: request.sellerCodes[1]
        ? [{ code: request.sellerCodes[1], ownerType: "SELLER", sellerProfileId: 1, sellerName: "Store A", status: "PROMO_EXPIRED", discount: null, shortfall: null, pendingShipping: false }]
        : [],
      bestPick: null,
    }));

    renderCheckout("/checkout?items=42");
    await ready();
    await userEvent.setup().click(
      screen.getByRole("button", { name: /เลือกหรือกรอกโค้ด/ }),
    );
    const dialog = screen.getByRole("dialog", { name: "โค้ดร้าน Store A" });
    await userEvent.setup().type(within(dialog).getByLabelText("กรอกโค้ดอื่น"), "expired");
    await userEvent.setup().click(within(dialog).getByRole("button", { name: "ใช้โค้ด" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("โค้ดหมดอายุแล้ว");
    expect(dialog).toBeInTheDocument();
  });

  it("renders summary subtotal and shipping from the authoritative preview", async () => {
    vi.spyOn(checkoutApi, "previewPromotions").mockResolvedValue({
      sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 999, shippingFee: 77, sellerDiscount: 0, platformDiscount: 0, grandTotal: 1076 }],
      itemsSubtotal: 999,
      shippingTotal: 77,
      sellerDiscountTotal: 0,
      platformDiscountTotal: 0,
      grandTotal: 1076,
      shippingEstimated: false,
      codes: [],
      bestPick: null,
    });

    renderCheckout("/checkout?items=42");
    await ready();
    expect(screen.getByText("฿999")).toBeInTheDocument();
    expect(screen.getAllByText("฿77").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿1,076");
  });

  it("shows every item grouped by seller, physical quantity, and free shipping", async () => {
    renderCheckout("/checkout?items=42,45");
    await ready();
    expect(screen.getByText("Charizard Base Set")).toBeInTheDocument();
    expect(screen.getByText("ยอดสินค้า (3 ใบ)")).toBeInTheDocument();
    expect(screen.getByText("รวมร้านนี้ (2 ใบ)")).toBeInTheDocument();
    expect(screen.getAllByText("ส่งฟรี").length).toBeGreaterThan(0);
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿840");
  });

  it("supports a direct product/listing selection", async () => {
    renderCheckout("/checkout?productId=2&listingId=102");
    await ready();
    expect(checkoutApi.getShippingQuotes).toHaveBeenCalledWith([45]);
    expect(screen.queryByText("Pikachu Illustrator")).not.toBeInTheDocument();
  });

  it("supports selection passed in router state", async () => {
    renderCheckout({ pathname: "/checkout", state: { selectedCartItemIds: [45] } });
    await ready();
    expect(checkoutApi.getShippingQuotes).toHaveBeenCalledWith([45]);
  });

  it("redirects an empty selection to the cart", async () => {
    renderCheckout("/checkout?items=999");
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/cart", { replace: true }));
    expect(checkoutApi.getShippingQuotes).not.toHaveBeenCalled();
  });

  it("waits for a background cart refresh before redirecting", () => {
    vi.spyOn(cartQueries, "useCart").mockReturnValue({
      data: { ...mockCart, items: [] }, isLoading: false, isFetching: true,
    } as unknown as ReturnType<typeof cartQueries.useCart>);
    renderCheckout("/checkout?items=42");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("redirects changed selected prices to cart before requesting shipping quotes", async () => {
    vi.spyOn(cartQueries, "useCart").mockReturnValue({
      data: { ...mockCart, items: mockCart.items.map(item => ({ ...item, priceChanged: true, currentPrice: 200 })) },
      isLoading: false, isFetching: false, error: null,
    } as unknown as ReturnType<typeof cartQueries.useCart>);
    renderCheckout("/checkout?items=42");
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/cart", { replace: true }));
    expect(checkoutApi.getShippingQuotes).not.toHaveBeenCalled();
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "ราคาสินค้ามีการเปลี่ยนแปลง" }));
    expect(screen.queryByText("โหลดตัวเลือกจัดส่งไม่สำเร็จ")).not.toBeInTheDocument();
  });

  it("ignores changed prices on unselected items", async () => {
    vi.spyOn(cartQueries, "useCart").mockReturnValue({
      data: { ...mockCart, items: mockCart.items.map(item => item.id === 45 ? { ...item, priceChanged: true } : item) },
      isLoading: false, isFetching: false, error: null,
    } as unknown as ReturnType<typeof cartQueries.useCart>);
    renderCheckout("/checkout?items=42");
    await ready();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(checkoutApi.getShippingQuotes).toHaveBeenCalledWith([42]);
  });

  it("redirects unavailable selected items without requesting quotes", async () => {
    vi.spyOn(cartQueries, "useCart").mockReturnValue({
      data: { ...mockCart, items: mockCart.items.map(item => ({ ...item, purchasable: false })) },
      isLoading: false, isFetching: false, error: null,
    } as unknown as ReturnType<typeof cartQueries.useCart>);
    renderCheckout("/checkout?items=42");
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/cart", { replace: true }));
    expect(checkoutApi.getShippingQuotes).not.toHaveBeenCalled();
  });

  it("handles a price change detected by shipping quotes after the cart loaded", async () => {
    vi.spyOn(checkoutApi, "getShippingQuotes").mockRejectedValue(new ApiError({
      status: 409, code: "CART_PRICE_CHANGED", message: "Price changed",
    }));
    renderCheckout("/checkout?items=42");
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/cart", { replace: true }));
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "ราคาสินค้ามีการเปลี่ยนแปลง" }));
    expect(screen.queryByText("โหลดตัวเลือกจัดส่งไม่สำเร็จ")).not.toBeInTheDocument();
  });

  it("shows two skeletons and hides the total until shipping is loaded", () => {
    vi.spyOn(checkoutApi, "getShippingQuotes").mockReturnValue(new Promise(() => {}));
    renderCheckout("/checkout?items=42");
    expect(screen.getByRole("status", { name: "กำลังโหลดตัวเลือกจัดส่ง" })).toBeInTheDocument();
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("—");
    expect(purchase()).toBeDisabled();
  });

  it("blocks checkout when any selected seller cannot ship", async () => {
    vi.spyOn(checkoutApi, "getShippingQuotes").mockResolvedValue([quoteA, { ...quoteB, defaultOptionId: null, options: [] }]);
    const submit = vi.spyOn(checkoutApi, "checkout");
    renderCheckout("/checkout?items=42,45");
    expect(await screen.findByText("ร้านนี้ยังไม่ได้ตั้งค่าการจัดส่ง")).toBeInTheDocument();
    expect(purchase()).toBeDisabled();
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("—");
    expect(submit).not.toHaveBeenCalled();
  });

  it("blocks checkout on quote errors and retries explicitly", async () => {
    const user = userEvent.setup();
    vi.spyOn(checkoutApi, "getShippingQuotes").mockRejectedValueOnce(new Error("offline")).mockResolvedValue([quoteA]);
    renderCheckout("/checkout?items=42");
    expect(await screen.findByText("โหลดตัวเลือกจัดส่งไม่สำเร็จ")).toBeInTheDocument();
    expect(purchase()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
    await ready();
  });

  it("updates totals and submits the selected delivery option and address", async () => {
    const user = userEvent.setup();
    const submit = vi.spyOn(checkoutApi, "checkout").mockResolvedValue(orderResponse);
    renderCheckout("/checkout?items=42");
    await ready();
    await user.click(screen.getByRole("radio", { name: /EMS Store A/ }));
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿365");
    await user.click(purchase());
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0]).toEqual({ cartItemIds: [42], shippingAddressId: 1, shippingOptionBySeller: { 1: 12 }, platformCode: null, sellerCodes: {}, expectedGrandTotal: 365 });
    expect(submit.mock.calls[0][1]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(mockNavigate).toHaveBeenCalledWith("/payment?orderId=1001", { state: { orderId: 1001, order: orderResponse } });
  });

  it("keeps address changes as a draft until confirmed and does not refetch quotes", async () => {
    const user = userEvent.setup();
    const submit = vi.spyOn(checkoutApi, "checkout").mockResolvedValue(orderResponse);
    renderCheckout("/checkout?items=42");
    await ready();
    await user.click(screen.getByRole("button", { name: "เปลี่ยน" }));
    await user.click(screen.getByRole("radio", { name: /0898765432/ }));
    await user.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(screen.queryByText(/456 Oak Lab/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "เปลี่ยน" }));
    expect(screen.getByRole("radio", { name: /0812345678/ })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /0898765432/ }));
    await user.click(screen.getByRole("button", { name: "ใช้ที่อยู่นี้" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText(/456 Oak Lab/)).toBeInTheDocument();
    expect(checkoutApi.getShippingQuotes).toHaveBeenCalledTimes(1);
    await user.click(purchase());
    expect(submit.mock.calls[0][0].shippingAddressId).toBe(2);
  });

  it("shows an empty address dialog, disables confirmation, and opens the existing create form", async () => {
    const user = userEvent.setup();
    vi.spyOn(addressQueries, "useAddresses").mockReturnValue({
      data: [], isLoading: false, error: null,
    } as unknown as ReturnType<typeof addressQueries.useAddresses>);
    renderCheckout("/checkout?items=42");
    await waitFor(() => expect(checkoutApi.getShippingQuotes).toHaveBeenCalled());
    expect(purchase()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "เพิ่มที่อยู่" }));
    expect(screen.getByText("ยังไม่มีที่อยู่จัดส่ง")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ใช้ที่อยู่นี้" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "+ เพิ่มที่อยู่ใหม่" }));
    expect(await screen.findByRole("dialog", { name: "Add New Address" })).toBeInTheDocument();
  });

  it("opens the shared edit form from the selected address", async () => {
    const user = userEvent.setup();
    renderCheckout("/checkout?items=42");
    await ready();
    await user.click(screen.getByRole("button", { name: "เปลี่ยน" }));
    await user.click(screen.getByRole("button", { name: "แก้ไขที่อยู่ Office" }));
    expect(await screen.findByRole("dialog", { name: "Edit Address" })).toBeInTheDocument();
    expect(screen.getByLabelText("Address line 1")).toHaveValue("456 Oak Lab");
  });

  it("refreshes invalid shipping, selects the new default, and requires a second purchase click", async () => {
    const user = userEvent.setup();
    const submit = vi.spyOn(checkoutApi, "checkout").mockRejectedValueOnce(new ApiError({
      status: 400, code: "SHIPPING_OPTION_INVALID", message: "Inactive",
    })).mockResolvedValue(orderResponse);
    const quotes = vi.spyOn(checkoutApi, "getShippingQuotes")
      .mockResolvedValueOnce([quoteA])
      .mockResolvedValue([{ ...quoteA, defaultOptionId: 12, options: [option(12, "EMS", 65)] }]);
    renderCheckout("/checkout?items=42");
    await ready();
    await user.click(purchase());
    await waitFor(() => expect(quotes).toHaveBeenCalledTimes(2));
    await ready();
    expect(screen.getByRole("alert")).toHaveTextContent("ตัวเลือกการจัดส่งของ Store A มีการเปลี่ยนแปลง");
    expect(screen.getByRole("radio", { name: /EMS Store A/ })).toBeChecked();
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿365");
    expect(submit).toHaveBeenCalledTimes(1);
    await user.click(purchase());
    expect(submit.mock.calls[1][0].shippingOptionBySeller).toEqual({ 1: 12 });
    expect(submit.mock.calls[1][1]).not.toBe(submit.mock.calls[0][1]);
  });

  it("keeps the same idempotency key after a network failure", async () => {
    const user = userEvent.setup();
    const submit = vi.spyOn(checkoutApi, "checkout").mockRejectedValueOnce(new ApiError({
      status: 0, code: "NETWORK_ERROR", message: "offline",
    })).mockResolvedValue(orderResponse);
    renderCheckout("/checkout?items=42");
    await ready();
    await user.click(purchase());
    await waitFor(() => expect(toast.add).toHaveBeenCalled());
    await ready();
    await user.click(purchase());
    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit.mock.calls[0][1]).toBe(submit.mock.calls[1][1]);
  });

  it("blocks a seller that becomes unavailable after checkout fails", async () => {
    const user = userEvent.setup();
    const submit = vi.spyOn(checkoutApi, "checkout").mockRejectedValue(new ApiError({
      status: 400, code: "SELLER_SHIPPING_UNAVAILABLE", message: "No active shipping",
    }));
    vi.spyOn(checkoutApi, "getShippingQuotes").mockResolvedValueOnce([quoteA])
      .mockResolvedValue([{ ...quoteA, options: [], defaultOptionId: null }]);
    renderCheckout("/checkout?items=42");
    await ready();
    await user.click(purchase());
    expect(await screen.findByText("ร้านนี้ยังไม่ได้ตั้งค่าการจัดส่ง")).toBeInTheDocument();
    expect(purchase()).toBeDisabled();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("เราเลือกวิธีจัดส่งให้ใหม่แล้ว โปรดตรวจสอบค่าส่งและยอดรวมอีกครั้ง")).not.toBeInTheDocument();
  });

  it.each([
    [400, "SHIPPING_ADDRESS_REQUIRED"],
    [404, "ADDRESS_NOT_FOUND"],
  ])("reopens address selection after %s %s without automatically ordering", async (status, code) => {
    const user = userEvent.setup();
    const submit = vi.spyOn(checkoutApi, "checkout").mockRejectedValue(new ApiError({ status, code, message: "Address unavailable" }));
    renderCheckout("/checkout?items=42");
    await ready();
    await user.click(purchase());
    expect(await screen.findByRole("dialog", { name: "เลือกที่อยู่จัดส่ง" })).toBeInTheDocument();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(checkoutApi.getShippingQuotes).toHaveBeenCalledTimes(1);
  });

  it("displays stock errors without navigating to payment", async () => {
    const user = userEvent.setup();
    vi.spyOn(checkoutApi, "checkout").mockRejectedValue(new ApiError({
      status: 409, code: "INSUFFICIENT_STOCK", message: "Out of stock",
    }));
    renderCheckout("/checkout?items=42");
    await ready();
    await user.click(purchase());
    await waitFor(() => expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "สินค้าไม่เพียงพอ", type: "error" })));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("returns to cart for explicit acceptance if the price changes while placing the order", async () => {
    const user = userEvent.setup();
    const submit = vi.spyOn(checkoutApi, "checkout").mockRejectedValue(new ApiError({
      status: 409, code: "CART_PRICE_CHANGED", message: "Price changed",
    }));
    const view = renderCheckout("/checkout?items=42");
    const invalidate = vi.spyOn(view.queryClient, "invalidateQueries");
    await ready();
    await user.click(purchase());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/cart"));
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
      title: "ราคาสินค้ามีการเปลี่ยนแปลง", description: "กรุณาตรวจสอบและยอมรับราคาใหม่ในตะกร้าอีกครั้ง",
    }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: cartQueries.cartKeys.all });
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("keeps the replacement default when a previously removed option appears again", async () => {
    const user = userEvent.setup();
    const quoteSpy = vi.spyOn(checkoutApi, "getShippingQuotes")
      .mockResolvedValueOnce([quoteA])
      .mockResolvedValueOnce([{ ...quoteA, options: [quoteA.options[0]] }])
      .mockResolvedValueOnce([quoteA]);
    const view = renderCheckout("/checkout?items=42");
    await ready();
    await user.click(screen.getByRole("radio", { name: /EMS Store A/ }));
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿365");
    await act(() => view.queryClient.invalidateQueries({ queryKey: ["checkout-shipping-quotes"] }));
    await ready();
    await waitFor(() => expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿340"));
    await act(() => view.queryClient.invalidateQueries({ queryKey: ["checkout-shipping-quotes"] }));
    await ready();
    expect(quoteSpy).toHaveBeenCalledTimes(3);
    expect(screen.getByRole("radio", { name: /Kerry Express Store A/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /EMS Store A/ })).not.toBeChecked();
  });

  it("loads address rows separately and selects the arriving default address", async () => {
    let addressResult = { data: [] as Address[], isLoading: true, error: null };
    vi.spyOn(addressQueries, "useAddresses").mockImplementation(() => addressResult as unknown as ReturnType<typeof addressQueries.useAddresses>);
    const view = renderCheckout("/checkout?items=42");
    expect(screen.getByRole("status", { name: "กำลังโหลดที่อยู่จัดส่ง" })).toBeInTheDocument();
    expect(purchase()).toBeDisabled();
    addressResult = { data: mockAddresses, isLoading: false, error: null };
    view.rerender(<QueryClientProvider client={view.queryClient}><MemoryRouter initialEntries={["/checkout?items=42"]}><CheckoutPage /></MemoryRouter></QueryClientProvider>);
    await ready();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "เปลี่ยน" }));
    expect(screen.getByRole("radio", { name: /0812345678/ })).toBeChecked();
    expect(screen.getByRole("button", { name: "ใช้ที่อยู่นี้" })).toBeEnabled();
  });

  it("blocks a cart item without sellerProfileId instead of assigning it to seller 1", async () => {
    vi.spyOn(cartQueries, "useCart").mockReturnValue({
      data: { ...mockCart, items: [{ ...mockCart.items[0], sellerProfileId: null }] },
      isLoading: false, isFetching: false, error: null,
    } as unknown as ReturnType<typeof cartQueries.useCart>);
    renderCheckout("/checkout?items=42");
    expect(await screen.findByText("ร้านนี้ยังไม่ได้ตั้งค่าการจัดส่ง")).toBeInTheDocument();
    expect(purchase()).toBeDisabled();
  });

  it("names the changed seller and preserves another seller's selected delivery method", async () => {
    const user = userEvent.setup();
    vi.spyOn(checkoutApi, "getShippingQuotes").mockResolvedValueOnce([quoteA, quoteB])
      .mockResolvedValue([quoteA, { ...quoteB, defaultOptionId: 23, options: [option(23, "Replacement", 10)] }]);
    const submit = vi.spyOn(checkoutApi, "checkout").mockRejectedValueOnce(new ApiError({
      status: 400, code: "SHIPPING_OPTION_INVALID", message: "Inactive", details: { sellerProfileId: 2 },
    })).mockResolvedValue(orderResponse);
    renderCheckout("/checkout?items=42,45");
    await ready();
    await user.click(screen.getByRole("radio", { name: /EMS Store A/ }));
    await user.click(purchase());
    expect(await screen.findByText("ตัวเลือกการจัดส่งของ Store B มีการเปลี่ยนแปลง")).toBeInTheDocument();
    await ready();
    expect(screen.getByRole("radio", { name: /EMS Store A/ })).toBeChecked();
    await user.click(purchase());
    expect(submit.mock.calls[1][0].shippingOptionBySeller).toEqual({ 1: 12, 2: 23 });
  });

  it("renders Figma B1 totals, discount colors, and shared Card geometry", async () => {
    sessionStorage.setItem(
      PROMOTION_SELECTION_KEY,
      JSON.stringify({ platformCode: "PEGASUS200", sellerCodes: { 1: "STORE50" } }),
    );
    vi.spyOn(checkoutApi, "previewPromotions").mockResolvedValue({
      sellers: [
        {
          sellerProfileId: 1,
          sellerName: "Store A",
          itemsSubtotal: 3230,
          shippingFee: 45,
          sellerDiscount: 50,
          platformDiscount: 200,
          grandTotal: 3025,
        },
      ],
      itemsSubtotal: 3230,
      shippingTotal: 45,
      sellerDiscountTotal: 50,
      platformDiscountTotal: 200,
      grandTotal: 3025,
      shippingEstimated: false,
      codes: [
        {
          code: "STORE50",
          ownerType: "SELLER",
          sellerProfileId: 1,
          sellerName: "Store A",
          status: "APPLIED",
          discount: 50,
          shortfall: null,
          pendingShipping: false,
        },
        {
          code: "PEGASUS200",
          ownerType: "PLATFORM",
          sellerProfileId: null,
          sellerName: null,
          status: "APPLIED",
          discount: 200,
          shortfall: null,
          pendingShipping: false,
        },
      ],
      bestPick: null,
    });

    renderCheckout("/checkout?items=42");
    await ready();

    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿3,025");
    expect(screen.getByText(/ประหยัดไป ฿250/)).toBeInTheDocument();
    expect(screen.getAllByText("− ฿50").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("− ฿200").length).toBeGreaterThanOrEqual(1);

    const summaryCard = screen.getByRole("heading", { name: "สรุปคำสั่งซื้อ" }).parentElement;
    expect(summaryCard).toHaveClass(
      "rounded-xl",
      "border",
      "border-border",
      "bg-card",
      "shadow-none",
    );
    const sellerDiscount = screen.getByText("ส่วนลดร้าน").parentElement;
    expect(sellerDiscount?.children[0]).toHaveClass("text-foreground/75");
    expect(sellerDiscount?.children[1]).toHaveClass("text-teal-700");
    const platformDiscount = screen.getByText("ส่วนลด Pegasus · PEGASUS200").parentElement;
    expect(platformDiscount?.children[0]).toHaveClass("text-foreground/75");
    expect(platformDiscount?.children[1]).toHaveClass("text-primary");
  });

  it("applies and removes platform code via user interaction", async () => {
    const user = userEvent.setup();
    const previewSpy = vi.spyOn(checkoutApi, "previewPromotions").mockImplementation(async (req) => ({
      sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300, shippingFee: 40, sellerDiscount: 0, platformDiscount: req.platformCode ? 50 : 0, grandTotal: req.platformCode ? 290 : 340 }],
      itemsSubtotal: 300,
      shippingTotal: 40,
      sellerDiscountTotal: 0,
      platformDiscountTotal: req.platformCode ? 50 : 0,
      grandTotal: req.platformCode ? 290 : 340,
      shippingEstimated: false,
      codes: req.platformCode
        ? [{ code: req.platformCode, ownerType: "PLATFORM", sellerProfileId: null, sellerName: null, status: "APPLIED", discount: 50, shortfall: null, pendingShipping: false }]
        : [],
      bestPick: null,
    }));

    renderCheckout("/checkout?items=42");
    await ready();

    // Type platform code
    await user.type(screen.getByLabelText("กรอกโค้ด Pegasus"), "pegasus50");
    await user.click(screen.getByRole("button", { name: "ใช้โค้ด" }));

    await waitFor(() => {
      expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿290");
    });
    expect(previewSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ platformCode: "PEGASUS50" }),
      expect.anything(),
    );

    // Remove platform code
    await user.click(screen.getByRole("button", { name: "นำโค้ด Pegasus ออก" }));
    await waitFor(() => {
      expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿340");
    });
  });

  it("recalculates a free-shipping promotion when delivery changes", async () => {
    sessionStorage.setItem(PROMOTION_SELECTION_KEY,
      JSON.stringify({ platformCode: "FREESHIP", sellerCodes: {} }));
    const previewSpy = vi.spyOn(checkoutApi, "previewPromotions").mockImplementation(async (request) => {
      const shippingFee = request.shippingOptionBySeller?.[1] === 12 ? 65 : 40;
      return {
        sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300,
          shippingFee, sellerDiscount: 0, platformDiscount: shippingFee, grandTotal: 300 }],
        itemsSubtotal: 300, shippingTotal: shippingFee, sellerDiscountTotal: 0,
        platformDiscountTotal: shippingFee, grandTotal: 300, shippingEstimated: false,
        codes: [{ code: "FREESHIP", ownerType: "PLATFORM", sellerProfileId: null,
          sellerName: null, status: "APPLIED", discount: shippingFee,
          shortfall: null, pendingShipping: false }],
        bestPick: null,
      };
    });
    renderCheckout("/checkout?items=42");
    await ready();
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿300");

    await userEvent.setup().click(screen.getByRole("radio", { name: /EMS Store A/ }));
    await waitFor(() => expect(previewSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ shippingOptionBySeller: { 1: 12 } }), expect.anything(),
    ));
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿300");
    expect(screen.getAllByText("− ฿65")).toHaveLength(2);
  });

  it("displays Thai error with seller name when promo is for wrong seller", async () => {
    sessionStorage.setItem(
      PROMOTION_SELECTION_KEY,
      JSON.stringify({ platformCode: "WRONGSHOP", sellerCodes: {} }),
    );
    vi.spyOn(checkoutApi, "previewPromotions").mockResolvedValue({
      sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300, shippingFee: 40, sellerDiscount: 0, platformDiscount: 0, grandTotal: 340 }],
      itemsSubtotal: 300,
      shippingTotal: 40,
      sellerDiscountTotal: 0,
      platformDiscountTotal: 0,
      grandTotal: 340,
      shippingEstimated: false,
      codes: [
        {
          code: "WRONGSHOP",
          ownerType: "PLATFORM",
          sellerProfileId: 1,
          sellerName: "Store A",
          status: "PROMO_WRONG_SELLER",
          discount: null,
          shortfall: null,
          pendingShipping: false,
        },
      ],
      bestPick: null,
    });

    renderCheckout("/checkout?items=42");
    expect(
      await screen.findByText("โค้ดนี้เป็นของร้าน Store A — ใส่ในช่อง “โค้ดร้าน” ของร้านนั้น"),
    ).toBeInTheDocument();
  });

  it("displays Thai shortfall error when min spend is not met and drops invalid code while keeping valid code", async () => {
    sessionStorage.setItem(
      PROMOTION_SELECTION_KEY,
      JSON.stringify({ platformCode: "MINSPEND100", sellerCodes: { 1: "VALIDSHOP" } }),
    );
    vi.spyOn(checkoutApi, "previewPromotions").mockImplementation(async (req) => ({
      sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300, shippingFee: 40, sellerDiscount: req.sellerCodes[1] ? 30 : 0, platformDiscount: 0, grandTotal: 310 }],
      itemsSubtotal: 300,
      shippingTotal: 40,
      sellerDiscountTotal: 30,
      platformDiscountTotal: 0,
      grandTotal: 310,
      shippingEstimated: false,
      codes: [
        ...(req.platformCode
          ? [
              {
                code: "MINSPEND100",
                ownerType: "PLATFORM" as const,
                sellerProfileId: null,
                sellerName: null,
                status: "PROMO_MIN_SPEND_NOT_MET",
                discount: null,
                shortfall: 200,
                pendingShipping: false,
              },
            ]
          : []),
        ...(req.sellerCodes[1]
          ? [
              {
                code: "VALIDSHOP",
                ownerType: "SELLER" as const,
                sellerProfileId: 1,
                sellerName: "Store A",
                status: "APPLIED",
                discount: 30,
                shortfall: null,
                pendingShipping: false,
              },
            ]
          : []),
      ],
      bestPick: null,
    }));

    const submit = vi.spyOn(checkoutApi, "checkout").mockResolvedValue(orderResponse);
    renderCheckout("/checkout?items=42");
    await ready();

    expect(await screen.findByText("ซื้อสินค้าเพิ่มอีก ฿200 เพื่อใช้โค้ดนี้")).toBeInTheDocument();
    // Valid shop promo remains active
    expect(screen.getByText("โค้ดร้าน · VALIDSHOP")).toBeInTheDocument();

    await ready();
    await userEvent.setup().click(purchase());
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0].platformCode).toBeNull();
    expect(submit.mock.calls[0][0].sellerCodes).toEqual({ 1: "VALIDSHOP" });
  });

  it("prevents duplicate orders from double clicking submit", async () => {
    const user = userEvent.setup();
    let resolveSubmit: (val: CheckoutResponse) => void;
    const submitPromise = new Promise<CheckoutResponse>((res) => {
      resolveSubmit = res;
    });
    const submit = vi.spyOn(checkoutApi, "checkout").mockReturnValue(submitPromise);

    renderCheckout("/checkout?items=42");
    await ready();

    const buyBtn = purchase();
    await user.click(buyBtn);
    await user.click(buyBtn);

    expect(submit).toHaveBeenCalledTimes(1);
    resolveSubmit!(orderResponse);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/payment?orderId=1001", expect.anything()));
  });

  it("handles preview error and retries successfully", async () => {
    const user = userEvent.setup();
    const previewSpy = vi
      .spyOn(checkoutApi, "previewPromotions")
      .mockRejectedValueOnce(new ApiError({ status: 500, code: "INTERNAL_ERROR", message: "Server error" }))
      .mockResolvedValue({
        sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300, shippingFee: 40, sellerDiscount: 0, platformDiscount: 0, grandTotal: 340 }],
        itemsSubtotal: 300,
        shippingTotal: 40,
        sellerDiscountTotal: 0,
        platformDiscountTotal: 0,
        grandTotal: 340,
        shippingEstimated: false,
        codes: [],
        bestPick: null,
      });

    renderCheckout("/checkout?items=42");
    expect(await screen.findByText("คำนวณส่วนลดและยอดรวมไม่สำเร็จ")).toBeInTheDocument();
    expect(purchase()).toBeDisabled();

    // Click retry
    await user.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
    await ready();
    expect(screen.queryByText("คำนวณส่วนลดและยอดรวมไม่สำเร็จ")).not.toBeInTheDocument();
    expect(previewSpy).toHaveBeenCalledTimes(2);
  });

  // Characterization tests for TCG-735: lock current behavior before the refactor.
  describe("current behavior (TCG-735)", () => {
    const flashItem = {
      ...mockCart.items[0],
      currentPrice: 300,
      pricing: {
        listPrice: 400, salePrice: 300, discountPercent: 25,
        sale: { id: 7, slug: "flash", name: "Flash", type: "FLASH_SALE" as const, endsAt: "2099-01-01T00:00:00Z", quotaLeft: 3, perBuyerLimit: 2 },
      },
    };
    const mockFlashCart = () => vi.spyOn(cartQueries, "useCart").mockReturnValue({
      data: { ...mockCart, items: [flashItem, mockCart.items[1]] },
      isLoading: false, isFetching: false, error: null,
    } as unknown as ReturnType<typeof cartQueries.useCart>);

    it("redirects a signed-out buyer to login once with the original return URL", async () => {
      vi.spyOn(authQueries, "useAuth").mockReturnValue({
        isAuthenticated: false, isLoading: false, user: null,
      } as unknown as ReturnType<typeof authQueries.useAuth>);
      renderCheckout("/checkout?items=42");
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(
        "/login?returnTo=%2Fcheckout%3Fitems%3D42", { replace: true },
      ));
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(checkoutApi.getShippingQuotes).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: "สั่งซื้อและไปชำระเงิน" })).not.toBeInTheDocument();
    });

    it("shows a cart load error with a retry that refreshes the cart", async () => {
      vi.spyOn(cartQueries, "useCart").mockReturnValue({
        data: undefined, isLoading: false, isFetching: false, error: new Error("offline"),
      } as unknown as ReturnType<typeof cartQueries.useCart>);
      const view = renderCheckout("/checkout?items=42");
      const invalidate = vi.spyOn(view.queryClient, "invalidateQueries");
      expect(screen.getByRole("alert")).toHaveTextContent("โหลดตะกร้าไม่สำเร็จ");
      await userEvent.setup().click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
      expect(invalidate).toHaveBeenCalledWith({ queryKey: cartQueries.cartKeys.all });
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(checkoutApi.getShippingQuotes).not.toHaveBeenCalled();
    });

    it("sends the buyer back to the cart from a shipping quote error", async () => {
      vi.spyOn(checkoutApi, "getShippingQuotes").mockRejectedValue(new ApiError({
        status: 503, code: "SHIPPING_DOWN", message: "Shipping service down",
      }));
      renderCheckout("/checkout?items=42");
      expect(await screen.findByText("Shipping service down")).toBeInTheDocument();
      await userEvent.setup().click(screen.getByRole("button", { name: "กลับไปตรวจสอบตะกร้า" }));
      expect(mockNavigate).toHaveBeenCalledWith("/cart");
    });

    it("shows the ApiError message when the promotion preview fails", async () => {
      vi.spyOn(checkoutApi, "previewPromotions").mockRejectedValue(new ApiError({
        status: 500, code: "INTERNAL_ERROR", message: "Server error",
      }));
      renderCheckout("/checkout?items=42");
      const alert = (await screen.findByText("คำนวณส่วนลดและยอดรวมไม่สำเร็จ")).closest("[role=alert]");
      expect(alert).toHaveTextContent("Server error");
    });

    it("falls back to a connection message when the promotion preview fails without an ApiError", async () => {
      vi.spyOn(checkoutApi, "previewPromotions").mockRejectedValue(new Error("boom"));
      renderCheckout("/checkout?items=42");
      const alert = (await screen.findByText("คำนวณส่วนลดและยอดรวมไม่สำเร็จ")).closest("[role=alert]");
      expect(alert).toHaveTextContent("กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง");
      expect(alert).not.toHaveTextContent("boom");
    });

    it("counts only applicable codes of each seller", async () => {
      const promo = (id: number, ownerType: "PLATFORM" | "SELLER", sellerProfileId: number | null, applicable: boolean) => ({
        id, code: `CODE${id}`, name: `Code ${id}`, ownerType, sellerProfileId, sellerName: null,
        discountType: "FIXED" as const, discountValue: 10, maxDiscount: null, minSpend: 0,
        endsAt: "2099-01-01T00:00:00Z", source: "PUBLIC" as const, remainingClaims: null,
        applicable, estimatedDiscount: 10, reason: null, shortfall: null,
      });
      vi.spyOn(checkoutApi, "getPromotions").mockResolvedValue([
        promo(1, "SELLER", 1, true), promo(2, "SELLER", 1, true), promo(3, "SELLER", 1, false),
        promo(4, "SELLER", 2, true), promo(5, "PLATFORM", null, true),
      ]);
      renderCheckout("/checkout?items=42,45");
      await ready();
      expect(await screen.findByText("มี 2 โค้ดที่ใช้ได้")).toBeInTheDocument();
      expect(screen.getByText("มี 1 โค้ดที่ใช้ได้")).toBeInTheDocument();
      expect(screen.getByText("ดูโค้ดทั้งหมด (1)")).toBeInTheDocument();
    });

    it("starts a new idempotency key after a 4xx failure on the same order", async () => {
      const user = userEvent.setup();
      const submit = vi.spyOn(checkoutApi, "checkout").mockRejectedValueOnce(new ApiError({
        status: 409, code: "INSUFFICIENT_STOCK", message: "Out of stock",
      })).mockResolvedValue(orderResponse);
      renderCheckout("/checkout?items=42");
      await ready();
      await user.click(purchase());
      await waitFor(() => expect(toast.add).toHaveBeenCalled());
      await ready();
      await user.click(purchase());
      await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
      expect(submit.mock.calls[0][0]).toEqual(submit.mock.calls[1][0]);
      expect(submit.mock.calls[1][1]).not.toBe(submit.mock.calls[0][1]);
    });

    it("refreshes the cart after success and does not bounce back when the cart empties", async () => {
      // A store-backed mock re-renders the page like a real query update would.
      let cartResult = { data: mockCart, isLoading: false, isFetching: false, error: null };
      const listeners = new Set<() => void>();
      const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
      };
      function useMockCart() {
        return useSyncExternalStore(subscribe, () => cartResult) as unknown as ReturnType<typeof cartQueries.useCart>;
      }
      vi.spyOn(cartQueries, "useCart").mockImplementation(useMockCart);
      vi.spyOn(checkoutApi, "checkout").mockResolvedValue(orderResponse);
      const view = renderCheckout("/checkout?items=42");
      const invalidate = vi.spyOn(view.queryClient, "invalidateQueries");
      await ready();
      await userEvent.setup().click(purchase());
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/payment?orderId=1001", expect.anything()));
      expect(invalidate).toHaveBeenCalledWith({ queryKey: cartQueries.cartKeys.all });
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "สร้างคำสั่งซื้อสำเร็จ", description: "คำสั่งซื้อ ORD-1001" }));
      act(() => {
        cartResult = { data: { ...mockCart, items: [] }, isLoading: false, isFetching: false, error: null };
        listeners.forEach((listener) => listener());
      });
      await waitFor(() => expect(screen.getByText("ไม่พบสินค้าที่เลือกสั่งซื้อ")).toBeInTheDocument());
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(toast.add).not.toHaveBeenCalledWith(expect.objectContaining({ title: "ไม่พบสินค้าที่เลือกสั่งซื้อ" }));
    });

    it("opens the Flash quota dialog on SALE_QUOTA_REACHED and removes the item on request", async () => {
      const user = userEvent.setup();
      mockFlashCart();
      const remove = vi.spyOn(cartApi, "removeItem").mockResolvedValue(undefined as never);
      vi.spyOn(checkoutApi, "checkout").mockRejectedValue(new ApiError({
        status: 409, code: "SALE_QUOTA_REACHED", message: "quota", details: { listingId: 101 },
      }));
      const view = renderCheckout("/checkout?items=42");
      const invalidate = vi.spyOn(view.queryClient, "invalidateQueries");
      await ready();
      await user.click(purchase());
      expect(await screen.findByText("ราคา Flash Sale เต็มแล้ว")).toBeInTheDocument();
      expect(screen.getByText(/ของ Pikachu Illustrator ถูกซื้อครบแล้ว/)).toBeInTheDocument();
      expect(invalidate).toHaveBeenCalledWith({ queryKey: cartQueries.cartKeys.all });
      await user.click(screen.getByRole("button", { name: "นำออก" }));
      await waitFor(() => expect(remove).toHaveBeenCalledWith(42));
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("warns about the Flash per-buyer limit on SALE_BUYER_LIMIT_REACHED", async () => {
      mockFlashCart();
      vi.spyOn(checkoutApi, "checkout").mockRejectedValue(new ApiError({
        status: 409, code: "SALE_BUYER_LIMIT_REACHED", message: "limit", details: { listingId: 101 },
      }));
      renderCheckout("/checkout?items=42");
      await ready();
      await userEvent.setup().click(purchase());
      await waitFor(() => expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        title: "SALE_BUYER_LIMIT_REACHED", type: "warning",
      })));
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        description: expect.stringContaining("จำกัดคนละ 2 ชิ้น"),
      }));
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("stacks the sale price with a seller code and submits the preview total", async () => {
      mockFlashCart();
      sessionStorage.setItem(PROMOTION_SELECTION_KEY, JSON.stringify({ platformCode: null, sellerCodes: { 1: "STORE50" } }));
      vi.spyOn(checkoutApi, "previewPromotions").mockResolvedValue({
        sellers: [{ sellerProfileId: 1, sellerName: "Store A", itemsSubtotal: 300, shippingFee: 40, sellerDiscount: 50, platformDiscount: 0, grandTotal: 290 }],
        itemsSubtotal: 300, shippingTotal: 40, sellerDiscountTotal: 50, platformDiscountTotal: 0, grandTotal: 290,
        shippingEstimated: false, bestPick: null,
        codes: [{ code: "STORE50", ownerType: "SELLER", sellerProfileId: 1, sellerName: "Store A", status: "APPLIED", discount: 50, shortfall: null, pendingShipping: false }],
      });
      const submit = vi.spyOn(checkoutApi, "checkout").mockResolvedValue(orderResponse);
      renderCheckout("/checkout?items=42");
      await ready();
      expect(screen.getByText("ราคาสินค้า (ก่อนลด)").parentElement).toHaveTextContent("฿400");
      expect(screen.getByText("ส่วนลดราคาสินค้า").parentElement).toHaveTextContent("−฿100");
      expect(screen.getAllByText("− ฿50").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿290");
      await userEvent.setup().click(purchase());
      await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
      expect(submit.mock.calls[0][0]).toEqual(expect.objectContaining({
        sellerCodes: { 1: "STORE50" }, expectedGrandTotal: 290,
      }));
    });
  });
});
