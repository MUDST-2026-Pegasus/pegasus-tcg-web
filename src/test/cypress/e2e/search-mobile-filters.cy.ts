/** SRCH-06 — มือถือ: ปุ่มตัวกรองเปิด Sheet ล่าง เลือกแล้ว URL/ผลเปลี่ยน [TCG-777] */
describe('Search page filter sheet on mobile', () => {
  const ok = (data: unknown) => ({ statusCode: 200, body: { success: true, data } });
  const product = (id: number, name: string) => ({
    id,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    nameLocal: null,
    gameId: 1,
    categoryId: 1,
    cardSetId: null,
    productType: 'SINGLE_CARD',
    cardNumber: '020/189',
    rarityCode: null,
    primaryImageUrl: null,
    variantCount: 1,
    lowestPrice: 690,
    listingCount: 3,
    highestPrice: 930,
    lowestRegularPrice: 690,
    sellerCount: 2,
    onSale: false,
  });

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.viewport(375, 812);
    cy.intercept('GET', '**/api/v1/cart*', ok({ id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 }));
    cy.intercept('GET', '**/api/v1/auth/me*', ok(null));
    cy.intercept('GET', '**/api/v1/games*', ok([
      { id: 1, code: 'POKEMON', name: 'Pokémon TCG', slug: 'pokemon-tcg', displayOrder: 1 },
      { id: 2, code: 'ONE_PIECE', name: 'One Piece Card Game', slug: 'one-piece-card-game', displayOrder: 2 },
    ]));
    cy.intercept('GET', '**/api/v1/categories*', ok([]));
    cy.intercept('GET', '**/api/v1/catalog/search/suggest*', ok({
      query: 'char', correctedQuery: null, correctionReason: null, completions: [], scopes: [], products: [], shops: [], totalProducts: 0,
    }));
    cy.intercept('GET', '**/api/v1/catalog/products/facets*', (req) => {
      const pokemonOnly = req.url.includes('gameId=1');
      req.reply(ok({
        games: [
          { id: 1, name: 'Pokémon TCG', parentId: null, count: 2 },
          { id: 2, name: 'One Piece Card Game', parentId: null, count: 1 },
        ],
        categories: [],
        conditions: [],
        onSaleCount: 0,
        totals: { products: pokemonOnly ? 2 : 3, shops: 2, listings: 6 },
      }));
    }).as('facets');
    cy.intercept('GET', '**/api/v1/catalog/products?*', (req) => {
      const pokemonOnly = req.url.includes('gameId=1');
      const items = pokemonOnly
        ? [product(1, 'Charizard ex'), product(2, 'Charmander')]
        : [product(1, 'Charizard ex'), product(2, 'Charmander'), product(3, 'Charlotte Katakuri')];
      req.reply(ok({ items, page: 0, size: 24, totalItems: items.length, totalPages: 1 }));
    }).as('products');
  });

  it('opens the filter sheet, picks a game and shows the narrowed results', () => {
    cy.visit('/search?q=char');
    cy.wait('@products');
    cy.contains('Charlotte Katakuri').should('be.visible');

    cy.contains('button', /^ตัวกรอง/).click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('label', 'Pokémon TCG').click();
      cy.contains('button', 'ดูผลลัพธ์ 2 รายการ').click();
    });

    cy.location('search').should('eq', '?q=char&game=pokemon-tcg');
    cy.get('[role="dialog"]').should('not.exist');
    cy.contains('button', 'ตัวกรอง (1)').should('be.visible');
    cy.contains('Charlotte Katakuri').should('not.exist');
    cy.get('[data-testid="search-result-card"]').should('have.length', 2);
  });
});
