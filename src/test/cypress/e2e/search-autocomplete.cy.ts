/** SRCH-05 — dropdown ค้นหาใน Navbar [TCG-776] */
describe('Navbar search autocomplete', () => {
  const ok = (data: unknown) => ({ statusCode: 200, body: { success: true, data } });

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.viewport(1280, 860);

    cy.intercept('GET', '**/api/v1/cart*', ok({ id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 }));
    cy.intercept('GET', '**/api/v1/auth/me*', ok(null));
    cy.intercept('GET', '**/api/v1/games*', ok([
      { id: 1, code: 'POKEMON', name: 'Pokémon TCG', slug: 'pokemon-tcg', displayOrder: 1 },
    ]));
    cy.intercept('GET', '**/api/v1/categories*', ok([]));
    cy.intercept('GET', '**/api/v1/catalog/search/trending*', ok([{ query: 'charizard ex sar', rank: 1 }]));
    cy.intercept('GET', '**/api/v1/catalog/search/suggest*', ok({
      query: 'char',
      correctedQuery: null,
      correctionReason: null,
      completions: ['charizard ex'],
      scopes: [{ type: 'GAME', id: 1, name: 'Pokémon TCG', count: 240 }],
      products: [{
        id: 10,
        slug: 'charizard-vmax-020',
        name: 'Charizard VMAX #020',
        setName: 'Darkness Ablaze',
        cardNumber: '020/189',
        gameName: 'Pokémon',
        imageUrl: null,
        lowestPrice: 4290,
        sellerCount: 12,
      }],
      shops: [],
      totalProducts: 248,
    })).as('suggest');
    // หน้าปลายทาง — แค่ให้ไม่ error
    cy.intercept('GET', '**/api/v1/catalog/products*', ok({ items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 }));
  });

  it('types a query, picks a product and lands on its page', () => {
    cy.visit('/');
    cy.get('[role="combobox"][aria-label="ค้นหา"]').type('char');
    cy.wait('@suggest').its('request.url').should('include', 'q=char');
    cy.get('[role="listbox"]').within(() => {
      cy.contains('[role="option"]', 'Charizard VMAX #020').click();
    });
    cy.location('pathname').should('eq', '/products/charizard-vmax-020');
  });

  it('types a query and presses Enter to open /search?q=', () => {
    cy.visit('/');
    cy.get('[role="combobox"][aria-label="ค้นหา"]').type('char');
    cy.wait('@suggest');
    cy.get('[role="combobox"][aria-label="ค้นหา"]').type('{enter}');
    cy.location('pathname').should('eq', '/search');
    cy.location('search').should('eq', '?q=char');
  });

  it('remembers the search in recent searches after a reload', () => {
    cy.visit('/');
    cy.get('[role="combobox"][aria-label="ค้นหา"]').type('char{enter}');
    cy.location('search').should('eq', '?q=char');
    cy.reload();
    cy.get('[role="combobox"][aria-label="ค้นหา"]').clear().focus();
    cy.contains('ค้นหาล่าสุด').should('be.visible');
    cy.get('[role="listbox"]').contains('[role="option"]', 'char').should('be.visible');
  });
});
