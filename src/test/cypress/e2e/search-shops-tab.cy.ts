/** SRCH-07 — ค้นหา → แท็บร้านค้า → ดูร้าน [TCG-778] */
describe('Search shops tab', () => {
  const ok = (data: unknown) => ({ statusCode: 200, body: { success: true, data } });

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.viewport(1280, 900);
    cy.intercept('GET', '**/api/v1/cart*', ok({ id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 }));
    cy.intercept('GET', '**/api/v1/auth/me*', ok(null));
    cy.intercept('GET', '**/api/v1/games*', ok([{ id: 1, code: 'POKEMON', name: 'Pokémon TCG', slug: 'pokemon-tcg', displayOrder: 1 }]));
    cy.intercept('GET', '**/api/v1/categories*', ok([]));
    cy.intercept('GET', '**/api/v1/catalog/search/suggest*', ok({
      query: 'charizard', correctedQuery: null, correctionReason: null, completions: [], scopes: [], products: [], shops: [], totalProducts: 0,
    }));
    cy.intercept('GET', '**/api/v1/catalog/products/facets*', ok({
      games: [{ id: 1, name: 'Pokémon TCG', parentId: null, count: 3 }],
      categories: [],
      conditions: [],
      onSaleCount: 0,
      totals: { products: 3, shops: 1, listings: 4 },
    }));
    cy.intercept('GET', '**/api/v1/catalog/products?*', ok({ items: [], page: 0, size: 24, totalItems: 0, totalPages: 0 }));
    cy.intercept('GET', '**/api/v1/catalog/shops*', ok({
      items: [{
        username: 'charizard-vault',
        displayName: 'Charizard Vault BKK',
        avatarUrl: null,
        ratingAvg: 4.9,
        ratingCount: 312,
        matchCount: 54,
        lowestPrice: 420,
        previews: [{ productId: 11, imageUrl: null }],
      }],
      page: 0,
      size: 10,
      totalItems: 1,
      totalPages: 1,
    })).as('shops');
    cy.intercept('GET', '**/api/v1/u/charizard-vault*', ok(null));
  });

  it('opens the shops tab and goes to the shop', () => {
    cy.visit('/search?q=charizard&game=pokemon-tcg');
    cy.contains('nav a', 'ร้านค้า').click();
    cy.location('search').should('eq', '?q=charizard&game=pokemon-tcg&tab=shops');
    cy.wait('@shops').its('request.url').should('include', 'q=charizard').and('include', 'gameId=1');

    cy.get('[data-testid="shop-result"]').within(() => {
      cy.contains('Charizard Vault BKK').should('be.visible');
      cy.contains('54 สินค้าที่ตรงกับ “charizard”').should('be.visible');
      cy.contains('ดูร้าน').click();
    });
    cy.location('pathname').should('eq', '/u/charizard-vault');
  });
});
