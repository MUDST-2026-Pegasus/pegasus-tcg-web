describe('Core Search & Navigation Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Mock cart and auth requests made by Navbar
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          items: [],
          totalQuantity: 0,
          itemsSubtotal: 0,
        },
      },
    }).as('getCart');

    cy.intercept('GET', '**/api/v1/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: null,
      },
    }).as('getMe');

    cy.intercept('GET', '**/api/v1/games*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            code: 'YGO',
            name: 'Yu-Gi-Oh!',
            slug: 'yu-gi-oh',
            displayOrder: 1,
          },
          {
            id: 2,
            code: 'PKM',
            name: 'Pokemon TCG',
            slug: 'pokemon-tcg',
            displayOrder: 2,
          },
        ],
      },
    }).as('getGames');

    cy.intercept('GET', '**/api/v1/categories*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            code: 'SINGLE',
            name: 'Single Cards',
            slug: 'single-cards',
            parentId: null,
            displayOrder: 1,
          },
        ],
      },
    }).as('getCategories');
  });

  it('navigates from home to search page via search icon and renders results', () => {
    cy.intercept('GET', '**/api/v1/catalog/products*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: 1,
              slug: 'blue-eyes-white-dragon',
              name: 'Blue-Eyes White Dragon',
              gameId: 1,
              categoryId: 1,
              productType: 'SINGLE_CARD',
              cardNumber: 'LOB-001',
              rarityCode: 'UR',
              primaryImageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
              variantCount: 1,
              lowestPrice: 1500,
              listingCount: 3,
            },
            {
              id: 2,
              slug: 'charizard-base-set',
              name: 'Charizard Base Set',
              gameId: 2,
              categoryId: 1,
              productType: 'SINGLE_CARD',
              cardNumber: 'BS-004',
              rarityCode: 'Holo',
              primaryImageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
              variantCount: 1,
              lowestPrice: 5000,
              listingCount: 1,
            },
          ],
          page: 0,
          size: 20,
          totalItems: 2,
          totalPages: 1,
        },
      },
    }).as('getProducts');

    cy.visit('/');

    // Click search icon in Navbar
    cy.get('header a[href="/search"]').click();

    // Verify URL
    cy.url().should('include', '/search');

    // Wait for API calls
    cy.wait('@getGames');
    cy.wait('@getProducts');

    // Verify search page contents
    cy.contains('h1', 'All products').should('be.visible');
    cy.contains('2 results').should('be.visible');
    cy.contains('Blue-Eyes White Dragon').should('be.visible');
    cy.contains('Charizard Base Set').should('be.visible');
    cy.contains('Yu-Gi-Oh!').should('be.visible');
    cy.contains('Pokemon TCG').should('be.visible');
  });

  it('filters search results when typing in search input', () => {
    cy.intercept('GET', '**/api/v1/catalog/products*', (req) => {
      if (req.url.includes('Pikachu')) {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              items: [
                {
                  id: 3,
                  slug: 'pikachu-illustrator',
                  name: 'Pikachu Illustrator',
                  gameId: 2,
                  categoryId: 1,
                  productType: 'SINGLE_CARD',
                  cardNumber: 'PROMO',
                  rarityCode: 'Promo',
                  primaryImageUrl: null,
                  variantCount: 1,
                  lowestPrice: 99999,
                  listingCount: 1,
                },
              ],
              page: 0,
              size: 20,
              totalItems: 1,
              totalPages: 1,
            },
          },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              items: [],
              page: 0,
              size: 20,
              totalItems: 0,
              totalPages: 1,
            },
          },
        });
      }
    }).as('getProductsQuery');

    cy.visit('/search');
    cy.wait('@getGames');

    // Type "Pikachu" into search box
    cy.get('input[aria-label="Search products"]').type('Pikachu');

    // URL should update to include q=Pikachu
    cy.url().should('include', 'q=Pikachu');

    // Results header and item should appear
    cy.contains('Search results for "Pikachu"').should('be.visible');
    cy.contains('Pikachu Illustrator').should('be.visible');
  });
});
