import type {
  CartItemResponse,
  CartResponse,
} from "../../../features/cart/cart.types";
import type { PublicListingDto } from "../../../features/catalog/catalog.types";
const ok = (data: unknown, statusCode = 200) => ({
  statusCode,
  body: { success: true, data },
});
const page = (items: unknown[]) => ({
  items,
  totalItems: items.length,
  totalPages: 1,
  page: 0,
  size: 100,
});
const image = "/__test/card.png";
const listing: PublicListingDto = {
  id: 877,
  card: {
    variantId: 1,
    sku: "CARD-EN",
    variantLabel: "EN · Holo",
    productId: 10,
    productName: "Mega Gardevoir ex (SIR)",
    productSlug: "card",
    gameId: 1,
    officialImageUrl: image,
  },
  condition: "LP",
  price: 100,
  currency: "THB",
  quantityAvailable: 5,
  primaryPhotoUrl: image,
  seller: {
    username: "shop",
    displayName: "TCG Corner",
    avatarUrl: null,
    verified: true,
    ratingAvg: 4.9,
    ratingCount: 10,
    salesCount: 30,
  },
  delivery: {
    fastestEstDaysMin: 1,
    fastestEstDaysMax: 3,
    freeShipping: true,
    optionCount: 1,
  },
};
const sale = {
  listPrice: 100,
  salePrice: 70,
  discountPercent: 30,
  sale: {
    id: 1,
    slug: "sale",
    name: "Sale",
    type: "CATEGORY_SALE" as const,
    endsAt: new Date(Date.now() + 3600000).toISOString(),
    quotaLeft: null,
    perBuyerLimit: null,
  },
};
const row = (overrides: Partial<CartItemResponse> = {}): CartItemResponse => ({
  id: 1877,
  cartId: 1,
  listingId: 877,
  quantity: 1,
  unitPriceAtAdd: 100,
  currentPrice: 100,
  priceChanged: false,
  purchasable: true,
  quantityAvailable: 5,
  sellerProfileId: 1,
  catalogVariantId: 1,
  condition: "LP",
  currency: "THB",
  addedAt: "",
  updatedAt: "",
  productName: listing.card.productName,
  variantLabel: "EN · Holo",
  sellerName: "TCG Corner",
  sellerUsername: "shop",
  imageUrl: image,
  productId: 10,
  ...overrides,
});
function mocks(
  initial: CartItemResponse[] = [],
  pricing?: import("../../../components/sale").ListingPricing,
  guest = false,
) {
  let items = initial;
  const upsell = [877, 2, 3, 4, 5].map((id) => ({
    ...listing,
    id,
    price: 50,
    card: { ...listing.card, productName: `Card ${id}` },
  }));
  const cart = (): CartResponse => ({
    id: 1,
    userId: guest ? null : 3,
    sessionKey: guest ? "session" : null,
    currency: "THB",
    items,
    totalQuantity: items.reduce((n, i) => n + i.quantity, 0),
    itemsSubtotal: 0,
    expiresAt: null,
  });
  if (guest)
    cy.intercept("POST", "**/api/v1/auth/refresh", {
      statusCode: 401,
      body: { success: false },
    });
  else cy.loginAs("BUYER");
  cy.intercept("GET", "**/__test/card.png", {
    fixture: "listing-detail-card.png",
  });
  cy.intercept("GET", "**/api/v1/cart", (req) => req.reply(ok(cart()))).as(
    "cart",
  );
  cy.intercept("POST", "**/api/v1/cart/items", (req) => {
    const id = req.body.listingId;
    const existing = items.find((i) => i.listingId === id);
    const added = row({
      id: 1000 + id,
      listingId: id,
      quantity: (existing?.quantity ?? 0) + req.body.quantity,
      productName: id === 877 ? listing.card.productName : `Card ${id}`,
      currentPrice: id === 877 ? (pricing?.salePrice ?? 100) : 50,
      unitPriceAtAdd: id === 877 ? (pricing?.salePrice ?? 100) : 50,
      pricing: id === 877 ? pricing : null,
    });
    items = [...items.filter((i) => i.listingId !== id), added];
    req.reply(ok(added, 201));
  }).as("add");
  cy.intercept(
    "GET",
    "**/api/v1/listings/877",
    ok({
      listing: {
        ...listing,
        pricing,
        status: "ACTIVE",
        publicNote: null,
        gradingCompany: null,
        gradeValue: null,
        publishedAt: null,
      },
      photoUrls: [image],
      market: null,
      certNumber: null,
    }),
  );
  cy.intercept("GET", "**/api/v1/games", ok([]));
  cy.intercept("GET", "**/api/v1/games/1/attributes", ok([]));
  cy.intercept("GET", "**/api/v1/card-sets*", ok([]));
  cy.intercept(
    "GET",
    "**/api/v1/catalog/products/card",
    ok({
      product: {
        id: 10,
        slug: "card",
        name: listing.card.productName,
        nameLocal: null,
        gameId: 1,
        categoryId: 1,
        cardSetId: null,
        productType: "SINGLE_CARD",
        cardNumber: null,
        rarityCode: null,
        description: null,
        active: true,
        attributes: {},
      },
      variants: [
        {
          id: 1,
          catalogProductId: 10,
          sku: "CARD-EN",
          languageCode: "EN",
          finish: "Holo",
          edition: "Unlimited",
          active: true,
        },
      ],
      images: [],
    }),
  );
  cy.intercept("GET", "**/api/v1/catalog/products/10/effects", ok([]));
  cy.intercept("GET", "**/api/v1/catalog/products/10/market", ok([]));
  cy.intercept(
    "GET",
    "**/api/v1/catalog/products/10/collectors*",
    ok(page([])),
  );
  cy.intercept("GET", "**/api/v1/listings?*", ok(page([listing])));
  cy.intercept("GET", "**/api/v1/u/shop/listings*", ok(page(upsell)));
  cy.intercept("GET", "**/api/v1/sales", ok([]));
  return {
    getItems: () => items,
    setItems: (next: CartItemResponse[]) => {
      items = next;
    },
  };
}
const open = () => {
  cy.visit("/listings/877");
  cy.get("[data-buy-box] button").contains("เพิ่มลงตะกร้า").focus().click();
  cy.wait("@add");
  cy.get("[data-mini-cart-state]").should("be.visible");
};
describe("TCG-664 mini-cart", { defaultCommandTimeout: 10000 }, () => {
  it("reads latest cart, groups sellers, limits upsell, restores focus on Escape", () => {
    mocks([
      row({
        id: 1901,
        listingId: 901,
        sellerProfileId: 2,
        sellerName: "Other shop",
        sellerUsername: "other",
        currentPrice: 50,
      }),
    ]);
    open();
    cy.get('[data-slot="sheet-content"]').should("have.css", "width", "420px");
    cy.get("[data-mini-cart-body]").should("contain.text", "2 ชิ้น · 2 ร้าน");
    cy.get("[data-upsell-listing]").should("have.length", 3);
    cy.get('[data-upsell-listing="877"]').should("not.exist");
    cy.get("[data-mini-cart-footer]").should("contain.text", "฿150");
    cy.screenshot("TCG-664-desktop", { capture: "viewport" });
    cy.get("body").type("{esc}");
    cy.get('[data-slot="sheet-content"]').should("not.exist");
    cy.focused().should("contain.text", "เพิ่มลงตะกร้า");
  });
  it("shows previous quantity and updates upsell in place without nested toast", () => {
    mocks([row()]);
    open();
    cy.get('[data-mini-cart-state="updated"]').should("exist");
    cy.contains("จำนวน 2 (เดิม 1)").should("be.visible");
    cy.get('[data-upsell-listing="2"] button').click();
    cy.wait("@add");
    cy.get('[data-mini-cart-item="2"]').should("exist");
    cy.get('[data-upsell-listing="2"]').should("not.exist");
    cy.get('[data-slot="sheet-content"]').should("be.visible");
    cy.get('[data-slot="toast"]').should("not.exist");
  });
  it("sale rows and footer use the same before/discount/subtotal values", () => {
    mocks([row({ id: 1901, listingId: 901, currentPrice: 50 })], sale);
    open();
    cy.get('[data-mini-cart-state="sale"]').should("exist");
    cy.get("[data-mini-cart-body] s").should("contain.text", "฿100");
    cy.get("[data-mini-cart-footer]")
      .should("contain.text", "฿150")
      .and("contain.text", "−฿30")
      .and("contain.text", "฿120");
  });
  it("prices quantities above the Flash buyer limit consistently in rows and subtotal", () => {
    const flash = { ...sale, listPrice: 2850, salePrice: 1995,
      sale: { ...sale.sale, type: "FLASH_SALE" as const, perBuyerLimit: 1, quotaLeft: 10 } };
    mocks([row({ quantity: 2, pricing: flash })], flash);
    open();
    cy.get('[data-mini-cart-item="877"]').each(($row) => {
      cy.wrap($row).should("contain.text", "฿7,695");
    });
    cy.get("[data-mini-cart-footer]").should("contain.text", "฿8,550")
      .and("contain.text", "−฿855").and("contain.text", "฿7,695");
  });
  it("blocks checkout for changed/unavailable items and excludes unavailable value", () => {
    mocks([
      row({
        id: 1901,
        listingId: 901,
        currentPrice: 150,
        unitPriceAtAdd: 70,
        priceChanged: true,
        pricing: null,
      }),
      row({ id: 1902, listingId: 902, currentPrice: 9000, purchasable: false }),
    ]);
    open();
    cy.get('[data-mini-cart-state="attention"]').should("exist");
    cy.contains("การลดราคาจบแล้ว").should("be.visible");
    cy.contains("ขายหมดแล้ว · ไม่นับในยอดรวม").should("be.visible");
    cy.get("[data-mini-cart-footer]")
      .should("contain.text", "มี 2 รายการ")
      .and("contain.text", "฿250");
    cy.get('[data-slot="sheet-content"] a[href^="/checkout"]').should(
      "not.exist",
    );
    cy.contains("a", "ตรวจสอบในตะกร้า").should("have.attr", "href", "/cart");
  });
  it("quick tile add shows image and cart link toast without opening drawer", () => {
    mocks();
    cy.visit("/listings/877");
    cy.get('button[aria-label="เพิ่มลงตะกร้า Card 2"]').click();
    cy.wait("@add");
    cy.get('[data-slot="sheet-content"]').should("not.exist");
    cy.get('[data-slot="toast"]')
      .should("contain.text", "เพิ่มลงตะกร้าแล้ว")
      .and("contain.text", "Card 2");
    cy.get('[data-slot="toast"] img').should("have.attr", "src", image);
    cy.get('[data-slot="toast-action"]').should("contain.text", "ดูตะกร้า");
  });
  it("quick-add errors explain the refusal without opening the drawer", () => {
    mocks();
    cy.intercept("POST", "**/api/v1/cart/items", {
      statusCode: 409,
      body: {
        success: false,
        message: "Sold out",
        data: { code: "INSUFFICIENT_STOCK", details: {} },
      },
    }).as("refused");
    cy.visit("/listings/877");
    cy.get('button[aria-label="เพิ่มลงตะกร้า Card 2"]').click();
    cy.wait("@refused");
    cy.get('[data-slot="sheet-content"]').should("not.exist");
    cy.get('[data-slot="toast"]').should(
      "contain.text",
      "เพิ่มลงตะกร้าไม่สำเร็จ",
    );
  });
  it("renders a bottom sheet on mobile and closes on continue", () => {
    cy.viewport(390, 844);
    mocks();
    open();
    cy.get('[data-slot="sheet-content"]')
      .should("have.attr", "data-side", "bottom")
      .then(($el) =>
        expect($el[0].getBoundingClientRect().height).to.be.lte(718),
      );
    cy.screenshot("TCG-664-mobile", { capture: "viewport" });
    cy.contains("button", "เลือกซื้อต่อ").click();
    cy.get('[data-slot="sheet-content"]').should("not.exist");
  });
  it("opens from product detail and market listing entry points", () => {
    mocks();
    cy.visit("/products/card");
    cy.contains("button", /^เพิ่มลงตะกร้า$/).click();
    cy.wait("@add");
    cy.get("[data-mini-cart-state]").should("be.visible");
    cy.contains("button", "เลือกซื้อต่อ").click();
    cy.visit("/products/card/listings");
    cy.get('button[aria-label="เพิ่มสินค้าของ TCG Corner ลงรถเข็น"]').click();
    cy.wait("@add");
    cy.get("[data-mini-cart-state]").should("be.visible");
  });
  it("refreshes into Needs attention when a sale expires while open", () => {
    const expiring = {
      ...sale,
      sale: {
        ...sale.sale,
        endsAt: new Date(Date.now() + 60000).toISOString(),
      },
    };
    const state = mocks([], expiring);
    open();
    cy.get('[data-mini-cart-state="sale"]').should("exist");
    cy.clock(Date.now(), ["Date"]);
    cy.then(() =>
      state.setItems(
        state.getItems().map((i) => ({
          ...i,
          pricing: null,
          currentPrice: 100,
          priceChanged: true,
        })),
      ),
    );
    cy.tick(61000);
    cy.get('[data-mini-cart-state="attention"]', { timeout: 12000 }).should(
      "exist",
    );
    cy.get('[data-slot="sheet-content"] a[href^="/checkout"]').should(
      "not.exist",
    );
  });
  it("allows guest cart additions and sends checkout through sign-in", () => {
    mocks([], undefined, true);
    open();
    cy.get('[data-slot="sheet-content"] a[href^="/checkout"]').click();
    cy.url().should("include", "/login");
  });
});
