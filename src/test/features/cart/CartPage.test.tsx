import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { TolgeeProvider } from "@tolgee/react";
import { testTolgee } from "@/test/i18n";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";

import * as authQueries from "@/features/auth/auth.queries";
import { cartApi } from "@/features/cart/cart.api";
import { checkoutApi } from "@/features/cart/checkout.api";
import { CartPage } from "@/features/cart/pages/CartPage";
import { PROMOTION_MANUAL_KEY, PROMOTION_SELECTION_KEY } from "@/features/cart/promotions.storage";
import type { CartItemResponse, CartResponse } from "@/features/cart/cart.types";
import type { AvailablePromotion, PromoPreview, PromoPreviewRequest } from "@/features/cart/promotions.types";
import { createTestQueryClient, render } from "@/test/utils";
import { toast } from "@/components/ui/toast";

const item: CartItemResponse = {
  id: 10,
  cartId: 1,
  listingId: 55,
  quantity: 1,
  unitPriceAtAdd: 100,
  currentPrice: 100,
  priceChanged: false,
  purchasable: true,
  quantityAvailable: 2,
  sellerProfileId: 5,
  catalogVariantId: 15,
  condition: "NM",
  currency: "THB",
  addedAt: "2026-10-12T00:00:00Z",
  updatedAt: "2026-10-12T00:00:00Z",
  productName: "Pikachu ex",
  variantLabel: "English / Holo",
  sellerName: "Seller Store",
  sellerUsername: "seller_store",
  imageUrl: null,
  productId: 1,
};

const cart: CartResponse = {
  id: 1,
  userId: null,
  sessionKey: "guest-session",
  currency: "THB",
  totalQuantity: 1,
  itemsSubtotal: 100,
  expiresAt: null,
  items: [item],
};

const promo = (overrides: Partial<AvailablePromotion>): AvailablePromotion => ({
  id: 1,
  code: "PEGASUS10",
  name: "ลด 10% ทุกเกม",
  ownerType: "PLATFORM",
  sellerProfileId: null,
  sellerName: null,
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscount: 200,
  minSpend: 0,
  endsAt: "2026-11-30T00:00:00Z",
  source: "CLAIMED",
  remainingClaims: null,
  applicable: true,
  estimatedDiscount: 10,
  reason: null,
  shortfall: null,
  ...overrides,
});

/** No codes applied: totals straight from the ticked items. */
function plainPreview(request: PromoPreviewRequest, items: CartItemResponse[]): PromoPreview {
  const ticked = items.filter((cartItem) => request.cartItemIds.includes(cartItem.id));
  const subtotal = ticked.reduce((sum, cartItem) => sum + (cartItem.currentPrice ?? 0) * cartItem.quantity, 0);
  return {
    sellers: [],
    itemsSubtotal: subtotal,
    shippingTotal: null,
    sellerDiscountTotal: 0,
    platformDiscountTotal: 0,
    grandTotal: subtotal,
    shippingEstimated: true,
    codes: [],
    bestPick: request.autoPick ? { platformCode: null, sellerCodes: {} } : null,
  };
}

const getCart = vi.spyOn(cartApi, "getCart");
const getPromotions = vi.spyOn(checkoutApi, "getPromotions");
const previewPromotions = vi.spyOn(checkoutApi, "previewPromotions");

function signedIn(signedInUser = true) {
  vi.spyOn(authQueries, "useAuth").mockReturnValue({
    isAuthenticated: signedInUser,
    isLoading: false,
    user: signedInUser ? { id: 7 } : null,
    roles: [],
    hasRole: () => false,
  } as unknown as ReturnType<typeof authQueries.useAuth>);
}

function renderCart(initialEntry: string | { pathname: string; state: unknown } = "/cart") {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <TolgeeProvider tolgee={testTolgee("th")} fallback={null}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </MemoryRouter>
      </TolgeeProvider>
    </QueryClientProvider>,
  );
}

const checkoutButton = () => screen.getByRole("button", { name: /^ไปชำระเงิน/ });

describe("CartPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.spyOn(toast, "add").mockImplementation(vi.fn());
    signedIn();
    getCart.mockResolvedValue(cart);
    getPromotions.mockResolvedValue([]);
    previewPromotions.mockImplementation(async (request) => plainPreview(request, cart.items));
  });

  it("groups items by shop and shows product name, condition and seller", async () => {
    renderCart();
    expect(await screen.findByRole("heading", { name: "Pikachu ex" })).toBeInTheDocument();
    expect(screen.getByText("English / Holo · Near Mint")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Seller Store" })).toHaveAttribute("href", "/u/seller_store");
    expect(screen.getByRole("checkbox", { name: "เลือกทั้งร้าน Seller Store" })).toBeChecked();
  });

  it("opens the clicked seller's profile when shops have the same display name", async () => {
    const user = userEvent.setup();
    getCart.mockResolvedValue({ ...cart, items: [
      { ...item, sellerUsername: "shop_one" },
      { ...item, id: 11, listingId: 56, sellerProfileId: 6, sellerUsername: "shop_two" },
    ] });
    function SellerProfile() {
      const { username } = useParams();
      return <h1>Store profile: {username}</h1>;
    }
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/cart"]}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/u/:username" element={<SellerProfile />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const sellers = await screen.findAllByRole("link", { name: "Seller Store" });
    expect(sellers[0]).toHaveAttribute("href", "/u/shop_one");
    expect(sellers[1]).toHaveAttribute("href", "/u/shop_two");
    await user.click(sellers[1]);
    expect(await screen.findByRole("heading", { name: "Store profile: shop_two" })).toBeInTheDocument();
  });

  it("shows the seller name without a broken link when username is missing", async () => {
    getCart.mockResolvedValue({ ...cart, items: [{ ...item, sellerUsername: null }] });
    renderCart();
    expect(await screen.findByText("Seller Store")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Seller Store" })).not.toBeInTheDocument();
  });

  it("ticks and unticks a whole shop at once", async () => {
    const user = userEvent.setup();
    getCart.mockResolvedValue({ ...cart, items: [item, { ...item, id: 11, productName: "Charizard" }] });
    renderCart();
    const shop = await screen.findByRole("checkbox", { name: "เลือกทั้งร้าน Seller Store" });
    await user.click(shop);
    expect(screen.getByRole("checkbox", { name: "เลือก Pikachu ex" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "เลือก Charizard" })).not.toBeChecked();
    expect(checkoutButton()).toBeDisabled();
    await user.click(shop);
    expect(checkoutButton()).toHaveTextContent("ไปชำระเงิน (2)");
  });

  it.each([80, 120])("requires explicit acceptance of a changed price (%s) before checkout", async (price) => {
    const user = userEvent.setup();
    const changedCart = { ...cart, items: [{ ...item, currentPrice: price, priceChanged: true }] };
    const acceptedCart = { ...cart, itemsSubtotal: price, items: [{ ...changedCart.items[0], unitPriceAtAdd: price, priceChanged: false }] };
    getCart.mockResolvedValue(changedCart);
    previewPromotions.mockImplementation(async (request) => plainPreview(request, acceptedCart.items));
    const accept = vi.spyOn(cartApi, "acceptPrices").mockImplementation(async () => {
      getCart.mockResolvedValue(acceptedCart);
      return acceptedCart;
    });
    renderCart();
    expect(await screen.findByText("ราคาสินค้าบางรายการเปลี่ยนแปลง")).toBeInTheDocument();
    expect(screen.getByText(`ราคาเปลี่ยน: ฿100 → ฿${price}`)).toBeInTheDocument();
    expect(checkoutButton()).toBeDisabled();
    expect(screen.getByText("กรุณายอมรับราคาใหม่ หรือยกเลิกเลือกรายการที่ราคาเปลี่ยนก่อนสั่งซื้อ")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ยอมรับราคาใหม่" }));
    expect(accept).toHaveBeenCalledWith([10]);
    await waitFor(() => expect(checkoutButton()).toBeEnabled());
    expect(screen.queryByText(/ราคาเปลี่ยน:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ยอมรับราคาใหม่" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("ยอดรวม")).toHaveTextContent(`฿${price}`);
  });

  it.each([
    { priceChanged: true, purchasable: true },
    { priceChanged: false, purchasable: false },
  ])("allows other items to checkout after deselecting a blocked item: %j", async (flags) => {
    const user = userEvent.setup();
    getCart.mockResolvedValue({ ...cart, items: [
      { ...item, ...flags },
      { ...item, id: 11, productName: "Charizard" },
    ] });
    renderCart();
    await screen.findByRole("heading", { name: "Pikachu ex" });
    expect(checkoutButton()).toBeDisabled();
    if (!flags.purchasable) expect(screen.getByText("กรุณานำสินค้าที่ไม่พร้อมจำหน่ายออก หรือยกเลิกเลือกก่อนสั่งซื้อ")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "เลือก Pikachu ex" }));
    expect(checkoutButton()).toBeEnabled();
  });

  it("keeps checkout blocked when accepting prices fails", async () => {
    const user = userEvent.setup();
    getCart.mockResolvedValue({ ...cart, items: [{ ...item, priceChanged: true, currentPrice: 80 }] });
    vi.spyOn(cartApi, "acceptPrices").mockRejectedValue(new Error("offline"));
    renderCart();
    await user.click(await screen.findByRole("button", { name: "ยอมรับราคาใหม่" }));
    await waitFor(() => expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "ยอมรับราคาใหม่ไม่สำเร็จ" })));
    expect(checkoutButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: "ยอมรับราคาใหม่" })).toBeEnabled();
  });

  it("auto-selects ONLY reordered items when arriving with reorderListingIds in navigation state", async () => {
    const twoItems = [
      { ...item, id: 10, listingId: 55, productName: "Pikachu ex" },
      { ...item, id: 11, listingId: 56, productName: "Charizard ex", unitPriceAtAdd: 200, currentPrice: 200 },
    ];
    getCart.mockResolvedValue({ ...cart, items: twoItems });
    previewPromotions.mockImplementation(async (request) => plainPreview(request, twoItems));
    renderCart({ pathname: "/cart", state: { reorderListingIds: [56] } });

    await screen.findByRole("heading", { name: "Pikachu ex" });
    expect(screen.getByRole("checkbox", { name: "เลือก Pikachu ex" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "เลือก Charizard ex" })).toBeChecked();
    expect(screen.getByText("ยอดสินค้า (1 ใบ)")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("ยอดรวม")).toHaveTextContent("฿200"));
  });
});

describe("CartPage codes", () => {
  // C1: two shops; MINMIN50 for minmin_tcg Cards and PEGASUS10 on top.
  const c1Items: CartItemResponse[] = [
    { ...item, id: 1, productName: "Pikachu ex · SAR", currentPrice: 450, unitPriceAtAdd: 450, sellerProfileId: 5, sellerName: "minmin_tcg Cards", sellerUsername: "minmin_tcg" },
    { ...item, id: 2, productName: "Gengar · Holo Rare", currentPrice: 380, unitPriceAtAdd: 380, sellerProfileId: 5, sellerName: "minmin_tcg Cards", sellerUsername: "minmin_tcg" },
    { ...item, id: 3, productName: "Monkey.D.Luffy · OP05-119 SEC", currentPrice: 2400, unitPriceAtAdd: 2400, sellerProfileId: 6, sellerName: "CardVault BKK", sellerUsername: "cardvaultbkk" },
  ];
  const c1Promotions = [
    promo({ id: 1, code: "PEGASUS10", estimatedDiscount: 200 }),
    promo({ id: 2, code: "BIGSPEND300", discountType: "FIXED", discountValue: 300, maxDiscount: null, minSpend: 5000, applicable: false, reason: "PROMO_MIN_SPEND_NOT_MET", shortfall: 1770 }),
    promo({ id: 3, code: "MINMIN50", ownerType: "SELLER", sellerProfileId: 5, sellerName: "minmin_tcg Cards", discountType: "FIXED", discountValue: 50, maxDiscount: null, minSpend: 500 }),
  ];

  function c1Preview(request: PromoPreviewRequest): PromoPreview {
    const ticked = c1Items.filter((cartItem) => request.cartItemIds.includes(cartItem.id));
    const subtotal = ticked.reduce((sum, cartItem) => sum + cartItem.currentPrice! * cartItem.quantity, 0);
    const shop5 = ticked.filter((cartItem) => cartItem.sellerProfileId === 5).reduce((sum, cartItem) => sum + cartItem.currentPrice!, 0);
    const pick = request.autoPick ? { platformCode: "PEGASUS10", sellerCodes: { 5: "MINMIN50" } } : null;
    const platformCode = pick?.platformCode ?? request.platformCode;
    const shopCode = pick?.sellerCodes[5] ?? request.sellerCodes[5];
    const shopApplied = shopCode === "MINMIN50" && shop5 >= 500;
    const sellerDiscount = shopApplied ? 50 : 0;
    const platformDiscount = platformCode === "PEGASUS10" ? Math.min(200, Math.round((subtotal - sellerDiscount) * 0.1)) : 0;
    const codes: PromoPreview["codes"] = [];
    if (shopCode) {
      codes.push({ code: shopCode, ownerType: "SELLER", sellerProfileId: 5, sellerName: "minmin_tcg Cards",
        status: shopApplied ? "APPLIED" : "PROMO_MIN_SPEND_NOT_MET", discount: shopApplied ? 50 : null,
        shortfall: shopApplied ? null : 500 - shop5, pendingShipping: false });
    }
    if (platformCode) {
      codes.push({ code: platformCode, ownerType: "PLATFORM", sellerProfileId: null, sellerName: null,
        status: platformCode === "PEGASUS10" ? "APPLIED" : "PROMO_NOT_FOUND", discount: platformDiscount || null,
        shortfall: null, pendingShipping: false });
    }
    return {
      sellers: shop5 ? [{ sellerProfileId: 5, sellerName: "minmin_tcg Cards", itemsSubtotal: shop5, shippingFee: null,
        sellerDiscount, platformDiscount: 0, grandTotal: shop5 - sellerDiscount }] : [],
      itemsSubtotal: subtotal,
      shippingTotal: null,
      sellerDiscountTotal: sellerDiscount,
      platformDiscountTotal: platformDiscount,
      grandTotal: subtotal - sellerDiscount - platformDiscount,
      shippingEstimated: true,
      codes,
      bestPick: pick,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.spyOn(toast, "add").mockImplementation(vi.fn());
    signedIn();
    getCart.mockResolvedValue({ ...cart, items: c1Items });
    getPromotions.mockResolvedValue(c1Promotions);
    previewPromotions.mockImplementation(async (request) => c1Preview(request));
  });

  it("auto-picks the best codes on first load and totals C1 to ฿2,980", async () => {
    renderCart();
    expect(await screen.findByText("ประหยัดไป ฿250")).toBeInTheDocument();
    expect(screen.getByLabelText("ยอดรวม")).toHaveTextContent("฿2,980");
    expect(screen.getByText("ยอดสินค้า (3 ใบ)").nextSibling).toHaveTextContent("฿3,230");
    expect(screen.getByRole("button", { name: "โค้ด Pegasus PEGASUS10 — เปลี่ยนโค้ด" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "โค้ดร้าน MINMIN50 — เปลี่ยนโค้ด" })).toBeInTheDocument();
    expect(screen.getByText("เลือกโค้ดที่ลดได้มากที่สุดให้แล้ว")).toBeInTheDocument();
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "เลือกโค้ดที่ลดมากที่สุดให้แล้ว (– ฿250)" }));
    expect(previewPromotions).toHaveBeenCalledWith(expect.objectContaining({ autoPick: true }), expect.anything());
    // CheckoutPage picks the same codes up from sessionStorage.
    await waitFor(() => expect(JSON.parse(sessionStorage.getItem(PROMOTION_SELECTION_KEY)!))
      .toEqual({ platformCode: "PEGASUS10", sellerCodes: { 5: "MINMIN50" } }));
  });

  it("never overrides a code the buyer chose, even after the items change", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(await screen.findByRole("button", { name: "โค้ด Pegasus PEGASUS10 — เปลี่ยนโค้ด" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "ไม่ใช้โค้ด" }));

    await waitFor(() => expect(screen.getByLabelText("ยอดรวม")).toHaveTextContent("฿3,180"));
    expect(sessionStorage.getItem(PROMOTION_MANUAL_KEY)).toBe("1");
    expect(screen.queryByText("เลือกโค้ดที่ลดได้มากที่สุดให้แล้ว")).not.toBeInTheDocument();

    previewPromotions.mockClear();
    await user.click(screen.getByRole("checkbox", { name: "เลือก Monkey.D.Luffy · OP05-119 SEC" }));
    await waitFor(() => expect(previewPromotions).toHaveBeenCalled());
    for (const [request] of previewPromotions.mock.calls) {
      expect(request.autoPick).toBeUndefined();
      expect(request.platformCode).toBeNull();
    }
    expect(screen.getByRole("button", { name: /^เลือกโค้ดส่วนลด/ })).toBeInTheDocument();
  });

  it("drops a shop code with a notice when unticking takes the shop under its minimum", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(PROMOTION_MANUAL_KEY, "1");
    sessionStorage.setItem(PROMOTION_SELECTION_KEY, JSON.stringify({ platformCode: null, sellerCodes: { 5: "MINMIN50" } }));
    renderCart();
    expect(await screen.findByRole("button", { name: "โค้ดร้าน MINMIN50 — เปลี่ยนโค้ด" })).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "เลือก Gengar · Holo Rare" }));

    expect(await screen.findByText("นำ MINMIN50 ออกแล้ว: ซื้อสินค้าเพิ่มอีก ฿50 เพื่อใช้โค้ดนี้ (ยังอยู่ในกระเป๋าโค้ด)"))
      .toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(sessionStorage.getItem(PROMOTION_SELECTION_KEY)!).sellerCodes).toEqual({}));
  });

  it("lets a guest type a code and points them to sign in for collected codes", async () => {
    const user = userEvent.setup();
    signedIn(false);
    getPromotions.mockResolvedValue([]);
    previewPromotions.mockImplementation(async (request) => c1Preview({ ...request, autoPick: false }));
    renderCart();

    expect(await screen.findByText("เข้าสู่ระบบเพื่อใช้โค้ดที่เก็บไว้")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "เข้าสู่ระบบ" })).toHaveAttribute("href", "/login?next=%2Fcart");
    expect(screen.queryByRole("link", { name: /โค้ดของฉัน/ })).not.toBeInTheDocument();

    await user.type(await screen.findByRole("textbox", { name: "กรอกโค้ดอื่นที่ไม่ได้เก็บไว้" }), "pegasus10");
    await user.click(screen.getByRole("button", { name: "ใช้โค้ด" }));

    await waitFor(() => expect(previewPromotions).toHaveBeenCalledWith(
      expect.objectContaining({ platformCode: "PEGASUS10" }), expect.anything()));
    expect(await screen.findByRole("button", { name: "โค้ด Pegasus PEGASUS10 — เปลี่ยนโค้ด" })).toBeInTheDocument();
  });
});
