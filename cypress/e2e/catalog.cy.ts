describe('Catalog UI', () => {
  beforeEach(() => {
    // Mock auth & cart for navbar
    cy.intercept('GET', '**/api/v1/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'OK',
        data: null,
      },
    }).as('getMe');

    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'OK',
        data: {
          id: 1,
          userId: 1,
          sessionKey: null,
          currency: 'THB',
          items: [],
          totalQuantity: 0,
          itemsSubtotal: 0,
          expiresAt: null,
        },
      },
    }).as('getCart');

    // Mock games list
    cy.intercept('GET', '**/api/v1/games*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'OK',
        data: [],
      },
    }).as('getGames');

    const productsResponse = {
      statusCode: 200,
      body: {
        success: true,
        message: 'OK',
        data: {
          items: [
            {
              id: 1,
              slug: 'blue-eyes-white-dragon',
              name: 'Blue-Eyes White Dragon',
              lowestPrice: 5000,
              primaryImageUrl: 'https://example.com/blue-eyes.jpg',
              cardNumber: 'LOB-001',
            },
            {
              id: 2,
              slug: 'legend-of-blue-eyes',
              name: 'Legend of Blue Eyes White Dragon',
              lowestPrice: 15000,
              primaryImageUrl: 'https://example.com/booster.jpg',
            },
          ],
          page: 0,
          size: 20,
          totalItems: 2,
          totalPages: 1,
        },
      },
    };

    // Mock catalog products API request
    cy.intercept('GET', '**/api/v1/catalog/products*', productsResponse).as('getCatalogProducts');
    cy.intercept('GET', '**/api/v1/products*', productsResponse).as('getProducts');

    // Mock product detail
    cy.intercept('GET', '**/api/v1/catalog/products/blue-eyes-white-dragon*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'OK',
        data: {
          product: {
            id: 1,
            gameId: 1,
            categoryId: 1,
            cardSetId: 1,
            productType: 'SINGLE_CARD',
            name: 'Blue-Eyes White Dragon',
            nameLocal: 'บลูอายส์ ไวท์ ดราก้อน',
            slug: 'blue-eyes-white-dragon',
            cardNumber: 'LOB-001',
            rarityCode: 'UR',
            description: 'Legendary dragon card',
            attributes: {},
            active: true,
          },
          variants: [],
          images: [],
        },
      },
    }).as('getProductDetail');

    // Mock listings for product detail
    cy.intercept('GET', '**/api/v1/listings*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'OK',
        data: {
          items: [],
          page: 0,
          size: 100,
          totalItems: 0,
          totalPages: 1,
        },
      },
    }).as('getListings');

    // Mock collectors & effects for product detail
    cy.intercept('GET', '**/api/v1/catalog/products/1/collectors*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'OK',
        data: {
          items: [],
          page: 0,
          size: 20,
          totalItems: 0,
          totalPages: 1,
        },
      },
    }).as('getCollectors');

    cy.intercept('GET', '**/api/v1/catalog/products/1/effects*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'OK',
        data: [],
      },
    }).as('getEffects');
  });

  it('displays products in the catalog using ItemCard/ProductCard', () => {
    cy.visit('/products');

    // Check if product names and links are displayed
    cy.contains('Blue-Eyes White Dragon', { timeout: 10000 }).should('be.visible');
    cy.contains('Legend of Blue Eyes White Dragon').should('be.visible');
    cy.get('a[href*="/product"]').should('have.length.at.least', 2);
  });

  it('allows clicking on a product to view details', () => {
    cy.visit('/products');

    // Find the first link that goes to a product
    cy.contains('Blue-Eyes White Dragon', { timeout: 10000 }).click();
    cy.url().should('match', /\/products?\//);
    cy.contains('Blue-Eyes White Dragon').should('be.visible');
  });
});
