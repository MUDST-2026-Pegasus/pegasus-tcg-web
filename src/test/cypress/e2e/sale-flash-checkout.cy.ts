// cypress/e2e/sale-flash-checkout.cy.ts
// TCG-683 (SAL-08): เพิ่มสินค้า Flash Sale ลงตะกร้า → checkout ยอดตรงกับราคา Flash ของ API

describe("Flash Sale: add to cart → checkout total", () => {
  const endsAt = new Date(Date.now() + 5 * 3600_000).toISOString();
  const flashPricing = {
    listPrice: 1990,
    salePrice: 1393,
    discountPercent: 30,
    sale: {
      id: 1,
      slug: "1111-flash",
      name: "11.11 Flash Sale",
      type: "FLASH_SALE",
      endsAt,
      quotaLeft: 3,
      perBuyerLimit: 1,
    },
  };

  const listing = {
    id: 501,
    card: {
      variantId: 9,
      sku: "OP09-BOX",
      variantLabel: "JP · Booster Box",
      productId: 90,
      productName: "OP-09 Booster Box",
      productSlug: "op-09-booster-box",
      gameId: 2,
      officialImageUrl: null,
    },
    condition: "SEALED",
    price: 1990,
    currency: "THB",
    quantityAvailable: 3,
    primaryPhotoUrl: null,
    seller: {
      username: "minmin_tcg",
      displayName: "minmin",
      avatarUrl: null,
      verified: true,
      ratingAvg: 4.9,
      ratingCount: 10,
      salesCount: 100,
    },
    delivery: { fastestEstDaysMin: 1, fastestEstDaysMax: 2, freeShipping: false, optionCount: 1 },
    pricing: flashPricing,
    saleQuota: 20,
  };

  const cartItem = {
    id: 701,
    cartId: 1,
    listingId: 501,
    quantity: 1,
    unitPriceAtAdd: 1393,
    currentPrice: 1393,
    priceChanged: false,
    purchasable: true,
    quantityAvailable: 3,
    sellerProfileId: 10,
    catalogVariantId: 9,
    condition: "SEALED",
    currency: "THB",
    addedAt: "2026-11-11T01:00:00Z",
    updatedAt: "2026-11-11T01:00:00Z",
    productName: "OP-09 Booster Box",
    variantLabel: "JP · Booster Box",
    sellerName: "minmin",
    sellerUsername: "minmin_tcg",
    imageUrl: null,
    productId: 90,
    pricing: flashPricing,
  };

  const ok = (data: unknown) => ({ statusCode: 200, body: { success: true, message: "ok", data } });

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept("POST", "**/api/v1/auth/refresh", ok({ tokens: { accessToken: "mock-buyer-access-token", expiresIn: 3600 } }));
    cy.intercept("GET", "**/api/v1/auth/me", ok({ id: 3, email: "b@example.com", username: "buyer", displayName: "Buyer", roles: ["BUYER"] }));
    cy.intercept("GET", "**/api/v1/sales", ok([]));
    cy.intercept("GET", "**/api/v1/checkout/promotions*", ok([]));
    cy.intercept("POST", "**/api/v1/checkout/promo-preview", ok({
      sellers: [{ sellerProfileId: 10, sellerName: "minmin", itemsSubtotal: 1393, shippingFee: 50, sellerDiscount: 0, platformDiscount: 0, grandTotal: 1443 }],
      itemsSubtotal: 1393,
      shippingTotal: 50,
      sellerDiscountTotal: 0,
      platformDiscountTotal: 0,
      grandTotal: 1443,
      shippingEstimated: false,
      codes: [],
      bestPick: null,
    }));
  });

  it("adds at the flash price, then checkout charges sale price + shipping", () => {
    let cart = { id: 1, userId: 3, sessionKey: null, currency: "THB", items: [] as unknown[], totalQuantity: 0, itemsSubtotal: 0, expiresAt: null };
    cy.intercept("GET", "**/api/v1/cart", (req) => req.reply(ok(cart))).as("getCart");
    cy.intercept("GET", "**/api/v1/listings/501", ok({ listing: { ...listing, publicNote: null, gradingCompany: null, gradeValue: null }, photoUrls: [] })).as("getListing");
    cy.intercept("POST", "**/api/v1/cart/items", (req) => {
      expect(req.body).to.deep.equal({ listingId: 501, quantity: 1 });
      cart = { ...cart, items: [cartItem], totalQuantity: 1, itemsSubtotal: 1393 };
      req.reply({ statusCode: 201, body: { success: true, message: "ok", data: cartItem } });
    }).as("addItem");

    cy.visit("/listings/501");
    cy.wait("@getListing");

    // Buy box แบบ Flash (Figma SAL-B3 B)
    cy.contains("⚡ FLASH SALE").should("be.visible");
    cy.contains(/จบใน \d{2}:\d{2}:\d{2}/).should("be.visible");
    cy.contains("฿1,393").should("be.visible");
    cy.contains("s", "฿1,990").should("exist");
    cy.contains("ขายแล้ว 17/20 · ราคานี้เหลือ 3 ใบ · คนละ 1 ชิ้น").should("be.visible");

    cy.contains("button", "เพิ่มลงตะกร้า").click();
    cy.wait("@addItem");
    cy.contains("เพิ่มลงตะกร้าที่ราคา Flash").should("be.visible");

    // ตะกร้า: ราคาก่อนลด / ส่วนลดราคาสินค้า
    cy.visit("/cart");
    cy.wait("@getCart");
    cy.contains("ราคาสินค้า (ก่อนลด)").parent().should("contain.text", "฿1,990");
    cy.contains("ส่วนลดราคาสินค้า").parent().should("contain.text", "฿597");
    cy.contains("ยอดสินค้า (1 ใบ)").parent().should("contain.text", "1,393");

    // checkout: ยอดสินค้าเท่าราคา Flash (ค่าที่ server ส่งมา) + ค่าส่ง
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
        itemsSubtotal: 1393,
        defaultOptionId: 7,
        options: [
          { id: 7, name: "Kerry Express", carrierCode: "KERRY", baseFee: 50, perItemFee: 0, freeThreshold: null, estDaysMin: 1, estDaysMax: 2, fee: 50, free: false, amountToFree: null },
        ],
      },
    ])).as("getQuotes");
    cy.intercept("POST", "**/api/v1/checkout", {
      statusCode: 201,
      body: {
        success: true,
        message: "ok",
        data: { orderId: 77, orderNumber: "PGS-20261111-000077", status: "PENDING_PAYMENT", itemsSubtotal: 1393, saleDiscountTotal: 597, shippingTotal: 50, discountTotal: 0, grandTotal: 1443, sellerOrders: [] },
      },
    }).as("placeOrder");
    cy.intercept("POST", "**/api/v1/payments/order/*", { statusCode: 201, body: { success: true, data: { id: 1, orderId: 77, amount: 1443, currency: "THB", status: "PENDING" } } });
    cy.intercept("GET", "**/api/v1/orders/*", ok({ id: 77, orderNumber: "PGS-20261111-000077", status: "PENDING_PAYMENT", grandTotal: 1443, items: [] }));

    cy.visit("/checkout?items=701");
    cy.wait(["@getAddresses", "@getQuotes"]);
    cy.contains("ราคาสินค้า (ก่อนลด)").parent().should("contain.text", "1,990");
    cy.contains("ส่วนลดราคาสินค้า").parent().should("contain.text", "฿597");
    cy.get('[data-testid="checkout-grand-total"]').should("contain.text", "1,443");

    cy.contains("button", "สั่งซื้อและไปชำระเงิน").should("be.enabled").click();
    cy.wait("@placeOrder").its("request.body").should((body) => {
      expect(body.cartItemIds).to.deep.equal([701]);
      expect(body.shippingAddressId).to.equal(1);
      expect(body.shippingOptionBySeller).to.deep.equal({ 10: 7 });
      expect(body.expectedGrandTotal).to.equal(1443);
    });
    cy.url().should("include", "/payment");
  });
});
