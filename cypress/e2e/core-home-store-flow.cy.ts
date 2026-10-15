describe('Core Home & Storefront Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    cy.intercept('GET', '**/api/v1/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: null,
      },
    }).as('getMe');

    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');

    cy.intercept('GET', '**/api/v1/home/banners*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            title: 'FRESH CARDS.\nREADY TO PLAY.',
            eyebrow: 'NEW FROM PEGASUS',
            description: 'Discover the newest singles and sealed releases.',
            imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
            imageAlt: 'Hero Banner',
            theme: 'CAMPAIGN',
            primaryLabel: 'Shop New Releases',
            primaryHref: '/search?sort=newest',
            secondaryLabel: 'Explore Cards',
            secondaryHref: '/search',
          },
        ],
      },
    }).as('getBanners');

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
            logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100',
            displayOrder: 1,
          },
          {
            id: 2,
            code: 'PKM',
            name: 'Pokemon TCG',
            slug: 'pokemon-tcg',
            logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100',
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
            imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100',
            displayOrder: 1,
          },
        ],
      },
    }).as('getCategories');

    cy.intercept('GET', '**/api/v1/catalog/trending*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            rank: 1,
            unitsSold: 25,
            product: {
              id: 1,
              name: 'Blue-Eyes White Dragon',
              slug: 'blue-eyes-white-dragon',
              productType: 'SINGLE_CARD',
              lowestPrice: 1500,
              primaryImageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
            },
          },
        ],
      },
    }).as('getTrending');

    cy.intercept('GET', '**/api/v1/catalog/products*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: 2,
              name: 'Charizard Base Set',
              slug: 'charizard-base-set',
              productType: 'SINGLE_CARD',
              lowestPrice: 5000,
              primaryImageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
            },
          ],
          page: 0,
          size: 10,
          totalItems: 1,
          totalPages: 1,
        },
      },
    }).as('getProducts');

    cy.intercept('GET', '**/api/v1/u/*/listings*', {
      statusCode: 200,
      body: {
        success: true,
        data: { items: [], page: 0, size: 10, totalItems: 0, totalPages: 0 },
      },
    }).as('getPegasusPicks');
  });

  it('renders home page with hero carousel, games, and featured products', () => {
    cy.visit('/');

    cy.wait('@getBanners');
    cy.wait('@getGames');
    cy.wait('@getTrending');

    // Asserts hero banner
    cy.contains('NEW FROM PEGASUS').should('be.visible');
    cy.contains('FRESH CARDS.').should('be.visible');

    // Asserts game categories
    cy.contains('Yu-Gi-Oh!').should('be.visible');
    cy.contains('Pokemon TCG').should('be.visible');

    // Asserts trending product
    cy.contains('Blue-Eyes White Dragon').should('be.visible');
  });

  it('renders store profile page with store info, statistics, and recommended items', () => {
    cy.visit('/store/1');

    // Asserts store name and stats
    cy.contains('Nx Gallery - Card Game & Board Game Cafe').should('be.visible');
    cy.contains('Products').should('be.visible');
    cy.contains('Followers').should('be.visible');
    cy.contains('Rating').should('be.visible');

    // Asserts recommended section
    cy.contains('h2', 'Recommended for You').should('be.visible');
    cy.contains('Pokemon Booster Box (Thai)').should('be.visible');
  });
});
