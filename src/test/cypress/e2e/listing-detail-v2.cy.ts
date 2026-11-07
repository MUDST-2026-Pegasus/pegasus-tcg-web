import type { PublicListingDetailDto } from "../../../features/catalog/catalog.types";
const ok = (data: unknown) => ({
  statusCode: 200,
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
const listing: PublicListingDetailDto["listing"] = {
  id: 877,
  card: {
    variantId: 1,
    sku: "PKM-MEG-178-EN-H",
    variantLabel: "EN · Holo · Unlimited",
    productId: 10,
    productName: "Mega Gardevoir ex (SIR)",
    productSlug: "mega-gardevoir",
    gameId: 1,
    officialImageUrl: image,
  },
  condition: "LP",
  price: 2850,
  currency: "THB",
  quantityAvailable: 2,
  status: "ACTIVE",
  publishedAt: "2026-11-06T10:00:00Z",
  publicNote: "ขอบสวยมาก ไม่เคยลงเล่นครับ",
  gradingCompany: null,
  gradeValue: null,
  primaryPhotoUrl: image,
  seller: {
    username: "tcg_corner",
    displayName: "TCG Corner",
    avatarUrl: null,
    verified: true,
    ratingAvg: 4.9,
    ratingCount: 128,
    salesCount: 856,
  },
  delivery: {
    fastestEstDaysMin: 1,
    fastestEstDaysMax: 3,
    freeShipping: true,
    optionCount: 1,
  },
};
const flash = {
  listPrice: 2850,
  salePrice: 1995,
  discountPercent: 30,
  sale: {
    id: 1,
    slug: "flash",
    name: "Flash Sale",
    type: "FLASH_SALE" as const,
    endsAt: new Date(Date.now() + 3600_000).toISOString(),
    quotaLeft: 3,
    perBuyerLimit: 1,
  },
};
const detail = (
  overrides: Partial<PublicListingDetailDto["listing"]> = {},
): PublicListingDetailDto => ({
  listing: { ...listing, ...overrides },
  photoUrls: [image, image, image, image],
  certNumber: null,
  market: {
    statDate: "2026-11-07",
    medianPrice: 2850,
    sampleSize: 10,
    activeListingCount: 3,
    soldQuantity30d: 5,
    minPrice: null,
    maxPrice: null,
    p25Price: null,
    p75Price: null,
  },
});
const product = (
  attributes: Record<string, unknown> = {
    supertype: "Pokémon",
    hp: 360,
    card_type: "Psychic",
    stage: "Stage 2",
    artist: "Raita Kazama",
  },
) => ({
  product: {
    id: 10,
    slug: "mega-gardevoir",
    name: listing.card.productName,
    nameLocal: "เมก้าเซอไนต์ ex (SIR)",
    gameId: 1,
    categoryId: 1,
    cardSetId: 1,
    productType: "SINGLE_CARD",
    cardNumber: "178/132",
    rarityCode: "SIR",
    description: null,
    active: true,
    attributes,
  },
  variants: [
    {
      id: 1,
      catalogProductId: 10,
      sku: listing.card.sku,
      languageCode: "EN",
      finish: "Holo",
      edition: "Unlimited",
      active: true,
    },
    {
      id: 2,
      catalogProductId: 10,
      sku: "JP",
      languageCode: "JP",
      finish: "Holo",
      edition: "NOT_APPLICABLE",
      active: true,
    },
  ],
  images: [],
});
function mocks(data = detail(), user = "buyer") {
  cy.loginAs(user === "tcg_corner" ? "SELLER" : "BUYER", { username: user });
  cy.setupStandardMocks();
  cy.intercept("GET", "**/__test/card.png", {
    fixture: "listing-detail-card.png",
  });
  cy.intercept("GET", "**/api/v1/listings/877", ok(data)).as("detail");
  cy.intercept(
    "GET",
    "**/api/v1/games",
    ok([
      {
        id: 1,
        code: "POKEMON",
        name: "Pokémon TCG",
        nameLocal: null,
        slug: "pokemon",
      },
    ]),
  );
  cy.intercept(
    "GET",
    "**/api/v1/games/1/attributes",
    ok([
      { id: 1, gameId: 1, attrKey: "stage", label: "ประเภท", displayOrder: 1 },
      {
        id: 2,
        gameId: 1,
        attrKey: "card_type",
        label: "ธาตุ",
        displayOrder: 2,
      },
      { id: 3, gameId: 1, attrKey: "hp", label: "HP", displayOrder: 3 },
    ]),
  );
  cy.intercept(
    "GET",
    "**/api/v1/card-sets*",
    ok([
      {
        id: 1,
        gameId: 1,
        code: "MEG",
        name: "Mega Evolution",
        nameLocal: null,
        releaseDate: "2026-09-26",
        totalCards: 132,
      },
    ]),
  );
  cy.intercept(
    "GET",
    "**/api/v1/catalog/products/mega-gardevoir",
    ok(product()),
  ).as("product");
  cy.intercept(
    "GET",
    "**/api/v1/catalog/products/10/effects",
    ok([
      {
        effectType: "RULE",
        name: "Mega Evolution ex rule",
        effectText: "Your opponent takes 3 Prize cards.",
        damage: null,
        energyCost: [],
        displayOrder: 0,
      },
      {
        effectType: "ATTACK",
        name: "Mega Symphonia",
        effectText: "This attack does 50 damage for each Psychic Energy.",
        damage: 50,
        energyCost: ["Psychic"],
        displayOrder: 2,
      },
      {
        effectType: "ABILITY",
        name: "Overflowing Wishes",
        effectText: "Search your deck for Psychic Energy cards.",
        damage: null,
        energyCost: [],
        displayOrder: 1,
      },
    ]),
  );
  cy.intercept("GET", "**/api/v1/listings?*", ok(page([data.listing])));
  cy.intercept(
    "GET",
    "**/api/v1/u/tcg_corner/listings*",
    ok(
      page(
        [1, 2, 3, 4, 5].map((id) => ({
          ...listing,
          id,
          card: { ...listing.card, productName: `Card ${id}` },
        })),
      ),
    ),
  );
  cy.intercept("GET", "**/api/v1/sales", ok([]));
}
describe("TCG-663 listing detail v2", () => {
  it("renders raw data, gallery/lightbox and no blank information rows at 1280", () => {
    mocks();
    cy.visit("/listings/877");
    cy.wait(["@detail", "@product"]);
    cy.get('[data-buy-box="raw"]').should("be.visible");
    cy.contains("ข้อมูลการ์ด").should("be.visible");
    cy.contains("dd", "Raita Kazama").should("exist");
    cy.contains("dd", "—").should("not.exist");
    cy.contains("button", "คลิกเพื่อขยาย").click();
    cy.get('[role="dialog"]').should("be.visible");
    cy.get("body").type("{esc}");
    cy.get('[role="dialog"]').should("not.exist");
    cy.screenshot("TCG-663-raw-1280", {
      capture: "fullPage",
      onBeforeScreenshot: ($el) => {
        $el.find("header").css("position", "relative");
      },
    });
    cy.viewport(390, 844);
    cy.get("main").then(($m) => expect($m[0].scrollWidth).to.be.lte(390));
  });
  it("shows sale and flash totals beyond the buyer limit, without unknown quota bars", () => {
    mocks(detail({ pricing: flash, saleQuota: null, quantityAvailable: 4 }));
    cy.visit("/listings/877");
    cy.wait("@detail");
    cy.get('[data-buy-box="flash"]').should("be.visible");
    cy.get('[role="progressbar"]').should("not.exist");
    cy.get("[data-market-hint]").should("not.exist");
    cy.get('button[aria-label="เพิ่มจำนวน"]').click();
    cy.contains("รวม ฿4,845").should("be.visible");
    cy.get('button[aria-label="เพิ่มจำนวน"]').should("be.enabled");
  });
  it("graded cards show cert, hide condition row and limit quantity to one", () => {
    const graded = detail({ gradingCompany: "PSA", gradeValue: 10 });
    graded.certNumber = "84512309";
    mocks(graded);
    cy.visit("/listings/877");
    cy.wait("@detail");
    cy.get('[data-buy-box="graded"]').should("be.visible");
    cy.contains("a", "ตรวจสอบ Cert").should("have.attr", "target", "_blank");
    cy.contains("dt", "สภาพ").should("not.exist");
    cy.get('button[aria-label="เพิ่มจำนวน"]').should("be.disabled");
    cy.contains("ยังไม่มีราคาตลาด").should("be.visible");
  });
  it("sold out suppresses stale discounts and exposes other sellers", () => {
    mocks(detail({ status: "SOLD_OUT", quantityAvailable: 0, pricing: flash }));
    cy.visit("/listings/877");
    cy.wait("@detail");
    cy.get('[data-buy-box="sold-out"]').should("be.visible");
    cy.contains("FLASH SALE").should("not.exist");
    cy.get("[data-buy-box] button").should("be.disabled");
    cy.contains("a", "ประกาศนี้ขายหมดแล้ว").should(
      "have.attr",
      "href",
      "/products/mega-gardevoir/listings",
    );
  });
  it("owners see management actions and campaign without purchase controls", () => {
    mocks(
      detail({
        pricing: { ...flash, sale: { ...flash.sale, type: "CATEGORY_SALE" } },
      }),
      "tcg_corner",
    );
    cy.visit("/listings/877");
    cy.wait("@detail");
    cy.get('[data-buy-box="own"]').should("be.visible");
    cy.get("[data-buy-box] a")
      .contains("แก้ไขประกาศ")
      .should("have.attr", "href", "/seller/products/877/edit");
    cy.get("[data-buy-box]").should(
      "contain.text",
      "เปลี่ยนราคาไม่ได้ระหว่างลดราคา",
    );
    cy.get("[data-buy-box]")
      .contains("button", "เพิ่มลงตะกร้า")
      .should("not.exist");
  });
  it("refetches the API price when the Flash countdown expires", () => {
    const expiring = {
      ...flash,
      sale: {
        ...flash.sale,
        endsAt: new Date(Date.now() + 3500).toISOString(),
      },
    };
    mocks(detail({ pricing: expiring }));
    let reads = 0;
    cy.intercept("GET", "**/api/v1/listings/877", (req) => {
      reads += 1;
      req.reply(ok(reads === 1 ? detail({ pricing: expiring }) : detail()));
    }).as("expiry");
    cy.visit("/listings/877");
    cy.wait("@expiry");
    cy.get('[data-buy-box="flash"]').should("exist");
    cy.get('[data-buy-box="raw"]', { timeout: 10000 }).should("exist");
    cy.then(() => expect(reads).to.be.greaterThan(1));
  });
  it("Trainer uses effect text and Basic Energy hides game and effect sections", () => {
    mocks();
    const trainer = product();
    trainer.product.attributes = {
      supertype: "Trainer",
      trainer_type: "Supporter",
    };
    cy.intercept(
      "GET",
      "**/api/v1/catalog/products/mega-gardevoir",
      ok(trainer),
    );
    cy.intercept(
      "GET",
      "**/api/v1/games/1/attributes",
      ok([{ id: 4, attrKey: "trainer_type", label: "ชนิด", displayOrder: 1 }]),
    );
    cy.visit("/listings/877");
    cy.wait("@detail");
    cy.contains("h3", "Trainer").should("exist");
    cy.contains("h3", "เอฟเฟกต์การ์ด").should("exist");
    cy.contains("dd", "Supporter").should("exist");
    const energy = product();
    energy.product.attributes = { supertype: "Energy", energy_type: "Basic" };
    cy.intercept(
      "GET",
      "**/api/v1/catalog/products/mega-gardevoir",
      ok(energy),
    );
    cy.reload();
    cy.wait("@detail");
    cy.contains("ข้อมูลการ์ด").should("exist");
    cy.contains("h3", "โปเกมอน").should("not.exist");
    cy.contains("h3", "ท่าโจมตี & กฎ").should("not.exist");
    cy.contains("Overflowing Wishes").should("not.exist");
  });
  it("404 provides a path back to cards", () => {
    mocks();
    cy.intercept("GET", "**/api/v1/listings/877", {
      statusCode: 404,
      body: { success: false, message: "Not found" },
    });
    cy.visit("/listings/877");
    cy.contains("ไม่พบประกาศนี้").should("be.visible");
    cy.contains("a", "ไปหน้าการ์ด").should("have.attr", "href", "/products");
  });
});
