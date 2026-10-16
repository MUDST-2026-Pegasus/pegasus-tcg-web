// cypress/e2e/01-buyer-journey.cy.ts
// E2E Test Flow 1: Buyer Journey
// Flow: สมัครสมาชิก → Login → ค้นหาการ์ด → เพิ่มลงตะกร้า → เลือกที่อยู่ → สั่งซื้อ

describe("E2E Flow 1: Buyer Complete Journey", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Standard intercept for /auth/me when authenticated
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 3,
          email: "somying.buyer@example.com",
          username: "somying_buyer",
          displayName: "Somying Collector",
          roles: ["BUYER"],
        },
      },
    }).as("meRequest");
  });

  it("1. Buyer Registration: fills form, accepts terms, and registers successfully", () => {
    cy.intercept("POST", "**/api/v1/auth/register", {
      statusCode: 201,
      body: {
        success: true,
        data: {
          tokens: {
            accessToken: "mock-buyer-access-token",
            refreshToken: "mock-buyer-refresh-token",
            expiresIn: 3600,
          },
          user: {
            id: 3,
            email: "somying.buyer@example.com",
            username: "somying_buyer",
            displayName: "Somying Collector",
            roles: ["BUYER"],
          },
        },
      },
    }).as("registerRequest");

    cy.visit("/register");
    cy.contains(/Sign up|Create your account/i).should("be.visible");

    // Fill registration inputs
    cy.get('input[name="username"]').type("somying_buyer");
    cy.get('input[name="displayName"]').type("Somying Collector");
    cy.get('input[name="email"]').type("somying.buyer@example.com");
    cy.get('input[name="password"]').type("Password123!");
    cy.get('input[name="confirmPassword"]').type("Password123!");

    // Accept terms
    cy.get("#terms").click({ force: true });

    // Submit form
    cy.get('button[type="submit"]').click();
    cy.wait("@registerRequest");

    // Should redirect away from /register
    cy.url().should("not.include", "/register");
  });

  it("2. Buyer Login: signs in with email/password and redirects to homepage", () => {
    cy.intercept("POST", "**/api/v1/auth/login", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          tokens: {
            accessToken: "mock-buyer-access-token",
            refreshToken: "mock-buyer-refresh-token",
            expiresIn: 3600,
          },
          user: {
            id: 3,
            email: "somying.buyer@example.com",
            username: "somying_buyer",
            displayName: "Somying Collector",
            roles: ["BUYER"],
          },
        },
      },
    }).as("loginRequest");

    cy.visit("/login");
    cy.get('input[name="email"]').type("somying.buyer@example.com");
    cy.get('input[name="password"]').type("Password123!");
    cy.get('button[type="submit"]').click();

    cy.wait("@loginRequest");
    cy.url().should("not.include", "/login");
  });

  it("3. Catalog & Search: buyer explores cards in the catalog", () => {
    cy.intercept("GET", "**/api/v1/games*", {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: 1, code: "POKEMON", name: "Pokémon", nameLocal: "โปเกมอน", slug: "pokemon", logoUrl: null, displayOrder: 1 },
        ],
      },
    }).as("getGames");

    cy.intercept("GET", "**/api/v1/categories*", {
      statusCode: 200,
      body: { success: true, data: [] },
    }).as("getCategories");

    cy.intercept("GET", "**/api/v1/catalog/products*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: 1,
              slug: "pikachu-ex-025-187",
              name: "Pikachu ex",
              nameLocal: "พิคาชู ex",
              cardNumber: "025/187",
              rarityCode: "RR",
              lowestPrice: 250,
              primaryImageUrl: null,
            },
            {
              id: 2,
              slug: "charizard-ex-006-165",
              name: "Charizard ex",
              nameLocal: "ลิซาร์ดอน ex",
              cardNumber: "006/165",
              rarityCode: "SAR",
              lowestPrice: 500,
              primaryImageUrl: null,
            },
          ],
          totalItems: 2,
          totalPages: 1,
          page: 0,
          size: 20,
        },
      },
    }).as("getProducts");

    cy.visit("/products");
    cy.wait("@getProducts");
    cy.contains("Pikachu ex").should("be.visible");
    cy.contains("Charizard ex").should("be.visible");
  });

  it("4. Product Details & Add to Cart: buyer views card and adds it to cart", () => {
    cy.intercept("GET", "**/api/v1/games*", {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: 1, code: "POKEMON", name: "Pokémon", nameLocal: "โปเกมอน", slug: "pokemon", logoUrl: null, displayOrder: 1 },
        ],
      },
    }).as("getGames");

    cy.intercept("GET", "**/api/v1/cart*", {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], itemsSubtotal: 0, totalQuantity: 0, currency: "THB" },
      },
    }).as("getCartInitial");

    cy.intercept("GET", "**/api/v1/catalog/products/pikachu-ex-025-187*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          product: {
            id: 1,
            gameId: 1,
            categoryId: 1,
            cardSetId: 1,
            productType: "SINGLE_CARD",
            slug: "pikachu-ex-025-187",
            name: "Pikachu ex",
            nameLocal: "พิคาชู ex",
            cardNumber: "025/187",
            rarityCode: "RR",
            description: "Lightning Tera Pokémon ex with 200 HP",
            attributes: {},
            active: true,
          },
          variants: [
            {
              id: 10,
              catalogProductId: 1,
              sku: "POKEMON-SV8A-025-187-EN-NORMAL",
              languageCode: "en",
              finish: "Normal",
              edition: "Unlimited",
              printingNote: null,
              imageUrl: null,
              active: true,
            },
          ],
          images: [],
        },
      },
    }).as("getProductDetail");

    cy.intercept("GET", "**/api/v1/listings*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: 1,
              card: {
                variantId: 10,
                sku: "POKEMON-SV8A-025-187-EN-NORMAL",
                variantLabel: "Normal",
                productId: 1,
                productName: "Pikachu ex",
                productSlug: "pikachu-ex-025-187",
                gameId: 1,
                officialImageUrl: null,
              },
              condition: "NM",
              price: 250,
              currency: "THB",
              quantityAvailable: 5,
              primaryPhotoUrl: null,
              seller: {
                username: "somchai_seller",
                displayName: "Somchai Cards Shop",
                avatarUrl: null,
                verified: true,
                ratingAvg: 4.9,
                ratingCount: 12,
                salesCount: 80,
              },
              delivery: {
                fastestEstDaysMin: 1,
                fastestEstDaysMax: 2,
                freeShipping: false,
                optionCount: 1,
              },
            },
          ],
          page: 0,
          size: 100,
          totalItems: 1,
          totalPages: 1,
        },
      },
    }).as("getListings");

    cy.intercept("GET", "**/api/v1/catalog/products/*/market*", {
      statusCode: 200,
      body: { success: true, data: [] },
    });

    cy.intercept("GET", "**/api/v1/catalog/products/*/effects*", {
      statusCode: 200,
      body: { success: true, data: [] },
    });

    cy.intercept("GET", "**/api/v1/catalog/products/*/collectors*", {
      statusCode: 200,
      body: { success: true, data: { items: [], totalItems: 0, totalPages: 1, page: 0, size: 20 } },
    });

    cy.intercept("POST", "**/api/v1/cart/items", {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 101,
          cartId: 1,
          listingId: 1,
          quantity: 1,
        },
      },
    }).as("addToCart");

    cy.visit("/products/pikachu-ex-025-187", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "pegasus.auth.session",
          JSON.stringify({
            accessToken: "mock-buyer-access-token",
            refreshToken: "mock-buyer-refresh-token",
            accessExpiresAt: Date.now() + 3600000,
          })
        );
      },
    });

    cy.wait("@getProductDetail");
    cy.wait("@getListings");
    cy.contains("Pikachu ex").should("be.visible");
    cy.contains("Somchai Cards Shop").should("be.visible");

    cy.contains("button", /^Add$/i).first().click();
    cy.wait("@addToCart").its("request.body").should("deep.equal", {
      listingId: 1,
      quantity: 1,
    });
  });

  it("5. Shopping Cart: displays multi-seller items and accurate order summary", () => {
    cy.intercept("GET", "**/api/v1/cart", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          itemsSubtotal: 750,
          totalQuantity: 2,
          currency: "THB",
          items: [
            {
              id: 101,
              listingId: 1,
              productName: "Pikachu ex",
              variantLabel: "SV8A · English",
              condition: "NM",
              unitPriceAtAdd: 250,
              currentPrice: 250,
              quantity: 1,
              quantityAvailable: 5,
              sellerProfileId: 10,
              sellerName: "Somchai Cards Shop",
              purchasable: true,
            },
            {
              id: 102,
              listingId: 2,
              productName: "Charizard ex",
              variantLabel: "MEW · English",
              condition: "NM",
              unitPriceAtAdd: 500,
              currentPrice: 500,
              quantity: 1,
              quantityAvailable: 2,
              sellerProfileId: 20,
              sellerName: "Bangkok TCG Hub",
              purchasable: true,
            },
          ],
        },
      },
    }).as("getCart");

    cy.visit("/cart", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "pegasus.auth.session",
          JSON.stringify({
            accessToken: "mock-buyer-access-token",
            refreshToken: "mock-buyer-refresh-token",
            accessExpiresAt: Date.now() + 3600000,
          })
        );
      },
    });

    // Check cart items
    cy.contains(/Shopping Cart/i).should("be.visible");
    cy.contains(/Pikachu ex/i).should("be.visible");
    cy.contains(/Charizard ex/i).should("be.visible");

    // Order Summary multi-seller math
    // Subtotal: 250 + 500 = 750
    // Shipping: 2 sellers * 50 = 100
    // Total: 850
    cy.contains(/Order Summary/i).should("be.visible");
    cy.contains(/฿750/).should("be.visible");
    cy.contains(/฿100/).should("be.visible");
    cy.contains(/฿850/).should("be.visible");

    // Click checkout
    cy.contains(/Proceed to Checkout/i).should("be.visible");
  });

  it("6. Checkout & Place Order: selects shipping address and completes order submission", () => {
    cy.intercept("GET", "**/api/v1/cart", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          itemsSubtotal: 250,
          totalQuantity: 1,
          currency: "THB",
          items: [
            {
              id: 101,
              productId: 1,
              listingId: 1,
              productName: "Pikachu ex",
              variantLabel: "SV8A · English",
              condition: "NM",
              unitPriceAtAdd: 250,
              currentPrice: 250,
              quantity: 1,
              quantityAvailable: 5,
              sellerProfileId: 10,
              sellerName: "Somchai Cards Shop",
              purchasable: true,
            },
          ],
        },
      },
    }).as("getCartCheckout");

    cy.intercept("GET", "**/api/v1/addresses*", {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            userId: 3,
            label: "บ้านพัก",
            recipientName: "สมหญิง ใจดี",
            phone: "0891234567",
            line1: "88/1 ถนนพหลโยธิน",
            line2: null,
            subdistrict: "จตุจักร",
            district: "จตุจักร",
            province: "กรุงเทพมหานคร",
            postalCode: "10900",
            countryCode: "TH",
            defaultShipping: true,
            defaultBilling: true,
            createdAt: "2026-10-15T00:00:00Z",
          },
        ],
      },
    }).as("getAddresses");

    // หน้า checkout ขอค่าส่งของแต่ละร้านก่อน — ปุ่มสั่งซื้อจะกดได้เมื่อมีตัวเลือกจัดส่งครบทุกร้าน
    cy.intercept("POST", "**/api/v1/checkout/shipping-quotes", {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            sellerProfileId: 10,
            sellerName: "Somchai Cards Shop",
            itemCount: 1,
            itemsSubtotal: 250,
            defaultOptionId: 7,
            options: [
              {
                id: 7,
                name: "Kerry Express",
                carrierCode: "KERRY",
                baseFee: 50,
                perItemFee: 0,
                freeThreshold: null,
                estDaysMin: 1,
                estDaysMax: 3,
                fee: 50,
                free: false,
                amountToFree: null,
              },
            ],
          },
        ],
      },
    }).as("getShippingQuotes");

    cy.intercept("POST", "**/api/v1/checkout", {
      statusCode: 201,
      body: {
        success: true,
        data: {
          orderId: 42,
          orderNumber: "PGS-20261015-000042",
          status: "PENDING_PAYMENT",
          grandTotal: 300,
        },
      },
    }).as("placeOrder");

    cy.intercept("POST", "**/api/v1/payments/order/*", {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 10,
          orderId: 42,
          amount: 300,
          currency: "THB",
          status: "PENDING",
          method: "PROMPTPAY",
          qrPayload: "00020101021229370016A000000677010111011300668123456785802TH53037645406300.006304ABCD",
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        },
      },
    }).as("createPayment");

    cy.intercept("GET", "**/api/v1/orders/*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 42,
          orderNumber: "PGS-20261015-000042",
          status: "PENDING_PAYMENT",
          grandTotal: 300,
          items: [],
        },
      },
    }).as("getOrder");

    cy.visit("/checkout?items=101", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "pegasus.auth.session",
          JSON.stringify({
            accessToken: "mock-buyer-access-token",
            refreshToken: "mock-buyer-refresh-token",
            accessExpiresAt: Date.now() + 3600000,
          })
        );
      },
    });

    cy.wait("@getCartCheckout");
    cy.wait("@getAddresses");
    cy.wait("@getShippingQuotes");

    cy.contains("h1", "ตรวจสอบและสั่งซื้อ").should("be.visible");
    cy.contains(/88\/1 ถนนพหลโยธิน/i).should("be.visible");
    // 250 + ค่าส่ง 50
    cy.get('[data-testid="checkout-grand-total"]').should("contain.text", "300");

    // Click Purchase button
    cy.contains("button", "สั่งซื้อและไปชำระเงิน").should("be.enabled").click();
    cy.wait("@placeOrder").its("request.body").should("deep.equal", {
      cartItemIds: [101],
      shippingAddressId: 1,
      shippingOptionBySeller: { 10: 7 },
    });

    // Navigates to payment page
    cy.url().should("include", "/payment");
  });
});
