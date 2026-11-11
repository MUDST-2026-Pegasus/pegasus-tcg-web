// cypress/e2e/sale-qa.cy.ts
// TCG-684 (SAL-09): e2e ของการลดราคาสินค้าโดยตรง — API ทั้งหมดเป็น mock ตามสัญญาของ SAL-02..05
//   1. แอดมินสร้าง CATEGORY_SALE → ราคาลดบน search / listing / ตะกร้า
//   2. ผู้ขายลดราคาแบบเลือก listing → ขึ้นราคา listing นั้น → modal SALE_PRICE_LOCKED
//   3. Flash Sale: ชิ้นที่ 2 ราคาปกติ (SALE_BUYER_LIMIT_REACHED) · โควตาหมด → SALE_QUOTA_REACHED
//   4. ราคาลดจบระหว่างอยู่ในตะกร้า → ยืนยันราคาใหม่ → checkout ผ่าน
//   5. ราคาลด + โค้ดร้าน + โค้ด Pegasus → ยอดตรง Figma SAL-B3 D (THB 3,530.00)

const ok = (data: unknown, statusCode = 200) => ({ statusCode, body: { success: true, message: "ok", data } });
const fail = (statusCode: number, code: string, message: string, details: Record<string, unknown> = {}) => ({
  statusCode,
  body: { success: false, message, data: { code, details } },
});
const page = <T>(items: T[]) => ({ items, page: 0, size: 20, totalItems: items.length, totalPages: 1 });

const inHours = (hours: number) => new Date(Date.now() + hours * 3600_000).toISOString();

const seller = {
  username: "minmin_tcg",
  displayName: "minmin",
  avatarUrl: null,
  verified: true,
  ratingAvg: 4.9,
  ratingCount: 10,
  salesCount: 100,
};

/** Figma SAL-B3 A: Charizard ex SAR THB 4,200.00 ใน Pokémon Month ลด 10% */
const monthPricing = {
  listPrice: 4200,
  salePrice: 3780,
  discountPercent: 10,
  sale: { id: 2, slug: "pokemon-month", name: "Pokémon Month", type: "CATEGORY_SALE", endsAt: inHours(24 * 25), quotaLeft: null, perBuyerLimit: null },
};

/** Figma SAL-B3 B: OP-09 Booster Box THB 1,990.00 → THB 1,393.00 */
const flashPricing = {
  listPrice: 1990,
  salePrice: 1393,
  discountPercent: 30,
  sale: { id: 1, slug: "1111-flash", name: "11.11 Flash Sale", type: "FLASH_SALE", endsAt: inHours(5), quotaLeft: 3, perBuyerLimit: 1 },
};

function publicListing(id: number, name: string, price: number, pricing: unknown) {
  return {
    id,
    card: {
      variantId: id,
      sku: `SKU-${id}`,
      variantLabel: "EN · Holo",
      productId: id + 1000,
      productName: name,
      productSlug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      gameId: 1,
      officialImageUrl: null,
    },
    condition: "NM",
    price,
    currency: "THB",
    quantityAvailable: 3,
    primaryPhotoUrl: null,
    seller,
    delivery: { fastestEstDaysMin: 1, fastestEstDaysMax: 2, freeShipping: false, optionCount: 1 },
    pricing,
  };
}

function cartItem(id: number, listingId: number, name: string, unitPriceAtAdd: number, currentPrice: number, pricing: unknown, extra = {}) {
  return {
    id,
    cartId: 1,
    listingId,
    quantity: 1,
    unitPriceAtAdd,
    currentPrice,
    priceChanged: false,
    purchasable: true,
    quantityAvailable: 3,
    sellerProfileId: 10,
    catalogVariantId: listingId,
    condition: "NM",
    currency: "THB",
    addedAt: "2026-11-11T01:00:00Z",
    updatedAt: "2026-11-11T01:00:00Z",
    productName: name,
    variantLabel: "EN · Holo",
    sellerName: "minmin",
    sellerUsername: "minmin_tcg",
    imageUrl: null,
    productId: listingId + 1000,
    pricing,
    ...extra,
  };
}

function cartOf(items: Array<ReturnType<typeof cartItem>>) {
  return {
    id: 1,
    userId: 3,
    sessionKey: null,
    currency: "THB",
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    itemsSubtotal: items.reduce((sum, item) => sum + item.currentPrice * item.quantity, 0),
    expiresAt: null,
  };
}

function mockBuyer() {
  cy.loginAs("BUYER");
  cy.intercept("GET", "**/api/v1/sales", ok([]));
  cy.intercept("GET", "**/api/v1/checkout/promotions*", ok([]));
}

function mockCheckoutShipping(itemsSubtotal: number) {
  cy.intercept("GET", "**/api/v1/addresses*", ok([
    {
      id: 1,
      userId: 3,
      label: "บ้าน",
      recipientName: "ผู้ซื้อ",
      phone: "0890000000",
      line1: "1 ถนนสุขุมวิท",
      line2: null,
      subdistrict: "คลองเตย",
      district: "คลองเตย",
      province: "กรุงเทพมหานคร",
      postalCode: "10110",
      countryCode: "TH",
      defaultShipping: true,
      defaultBilling: true,
      createdAt: "2026-10-15T00:00:00Z",
    },
  ])).as("getAddresses");
  cy.intercept("POST", "**/api/v1/checkout/shipping-quotes", ok([
    {
      sellerProfileId: 10,
      sellerName: "minmin",
      itemCount: 1,
      itemsSubtotal,
      defaultOptionId: 7,
      options: [
        { id: 7, name: "Kerry Express", carrierCode: "KERRY", baseFee: 50, perItemFee: 0, freeThreshold: null, estDaysMin: 1, estDaysMax: 2, fee: 50, free: false, amountToFree: null },
      ],
    },
  ])).as("getQuotes");
  cy.intercept("POST", "**/api/v1/payments/order/*", ok({ id: 1, orderId: 77, amount: 0, currency: "THB", status: "PENDING" }, 201));
  cy.intercept("GET", "**/api/v1/orders/*", ok({ id: 77, orderNumber: "PGS-20261111-000077", status: "PENDING_PAYMENT", grandTotal: 0, items: [] }));
}

function promoPreview(itemsSubtotal: number, sellerDiscount: number, platformDiscount: number, codes: unknown[] = []) {
  const grandTotal = itemsSubtotal + 50 - sellerDiscount - platformDiscount;
  return ok({
    sellers: [{ sellerProfileId: 10, sellerName: "minmin", itemsSubtotal, shippingFee: 50, sellerDiscount, platformDiscount, grandTotal }],
    itemsSubtotal,
    shippingTotal: 50,
    sellerDiscountTotal: sellerDiscount,
    platformDiscountTotal: platformDiscount,
    grandTotal,
    shippingEstimated: false,
    codes,
    bestPick: null,
  });
}

beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
});

describe("1. Admin CATEGORY_SALE → sale price on search / listing / cart", () => {
  it("creates the campaign, then buyers see THB 3,780.00 struck from THB 4,200.00 everywhere", () => {
    cy.loginAs("ADMIN");
    cy.intercept("GET", "**/api/v1/sales", ok([]));
    cy.intercept("GET", "**/api/v1/cart*", ok(cartOf([])));
    cy.intercept("GET", "**/api/v1/admin/games*", ok([{ id: 1, code: "POKEMON", name: "Pokemon TCG" }]));
    cy.intercept("GET", "**/api/v1/games*", ok([{ id: 1, code: "POKEMON", name: "Pokemon TCG", slug: "pokemon-tcg" }]));
    cy.intercept("GET", "**/api/v1/admin/categories*", ok([
      { id: 5, gameId: 1, parentId: null, code: "SINGLES", name: "การ์ดเดี่ยว", slug: "singles", displayOrder: 1, active: true },
    ]));
    cy.intercept("GET", "**/api/v1/admin/users*", ok(page([])));
    cy.intercept("POST", "**/api/v1/admin/sales/preview-scope", ok({ listingCount: 128, shopCount: 12, listTotal: 512000 }));
    cy.intercept("GET", "**/api/v1/admin/sales*", ok(page([])));
    cy.intercept("POST", "**/api/v1/admin/sales", (req) => {
      req.reply(ok({ id: 2, ...req.body, status: "SCHEDULED", ownerType: "PLATFORM" }, 201));
    }).as("createSale");

    cy.visit("/admin/sales/new");
    cy.contains("ลดทั้งหมวด / ชุดการ์ด").click();
    cy.get("#sale-name").type("Pokemon Month");
    cy.get("#sale-slug").clear().type("pokemon-month");
    cy.get('[role="group"][aria-label="ขอบเขตสินค้า"]').contains("หมวดหมู่").click();
    cy.contains("button", "เพิ่มหมวดหมู่").click();
    cy.contains("button", "การ์ดเดี่ยว").click();
    cy.get("#sale-discountValue").clear().type("10");
    cy.contains("128").should("exist");

    cy.contains("button", "ตั้งเวลาเปิดแคมเปญ").click();
    cy.contains("button", /^ตั้งเวลาเปิด$/).click();
    cy.wait("@createSale").its("request.body").should((body) => {
      expect(body.saleType).to.equal("CATEGORY_SALE");
      expect(body.scopeType).to.equal("CATEGORY");
      expect(body.scopeIds).to.deep.equal([5]);
      expect(body.discountType).to.equal("PERCENT");
      expect(body.discountValue).to.equal(10);
      expect(body.slug).to.equal("pokemon-month");
    });
    cy.url().should("include", "/admin/promotions");

    // ----- campaign now ACTIVE: buyer side -----
    cy.clearCookies();
    mockBuyer();
    cy.intercept("GET", "**/api/v1/categories*", ok([]));
    cy.intercept("GET", "**/api/v1/catalog/products*", ok(page([
      {
        id: 1201,
        slug: "charizard-ex-sar",
        name: "Charizard ex SAR",
        nameLocal: null,
        gameId: 1,
        categoryId: 5,
        cardSetId: null,
        productType: "SINGLE_CARD",
        cardNumber: "199/165",
        rarityCode: "SAR",
        primaryImageUrl: null,
        variantCount: 1,
        lowestPrice: 4200,
        listingCount: 1,
        pricing: monthPricing,
      },
    ]))).as("search");
    cy.visit("/search?q=Charizard");
    cy.wait("@search");
    cy.contains("Charizard ex SAR").should("be.visible");
    cy.contains("THB 3,780.00").should("be.visible");
    cy.contains("THB 4,200.00").should("exist");

    const listing = publicListing(201, "Charizard ex SAR", 4200, monthPricing);
    cy.intercept("GET", "**/api/v1/listings/201", ok({ listing: { ...listing, publicNote: null, gradingCompany: null, gradeValue: null }, photoUrls: [] })).as("getListing");
    cy.visit("/listings/201");
    cy.wait("@getListing");
    cy.contains("THB 3,780.00").should("be.visible");
    cy.contains("s", "THB 4,200.00").should("exist");
    cy.contains("Pokémon Month").should("be.visible");

    cy.intercept("GET", "**/api/v1/cart", ok(cartOf([cartItem(801, 201, "Charizard ex SAR", 3780, 3780, monthPricing)]))).as("getCart");
    cy.intercept("POST", "**/api/v1/checkout/promo-preview", promoPreview(3780, 0, 0));
    cy.visit("/cart");
    cy.wait("@getCart");
    cy.contains("ราคาสินค้า (ก่อนลด)").parent().should("contain.text", "THB 4,200.00");
    cy.contains("ส่วนลดราคาสินค้า").parent().should("contain.text", "THB 420.00");
  });
});

describe("2. Seller LISTINGS sale → raising that price → SALE_PRICE_LOCKED", () => {
  const sellerUser = { id: 10, email: "seller@pegasus.com", username: "minmin_tcg", displayName: "minmin", roles: ["SELLER"], status: "ACTIVE" };
  const profile = { id: 10, userId: 10, status: "VERIFIED", canPublish: true, vacationMode: false, handlingDays: 2, autoAcceptOrders: true };
  const listing = {
    id: 101,
    card: { variantId: 1, sku: "PKM-001", variantLabel: "EN · Holo", variantActive: true, productId: 50, productName: "Charizard ex SAR", productSlug: "charizard-ex-sar", gameId: 1, officialImageUrl: null },
    condition: "NM",
    price: 4200,
    currency: "THB",
    pricingMode: "MANUAL",
    quantityTotal: 2,
    quantityReserved: 0,
    quantityAvailable: 2,
    status: "ACTIVE",
    lotLabel: null,
    updatedAt: "2026-11-01T00:00:00Z",
    gradingCompany: null,
    gradeValue: null,
    autoPriceOffsetPercent: null,
    autoPriceFloor: null,
    autoPriceCeiling: null,
    lastAutoPricedAt: null,
    publicNote: null,
    version: 1,
    publishedAt: "2026-11-01T00:00:00Z",
    createdAt: "2026-11-01T00:00:00Z",
    photos: [],
    similarListings: [],
    costBasis: { quantity: 2, totalCost: 6000, averageUnitCost: 3000 },
  };

  beforeEach(() => {
    cy.loginAs("SELLER", sellerUser);
    cy.intercept("GET", "**/api/v1/cart*", ok(cartOf([])));
    cy.intercept("GET", "**/api/v1/sellers/me", ok(profile));
  });

  it("saves a fixed-price sale for one listing, then refuses a price rise with the lock modal", () => {
    cy.intercept("GET", "**/api/v1/sellers/me/listings?*", ok(page([listing])));
    cy.intercept("GET", "**/api/v1/sellers/me/sales/platform-listings*", ok(page([])));
    cy.intercept("GET", "**/api/v1/categories*", ok([]));
    cy.intercept("POST", "**/api/v1/sellers/me/sales", (req) => {
      req.reply(ok({ id: 31, ...req.body, status: "ACTIVE" }, 201));
    }).as("createSale");
    cy.intercept("GET", "**/api/v1/sellers/me/sales*", ok(page([])));

    cy.visit("/seller/sales/new");
    cy.get("#seller-sale-name").type("Charizard week");
    cy.get('[role="group"][aria-label="สินค้าที่ลด"]').contains("เลือก listing").click();
    cy.get('[aria-label="เลือก Charizard ex SAR"]').click();
    cy.get('[aria-label="ราคาลด Charizard ex SAR"]').clear().type("3600");
    cy.contains("button", /^บันทึก$/).click();
    cy.wait("@createSale").its("request.body").should((body) => {
      expect(body.scopeType).to.equal("LISTINGS");
      expect(body.items).to.deep.include({ listingId: 101, salePrice: 3600 });
    });

    // ขึ้นราคา listing ที่อยู่ในการลดราคา
    cy.intercept("GET", "**/api/v1/sellers/me/listings/101", ok(listing)).as("getListing");
    cy.intercept("GET", "**/api/v1/listings*", ok(page([])));
    cy.intercept("PATCH", "**/api/v1/sellers/me/listings/101/price",
      fail(409, "SALE_PRICE_LOCKED", "Price is locked during a sale", {
        saleName: "Charizard week", ownerType: "SELLER", endsAt: inHours(24 * 6), currentPrice: 4200,
      })).as("changePrice");
    cy.visit("/seller/products/101/edit");
    cy.wait("@getListing");
    cy.contains("label", "ราคาขายต่อใบ").then(($label) => {
      cy.get(`#${$label.attr("for")}`).clear().type("4500");
    });
    cy.contains("button", "บันทึกการเปลี่ยนแปลง").click();
    cy.wait("@changePrice");
    cy.contains("ขึ้นราคาไม่ได้ระหว่างการลดราคา").should("be.visible");
    cy.contains("“Charizard week” (ร้าน)").should("be.visible");
    cy.contains("ราคาที่จะตั้ง").parent().should("contain.text", "THB 4,500.00");
    cy.contains("button", "ตกลง").click();
    cy.contains("ขึ้นราคาไม่ได้ระหว่างการลดราคา").should("not.exist");
  });
});

describe("3. Flash Sale limits", () => {
  beforeEach(() => {
    mockBuyer();
    mockCheckoutShipping(1393);
    cy.intercept("POST", "**/api/v1/checkout/promo-preview", promoPreview(1393, 0, 0));
  });

  it("warns that the 2nd card is at the normal price (per-buyer limit 1)", () => {
    const listing = publicListing(501, "OP-09 Booster Box", 1990, flashPricing);
    cy.intercept("GET", "**/api/v1/cart", ok(cartOf([])));
    cy.intercept("GET", "**/api/v1/listings/501", ok({ listing: { ...listing, saleQuota: 20, publicNote: null, gradingCompany: null, gradeValue: null }, photoUrls: [] })).as("getListing");
    cy.intercept("POST", "**/api/v1/cart/items", (req) => {
      req.reply(ok(cartItem(701, 501, "OP-09 Booster Box", 1393, 1393, flashPricing, { quantity: req.body.quantity }), 201));
    }).as("addItem");

    cy.visit("/listings/501");
    cy.wait("@getListing");
    cy.contains("คนละ 1 ชิ้น").should("be.visible");
    cy.get('[aria-label="เพิ่มจำนวน"]').click();
    cy.contains("button", "เพิ่มลงตะกร้า").click();
    cy.wait("@addItem").its("request.body.quantity").should("equal", 2);
    cy.contains("ชิ้นที่ 2 คิดราคาปกติ THB 1,990.00").should("be.visible");
  });

  it("shows the quota-full modal on SALE_QUOTA_REACHED and buys at the normal price", () => {
    const item = cartItem(701, 501, "OP-09 Booster Box", 1393, 1393, flashPricing);
    let cart = cartOf([item]);
    cy.intercept("GET", "**/api/v1/cart", (req) => req.reply(ok(cart)));
    let attempts = 0;
    cy.intercept("POST", "**/api/v1/checkout", (req) => {
      attempts += 1;
      if (attempts === 1) {
        req.reply(fail(409, "SALE_QUOTA_REACHED", "Flash quota used up", { listingId: 501 }));
        return;
      }
      expect(req.body.expectedGrandTotal).to.equal(2040);
      req.reply(ok({ orderId: 77, orderNumber: "PGS-20261111-000077", status: "PENDING_PAYMENT", itemsSubtotal: 1990, saleDiscountTotal: 0, shippingTotal: 50, discountTotal: 0, grandTotal: 2040, sellerOrders: [] }, 201));
    }).as("placeOrder");
    cy.intercept("POST", "**/api/v1/cart/items/accept-prices", (req) => {
      expect(req.body.cartItemIds).to.deep.equal([701]);
      cart = cartOf([{ ...item, unitPriceAtAdd: 1990, currentPrice: 1990, pricing: null }]);
      req.reply(ok(cart));
    }).as("accept");

    cy.visit("/checkout?items=701");
    cy.wait(["@getAddresses", "@getQuotes"]);
    cy.contains("button", "สั่งซื้อและไปชำระเงิน").click();
    cy.wait("@placeOrder");
    cy.contains("ราคา Flash Sale เต็มแล้ว").should("be.visible");
    cy.contains("ซื้อต่อได้ที่ราคาปกติ THB 1,990.00").should("be.visible");
    cy.intercept("POST", "**/api/v1/checkout/promo-preview", promoPreview(1990, 0, 0));
    cy.intercept("POST", "**/api/v1/checkout/shipping-quotes", ok([
      { sellerProfileId: 10, sellerName: "minmin", itemCount: 1, itemsSubtotal: 1990, defaultOptionId: 7,
        options: [{ id: 7, name: "Kerry Express", carrierCode: "KERRY", baseFee: 50, perItemFee: 0, freeThreshold: null, estDaysMin: 1, estDaysMax: 2, fee: 50, free: false, amountToFree: null }] },
    ]));
    cy.contains("button", "ซื้อราคาปกติ").click();
    cy.wait("@accept");
    cy.contains("ราคา Flash Sale เต็มแล้ว").should("not.exist");
    cy.get('[data-testid="checkout-grand-total"]').should("contain.text", "2,040");
    cy.contains("button", "สั่งซื้อและไปชำระเงิน").click();
    cy.wait("@placeOrder");
    cy.url().should("include", "/payment");
  });
});

describe("4. Sale ends while in the cart", () => {
  it("asks to confirm the new price, then checkout goes through", () => {
    mockBuyer();
    const ended = cartItem(701, 501, "OP-09 Booster Box", 1393, 1990, null, { priceChanged: true });
    let cart = cartOf([ended]);
    cy.intercept("GET", "**/api/v1/cart", (req) => req.reply(ok(cart))).as("getCart");
    cy.intercept("POST", "**/api/v1/checkout/promo-preview", promoPreview(1990, 0, 0));
    cy.intercept("POST", "**/api/v1/cart/items/accept-prices", (req) => {
      cart = cartOf([{ ...ended, unitPriceAtAdd: 1990, priceChanged: false }]);
      req.reply(ok(cart));
    }).as("accept");

    cy.visit("/cart");
    cy.wait("@getCart");
    cy.contains("ราคาสินค้าบางรายการเปลี่ยน").should("be.visible");
    cy.contains("THB 1,393.00 → THB 1,990.00").should("be.visible");
    cy.contains("ยอดรวมใหม่").parent().should("contain.text", "THB 1,990.00");
    cy.contains("button", "ยืนยันราคาใหม่").click();
    cy.wait("@accept").its("request.body.cartItemIds").should("deep.equal", [701]);
    cy.contains("ยอมรับราคาใหม่แล้ว").should("be.visible");

    mockCheckoutShipping(1990);
    cy.intercept("POST", "**/api/v1/checkout", ok({ orderId: 77, orderNumber: "PGS-20261111-000077", status: "PENDING_PAYMENT", itemsSubtotal: 1990, saleDiscountTotal: 0, shippingTotal: 50, discountTotal: 0, grandTotal: 2040, sellerOrders: [] }, 201)).as("placeOrder");
    cy.contains("button", /ไปชำระเงิน \(1\)/).should("be.enabled").click();
    cy.url().should("include", "/checkout");
    cy.wait(["@getAddresses", "@getQuotes"]);
    cy.get('[data-testid="checkout-grand-total"]').should("contain.text", "2,040");
    cy.contains("button", "สั่งซื้อและไปชำระเงิน").click();
    cy.wait("@placeOrder").its("request.body.expectedGrandTotal").should("equal", 2040);
    cy.url().should("include", "/payment");
  });
});

describe("5. Sale price + shop code + Pegasus code (Figma SAL-B3 D)", () => {
  it("totals THB 4,200.00 − THB 420.00 − THB 100.00 − THB 200.00 + THB 50.00 = THB 3,530.00", () => {
    mockBuyer();
    const item = cartItem(801, 201, "Charizard ex SAR", 3780, 3780, monthPricing);
    cy.intercept("GET", "**/api/v1/cart", ok(cartOf([item])));
    mockCheckoutShipping(3780);
    cy.intercept("GET", "**/api/v1/checkout/promotions*", ok([
      { promotionId: 11, code: "MINMIN100", name: "ลด THB 100.00", ownerType: "SELLER", sellerProfileId: 10, discountType: "FIXED", discountValue: 100, maxDiscount: null, minSpend: 0, endsAt: inHours(240), source: "CLAIMED", eligible: true, estimatedDiscount: 100 },
      { promotionId: 12, code: "PEGASUS10", name: "ลด 10%", ownerType: "PLATFORM", sellerProfileId: null, discountType: "PERCENT", discountValue: 10, maxDiscount: 200, minSpend: 0, endsAt: inHours(240), source: "CLAIMED", eligible: true, estimatedDiscount: 200 },
    ]));
    cy.intercept("POST", "**/api/v1/checkout/promo-preview", promoPreview(3780, 100, 200, [
      { code: "MINMIN100", ownerType: "SELLER", sellerProfileId: 10, valid: true, discount: 100 },
      { code: "PEGASUS10", ownerType: "PLATFORM", sellerProfileId: null, valid: true, discount: 200 },
    ]));
    cy.intercept("POST", "**/api/v1/checkout", ok({ orderId: 78, orderNumber: "SO-20261103-0042", status: "PENDING_PAYMENT", itemsSubtotal: 3780, saleDiscountTotal: 420, shippingTotal: 50, discountTotal: 300, grandTotal: 3530, sellerOrders: [] }, 201)).as("placeOrder");

    cy.visit("/checkout?items=801&platformCode=PEGASUS10&shopCode.10=MINMIN100");
    cy.wait(["@getAddresses", "@getQuotes"]);
    cy.contains("ราคาสินค้า (ก่อนลด)").parent().should("contain.text", "THB 4,200.00");
    cy.contains("ส่วนลดราคาสินค้า").parent().should("contain.text", "THB 420.00");
    cy.get('[data-testid="checkout-grand-total"]').should("contain.text", "3,530");
    cy.contains("button", "สั่งซื้อและไปชำระเงิน").click();
    cy.wait("@placeOrder").its("request.body.expectedGrandTotal").should("equal", 3530);
  });
});
