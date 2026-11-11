const live = Cypress.expose("runLiveSearch") === true || Cypress.expose("runLiveSearch") === "true";

(live ? describe : describe.skip)("Tolerant search with the real API", () => {
  it("keeps the typed query and game filter while showing corrected products", () => {
    const apiBaseUrl = String(Cypress.expose("apiBaseUrl") || "http://localhost:8080");

    cy.request(`${apiBaseUrl}/api/v1/games`).then(({ body }) => {
      const game = body.data.find((entry: { name: string }) => /pok[eé]mon/i.test(entry.name));
      expect(game, "a seeded Pokémon game").to.not.equal(undefined);

      cy.intercept("GET", "**/api/v1/catalog/products*").as("products");
      cy.visit(`/search?q=pokamon&game=${game.slug}`);

      cy.wait("@products").then(({ request, response }) => {
        expect(new URL(request.url).origin).to.eq(apiBaseUrl);
        expect(new URL(request.url).searchParams.get("q")).to.eq("pokamon");
        expect(new URL(request.url).searchParams.get("gameId")).to.eq(String(game.id));
        expect(new URL(request.url).searchParams.get("sort")).to.eq("relevance");
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.data.correctedQuery).to.match(/pok[eé]mon/i);
        expect(response?.body.data.totalItems).to.be.greaterThan(0);
        cy.contains(response?.body.data.items[0].name).should("be.visible");
      });

      cy.contains(/Showing results for “Pok[eé]mon” · You searched “pokamon”/).should("be.visible");
      cy.get('input[aria-label="ค้นหาสินค้า"]').should("have.value", "pokamon");
      cy.url().should("include", "q=pokamon");
    });
  });
});
