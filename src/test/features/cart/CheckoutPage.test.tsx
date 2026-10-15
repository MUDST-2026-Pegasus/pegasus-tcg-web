import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
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
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <CheckoutPage />
      </MemoryRouter>
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
  });

  it("quotes only selected cart items and uses the API fee instead of a flat 50", async () => {
    renderCheckout("/checkout?items=42");
    await ready();
    expect(checkoutApi.getShippingQuotes).toHaveBeenCalledWith([42]);
    expect(screen.getByText("Pikachu Illustrator")).toBeInTheDocument();
    expect(screen.queryByText("Charizard Base Set")).not.toBeInTheDocument();
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿340");
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
    expect(submit.mock.calls[0][0]).toEqual({ cartItemIds: [42], shippingAddressId: 1, shippingOptionBySeller: { 1: 12 } });
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
    expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("฿340");
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
});
