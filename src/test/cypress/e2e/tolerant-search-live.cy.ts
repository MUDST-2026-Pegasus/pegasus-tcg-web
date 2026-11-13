/**
 * SRCH-08 — tolerant search กับ API จริง (staging/dev) [TCG-779]
 *
 * ไม่ intercept อะไรเลย ต้องมี seed ตามการ์ด (Pokémon + One Piece, ร้าน ≥ 3 ร้านขาย Charizard)
 * รันเฉพาะเมื่อสั่ง: `pnpm cypress run --spec src/test/cypress/e2e/tolerant-search-live.cy.ts --env runLiveSearch=true`
 */
const isLive = (() => {
  try {
    const value = Cypress.expose("runLiveSearch");
    return value === true || value === "true";
  } catch {
    return false;
  }
})();
const describeLive = isLive ? describe : describe.skip;

type Page = {
  totalItems: number;
  correctedQuery?: string | null;
  correctionReason?: string | null;
  items: { name: string; gameId: number; cardNumber: string | null }[];
};

const api = (path: string, query: Record<string, string | number>) =>
  cy
    .request({ url: `${Cypress.expose("apiBaseUrl") ?? "http://localhost:8080"}/api/v1${path}`, qs: query })
    .its("body.data");

describeLive("Tolerant search on the live API", () => {
  let games: Record<string, number> = {};

  before(() => {
    api("/games", {}).then((list: { id: number; code: string }[]) => {
      games = Object.fromEntries(list.map((game) => [game.code, game.id]));
    });
  });

  for (const q of ["pokamon", "pokemn", "pokmeon"]) {
    it(`corrects the typo ${q}`, () => {
      api("/catalog/products", { q, size: 5 }).then((page: Page) => {
        expect(page.totalItems).to.be.greaterThan(0);
        expect(page.correctionReason).to.eq("TYPO");
        page.items.forEach((item) => expect(item.gameId).to.eq(games.POKEMON));
      });
    });
  }

  it("finds Pokémon with no correction for pokemon", () => {
    api("/catalog/products", { q: "pokemon", size: 5 }).then((page: Page) => {
      expect(page.totalItems).to.be.greaterThan(0);
      expect(page.correctedQuery ?? null).to.eq(null);
    });
  });

  it("corrects charzard ex to charizard ex", () => {
    api("/catalog/products", { q: "charzard ex", size: 5 }).then((page: Page) => {
      expect(page.correctedQuery?.toLowerCase()).to.eq("charizard ex");
    });
  });

  it("reads ยนะำทนื as pokemon typed on the Thai layout", () => {
    api("/catalog/products", { q: "ยนะำทนื", size: 5 }).then((page: Page) => {
      expect(page.correctionReason).to.eq("KEYBOARD_LAYOUT");
      expect(page.totalItems).to.be.greaterThan(0);
    });
  });

  it("does not turn an unknown card number into another card", () => {
    for (const q of ["999/999", "999-999"]) {
      api("/catalog/products", { q, size: 5 }).then((page: Page) => {
        expect(page.correctedQuery ?? null).to.eq(null);
      });
    }
  });

  it("keeps a game filter when a typo is corrected", () => {
    api("/catalog/products", { q: "charzard", gameId: games.ONE_PIECE, size: 20 }).then((page: Page) => {
      page.items.forEach((item) => expect(item.gameId).to.eq(games.ONE_PIECE));
    });
  });

  it("finds nothing and corrects nothing for zzqxv and ab", () => {
    for (const q of ["zzqxv", "ab"]) {
      api("/catalog/products", { q, size: 5 }).then((page: Page) => {
        expect(page.totalItems).to.eq(0);
        expect(page.correctedQuery ?? null).to.eq(null);
      });
    }
  });

  for (const q of ["โปเกมอน", "โปเกม่อน"]) {
    it(`finds Pokémon for the Thai name ${q}`, () => {
      api("/catalog/products", { q, size: 50 }).then((page: Page) => {
        expect(page.totalItems).to.be.greaterThan(0);
        page.items.forEach((item) => expect(item.gameId).to.eq(games.POKEMON));
      });
    });
  }

  it("explains ชาริซาร์ด as an alias and counts it the same in facets and shops", () => {
    api("/catalog/products", { q: "ชาริซาร์ด", size: 5 }).then((page: Page) => {
      expect(page.correctionReason).to.eq("ALIAS");
      expect(page.correctedQuery).to.eq("Charizard");
      api("/catalog/products/facets", { q: "ชาริซาร์ด" }).then((facets: { totals: { products: number; shops: number } }) => {
        expect(facets.totals.products).to.eq(page.totalItems);
        expect(facets.totals.shops).to.be.greaterThan(0);
      });
    });
  });

  it("lets the game filter win over วันพีซ", () => {
    api("/catalog/products", { q: "วันพีซ", gameId: games.POKEMON, size: 5 }).then((page: Page) => {
      expect(page.totalItems).to.eq(0);
    });
  });

  // จาก TCG-693: request ยังส่งคำที่พิมพ์ + เกม + relevance และหน้าโชว์ข้อความแก้คำ
  // (ช่องค้นหาในหน้าถูกเอาออกใน TCG-777 — เช็คหัวข้อแทนค่าในช่อง)
  it("keeps the typed query and game filter while showing corrected products", () => {
    const apiBaseUrl = String(Cypress.expose("apiBaseUrl") || "http://localhost:8080");
    cy.request(`${apiBaseUrl}/api/v1/games`).then(({ body }) => {
      const game = body.data.find((entry: { name: string }) => /pok[eé]mon/i.test(entry.name));
      expect(game, "a seeded Pokémon game").to.not.equal(undefined);

      cy.intercept("GET", "**/api/v1/catalog/products?*").as("products");
      cy.visit(`/search?q=pokamon&game=${game.slug}`);

      cy.wait("@products").then(({ request, response }) => {
        const url = new URL(request.url);
        expect(url.origin).to.eq(apiBaseUrl);
        expect(url.searchParams.get("q")).to.eq("pokamon");
        expect(url.searchParams.get("gameId")).to.eq(String(game.id));
        expect(url.searchParams.get("sort")).to.eq("relevance");
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.data.correctedQuery).to.match(/pok[eé]mon/i);
        expect(response?.body.data.totalItems).to.be.greaterThan(0);
        cy.contains(response?.body.data.items[0].name).should("be.visible");
      });

      cy.contains(/แสดงผลลัพธ์ของ “Pok[eé]mon” · คุณค้นหา “pokamon”/).should("be.visible");
      cy.get("h1").should("contain.text", "ผลการค้นหา “pokamon”");
      cy.url().should("include", "q=pokamon");
    });
  });

  it("shows the alias banner and shops tab in the browser", () => {
    cy.visit("/search?q=" + encodeURIComponent("ชาริซาร์ด"));
    cy.contains("รวมผลของ “Charizard” สำหรับ “ชาริซาร์ด”").should("be.visible");
    cy.contains("nav a", "ร้านค้า").click();
    cy.get('[data-testid="shop-result"]').should("have.length.greaterThan", 0);
  });
});
