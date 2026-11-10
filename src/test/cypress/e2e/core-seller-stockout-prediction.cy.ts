type Forecast = {
  listingId: number;
  listingName: string;
  status: "FORECAST_AVAILABLE" | "INSUFFICIENT_DATA" | "NO_SALES" | "OUT_OF_STOCK";
  periodStart: string;
  periodEnd: string;
  availableStock: number;
  completedSales30Days: number;
  daysRemaining: number | null;
  estimatedStockoutDate: string | null;
  updatedAt: string;
};

const FIXED_DATE = "2026-11-10";
const thaiDate = (isoDate: string) => new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(new Date(`${isoDate}T00:00:00`));
const thaiGregorianDate = (isoDate: string) => new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(new Date(`${isoDate}T00:00:00`));

const SELLER_A_FORECASTS: Forecast[] = [
  {
    listingId: 101,
    listingName: "Case A Normal Prediction",
    status: "FORECAST_AVAILABLE",
    periodStart: "2026-10-11",
    periodEnd: FIXED_DATE,
    availableStock: 4,
    completedSales30Days: 12,
    daysRemaining: 10,
    estimatedStockoutDate: "2026-11-20",
    updatedAt: `${FIXED_DATE}T00:00:00Z`,
  },
  {
    listingId: 102,
    listingName: "Case B No Sales",
    status: "NO_SALES",
    periodStart: "2026-10-11",
    periodEnd: FIXED_DATE,
    availableStock: 7,
    completedSales30Days: 0,
    daysRemaining: null,
    estimatedStockoutDate: null,
    updatedAt: `${FIXED_DATE}T00:00:00Z`,
  },
  {
    listingId: 103,
    listingName: "Case B Insufficient Data",
    status: "INSUFFICIENT_DATA",
    periodStart: "2026-10-11",
    periodEnd: FIXED_DATE,
    availableStock: 3,
    completedSales30Days: 1,
    daysRemaining: null,
    estimatedStockoutDate: null,
    updatedAt: `${FIXED_DATE}T00:00:00Z`,
  },
  {
    listingId: 104,
    listingName: "Case C High Stock Fast Selling",
    status: "FORECAST_AVAILABLE",
    periodStart: "2026-10-11",
    periodEnd: FIXED_DATE,
    availableStock: 90,
    completedSales30Days: 300,
    daysRemaining: 9,
    estimatedStockoutDate: "2026-11-19",
    updatedAt: `${FIXED_DATE}T00:00:00Z`,
  },
  ...[25, 30, 35, 40].map((days, index): Forecast => ({
    listingId: 105 + index,
    listingName: `Pagination Listing ${index + 1}`,
    status: "FORECAST_AVAILABLE",
    periodStart: "2026-10-11",
    periodEnd: FIXED_DATE,
    availableStock: 10 + index,
    completedSales30Days: 20,
    daysRemaining: days,
    estimatedStockoutDate: (() => {
      const date = new Date(`${FIXED_DATE}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + days);
      return date.toISOString().slice(0, 10);
    })(),
    updatedAt: `${FIXED_DATE}T00:00:00Z`,
  })),
];

const mockSeller = (id: number, email: string, username: string) => ({
  id,
  email,
  username,
  displayName: `Seller ${id} Shop`,
  roles: ["SELLER"],
  status: "ACTIVE",
  bio: null,
  phone: null,
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
  lastLoginAt: null,
});

const sellerProfile = (id: number) => ({
  id,
  userId: id,
  status: "VERIFIED",
  canPublish: true,
  vacationMode: false,
  handlingDays: 2,
  autoAcceptOrders: true,
  verifiedAt: "2026-01-01T00:00:00Z",
  suspendedReason: null,
  createdAt: "2026-01-01T00:00:00Z",
});

const listing = (quantityAvailable: number) => ({
  id: 101,
  card: {
    variantId: 1,
    sku: "PKM-001",
    variantLabel: "Holo",
    variantActive: true,
    productId: 50,
    productName: "Case A Normal Prediction",
    productSlug: "case-a-normal-prediction",
    gameId: 1,
    officialImageUrl: null,
  },
  condition: "NM",
  price: 1500,
  currency: "THB",
  pricingMode: "MANUAL",
  quantityTotal: quantityAvailable,
  quantityReserved: 0,
  quantityAvailable,
  status: "ACTIVE",
  lotLabel: null,
  updatedAt: `${FIXED_DATE}T00:00:00Z`,
  gradingCompany: null,
  gradeValue: null,
  autoPriceOffsetPercent: null,
  autoPriceFloor: null,
  autoPriceCeiling: null,
  lastAutoPricedAt: null,
  publicNote: null,
  version: 1,
  publishedAt: `${FIXED_DATE}T00:00:00Z`,
  createdAt: `${FIXED_DATE}T00:00:00Z`,
  photos: [],
  similarListings: [],
  costBasis: { quantity: quantityAvailable, totalCost: quantityAvailable * 500, averageUnitCost: 500 },
});

function pageResponse(items: unknown[] = []) {
  return { success: true, data: { items, totalItems: items.length, totalPages: items.length ? 1 : 0, page: 0, size: 20 } };
}

function setupSeller(user = mockSeller(10, "seller-a@example.com", "seller_a")) {
  cy.clearLocalStorage();
  cy.clearCookies();
  // Keep Date deterministic while leaving timers available to React Query and Cypress.
  cy.clock(Date.UTC(2026, 10, 10), ["Date"]);

  cy.intercept("POST", "**/api/v1/auth/refresh", {
    statusCode: 200,
    body: { success: true, data: { tokens: { accessToken: `mock-seller-${user.id}`, expiresIn: 3600 } } },
  }).as("refresh");
  cy.intercept("GET", "**/api/v1/auth/me*", { statusCode: 200, body: { success: true, data: user } }).as("me");
  cy.intercept("GET", "**/api/v1/cart*", {
    statusCode: 200,
    body: { success: true, data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 } },
  }).as("cart");
  cy.intercept("GET", "**/api/v1/sellers/me", {
    statusCode: 200,
    body: { success: true, data: sellerProfile(user.id) },
  }).as("sellerProfile");
  cy.intercept("GET", "**/api/v1/sellers/me/listings*", (request) => {
    request.reply({ statusCode: 200, body: pageResponse() });
  }).as("sellerListings");
}

function forecastRow(name: string) {
  return cy.get('[role="dialog"]')
    .contains("span", name)
    .closest("div.grid.min-h-20");
}

describe("Seller stockout prediction", () => {
  beforeEach(() => setupSeller());

  it("shows the nearest two API results and validates all modal columns, search, filters, pagination, actions, and page state", () => {
    cy.intercept("GET", "**/api/v1/sellers/me/listings/stock-forecast", {
      statusCode: 200,
      body: { success: true, data: SELLER_A_FORECASTS },
    }).as("stockForecast");

    cy.visit("/seller/products?status=SOLD_OUT");
    cy.wait("@stockForecast").its("response.body.data").should("deep.equal", SELLER_A_FORECASTS);

    cy.contains("h2", "คาดการณ์การเติมสต็อก").closest("section").within(() => {
      cy.get(".divide-y > div").should("have.length", 2);
      cy.get(".divide-y > div").eq(0).should("contain", "Case C High Stock Fast Selling").and("contain", "90").and("contain", "300").and("contain", "~9 วัน");
      cy.get(".divide-y > div").eq(1).should("contain", "Case A Normal Prediction").and("contain", "4").and("contain", "12").and("contain", "~10 วัน");
      cy.contains("Case B No Sales").should("not.exist");
      cy.contains("button", "ดูทั้งหมด").click();
    });

    cy.get('[role="dialog"]').should("be.visible");
    forecastRow("Case A Normal Prediction").should("contain", "4 ชิ้น").and("contain", "12 ชิ้น").and("contain", `~10 วัน · ${thaiDate("2026-11-20")}`);
    forecastRow("Case C High Stock Fast Selling").should("contain", "90 ชิ้น").and("contain", "300 ชิ้น").and("contain", `~9 วัน · ${thaiDate("2026-11-19")}`);

    cy.get('[role="dialog"] input[aria-label="ค้นหาสินค้า"]').type("Pagination Listing 4");
    cy.get('[role="dialog"]').contains("Pagination Listing 4").should("be.visible");
    cy.get('[role="dialog"]').contains("Case A Normal Prediction").should("not.exist");
    cy.get('[role="dialog"] input[aria-label="ค้นหาสินค้า"]').clear();

    cy.get('[role="dialog"]').contains("button", "ใกล้หมดตามยอดขาย").click();
    cy.get('[role="dialog"]').contains("Case C High Stock Fast Selling").should("be.visible");
    cy.get('[role="dialog"]').contains("Case A Normal Prediction").should("be.visible");
    cy.get('[role="dialog"]').contains("Case B No Sales").should("not.exist");

    cy.get('[role="dialog"]').contains("button", "ข้อมูลไม่พอ").click();
    cy.get('[role="dialog"]').contains("Case B No Sales").should("be.visible");
    cy.get('[role="dialog"]').contains("Case B Insufficient Data").should("be.visible");
    cy.get('[role="dialog"]').contains("Case A Normal Prediction").should("not.exist");

    cy.get('[role="dialog"]').contains("button", "ทั้งหมด").click();
    cy.get('[role="dialog"]').contains("Pagination Listing 4").should("not.exist");
    cy.get('[role="dialog"]').contains("button", "ถัดไป").click();
    cy.get('[role="dialog"]').contains("Pagination Listing 4").should("be.visible");
    forecastRow("Case B No Sales").should("contain", "7 ชิ้น").and("contain", "0 ชิ้น").and("contain", "ยังไม่มีการขาย").and("not.contain", "2026");
    forecastRow("Case B Insufficient Data").should("contain", "3 ชิ้น").and("contain", "1 ชิ้น").and("contain", "ข้อมูลยังไม่พอ").and("not.contain", "2026");
    cy.get('[role="dialog"]').contains("ก่อนหน้า").click();

    forecastRow("Case A Normal Prediction").contains("a", "ดูสินค้า").click();
    cy.location("pathname").should("eq", "/listings/101");

    cy.visit("/seller/products?status=SOLD_OUT");
    cy.wait("@stockForecast");
    cy.contains("button", "ดูทั้งหมด").click();
    forecastRow("Case A Normal Prediction").contains("a", "เติมสต็อก").click();
    cy.location("pathname").should("eq", "/seller/products/101/restock");

    cy.visit("/seller/products?status=SOLD_OUT");
    cy.wait("@stockForecast");
    cy.contains("button", "ดูทั้งหมด").click();
    cy.get('[role="dialog"]').should("be.visible");
    cy.get("body").type("{esc}");
    cy.location("search").should("eq", "?status=SOLD_OUT");
    cy.contains("button[aria-pressed='true']", /หมดสต็อก/).should("exist");
  });

  it("restocks Case A and shows the updated stock and forecast on the restock page and seller forecast views", () => {
    let currentStock = 4;
    let currentForecast = { ...SELLER_A_FORECASTS[0] };

    cy.intercept("GET", "**/api/v1/sellers/me/listings/101", (request) => {
      request.reply({ statusCode: 200, body: { success: true, data: listing(currentStock) } });
    }).as("listingDetail");
    cy.intercept("GET", "**/api/v1/sellers/me/listings/101/stock-forecast", (request) => {
      request.reply({ statusCode: 200, body: { success: true, data: currentForecast } });
    }).as("listingForecast");
    cy.intercept("GET", "**/api/v1/sellers/me/inventory/stock-ins*", {
      statusCode: 200,
      body: { success: true, data: { receivedTotal: currentStock, soldTotal: 0, lots: { items: [], totalItems: 0, totalPages: 0, page: 0, size: 20 } } },
    });
    cy.intercept("GET", "**/api/v1/listings*", { statusCode: 200, body: pageResponse() });
    cy.intercept("POST", "**/api/v1/sellers/me/listings/101/units", (request) => {
      expect(request.body.quantity).to.eq(4);
      currentStock = 8;
      currentForecast = {
        ...currentForecast,
        availableStock: 8,
        daysRemaining: 20,
        estimatedStockoutDate: "2026-11-30",
      };
      request.reply({ statusCode: 200, body: { success: true, data: [] } });
    }).as("addUnits");
    cy.intercept("GET", "**/api/v1/sellers/me/listings/stock-forecast", (request) => {
      request.reply({
        statusCode: 200,
        body: { success: true, data: [currentForecast, ...SELLER_A_FORECASTS.slice(1)] },
      });
    }).as("stockForecast");

    cy.visit("/seller/products/101/restock");
    cy.wait("@listingDetail");
    cy.wait("@listingForecast").its("response.body.data.daysRemaining").should("eq", 10);
    cy.contains("h1", "เติมสต็อก").should("be.visible");
    cy.contains("label", /จำนวนที่รับเข้า/).invoke("attr", "for").then((id) => cy.get(`#${id}`).clear().type("4"));
    cy.contains("label", /ต้นทุนรวมทั้งล็อต/).invoke("attr", "for").then((id) => cy.get(`#${id}`).clear().type("2000"));
    cy.contains("p", "สต็อกใหม่").parent().should("contain", "8 ใบ");
    cy.contains("button", "บันทึกการรับเข้า").should("be.enabled").click();
    cy.wait("@addUnits");

    cy.location("pathname").should("eq", "/seller/products");
    cy.wait("@stockForecast").its("response.body.data.0.availableStock").should("eq", 8);
    cy.contains("h2", "คาดการณ์การเติมสต็อก").scrollIntoView();
    cy.contains("Case A Normal Prediction").should("be.visible");
    cy.contains("h2", "คาดการณ์การเติมสต็อก").closest("section").should("contain", "พร้อมขาย 8 ชิ้น").and("contain", "ขายสำเร็จ 12 ชิ้น").and("contain", "~20 วัน");
    cy.contains("button", "ดูทั้งหมด").click();
    forecastRow("Case A Normal Prediction").should("contain", "8 ชิ้น").and("contain", "12 ชิ้น").and("contain", "~20 วัน");

    cy.visit("/seller/products/101/restock");
    cy.wait("@listingDetail");
    cy.wait("@listingForecast").its("response.body.data.daysRemaining").should("eq", 20);
    cy.contains("h2", "แนวโน้มการขายและวันที่คาดว่าสต็อกหมด").parent().should("contain", "8 ชิ้น").and("contain", "~20 วัน").and("contain", thaiGregorianDate("2026-11-30"));
  });

  it("shows loading, API error, and empty forecast states", () => {
    cy.intercept("GET", "**/api/v1/sellers/me/listings/stock-forecast", {
      statusCode: 200,
      delay: 5000,
      body: { success: true, data: [] },
    }).as("slowForecast");
    cy.visit("/seller/products");
    cy.get("section").contains("กำลังโหลดคาดการณ์", { timeout: 8000 }).should("be.visible");
    cy.wait("@slowForecast");
    cy.contains("ยังไม่มีสินค้าในร้าน").should("be.visible");

    cy.intercept("GET", "**/api/v1/sellers/me/listings/stock-forecast", {
      statusCode: 503,
      body: { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" } },
    }).as("failedForecast");
    cy.visit("/seller/products");
    cy.wait("@failedForecast");
    cy.contains("โหลดคาดการณ์ไม่สำเร็จ").should("be.visible");
  });

  it("keeps Seller B isolated from Seller A forecasts and blocks access to Seller A restock data", () => {
    const sellerB = mockSeller(20, "seller-b@example.com", "seller_b");
    cy.intercept("GET", "**/api/v1/auth/me*", { statusCode: 200, body: { success: true, data: sellerB } }).as("sellerBMe");
    cy.intercept("GET", "**/api/v1/sellers/me", {
      statusCode: 200,
      body: { success: true, data: sellerProfile(sellerB.id) },
    }).as("sellerBProfile");
    cy.intercept("GET", "**/api/v1/sellers/me/listings/stock-forecast", {
      statusCode: 200,
      body: { success: true, data: [] },
    }).as("sellerBForecast");
    cy.intercept("GET", "**/api/v1/sellers/me/listings/101", {
      statusCode: 404,
      body: { success: false, data: { code: "LISTING_NOT_FOUND" }, message: "Not found" },
    }).as("foreignListing");

    cy.visit("/seller/products");
    cy.wait("@sellerBForecast");
    cy.contains("Case A Normal Prediction").should("not.exist");
    cy.contains("Case C High Stock Fast Selling").should("not.exist");
    cy.contains("ยังไม่มีสินค้าในร้าน").should("be.visible");

    cy.visit("/seller/products/101/restock");
    cy.wait("@foreignListing");
    cy.contains("ไม่พบสินค้านี้").should("exist");
    cy.get("body").should("not.contain", "Case A Normal Prediction");
    cy.get("body").should("not.contain", "~10 วัน");
  });
});
