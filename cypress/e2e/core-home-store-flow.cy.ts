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
            slug: 'pokemon',
            logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100',
            displayOrder: 2,
          },
        ],
      },
    }).as('getGames');

    cy.intercept('GET', '**/api/v1/home/featured-sellers*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            name: 'Card Master Shop',
            slug: 'cardmaster',
            avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100',
            rating: 4.9,
            itemCount: 120,
          },
        ],
      },
    }).as('getFeaturedSellers');

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

    cy.intercept('GET', '**/api/v1/u/*/collection*', {
      statusCode: 200,
      body: {
        success: true,
        data: { items: [], page: 0, size: 6, totalItems: 0, totalPages: 0 },
      },
    }).as('getCollection');

    cy.intercept('GET', '**/api/v1/u/cardmaster/listings*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: 101,
              card: {
                variantId: 1,
                sku: 'PKM-001',
                variantLabel: 'Holo',
                productId: 50,
                productName: 'Charizard Base Set Holo',
                productSlug: 'charizard-base-set-holo',
                gameId: 1,
                officialImageUrl: null,
              },
              condition: 'NM',
              price: 15000,
              currency: 'THB',
              quantityAvailable: 2,
              primaryPhotoUrl: null,
              seller: {
                username: 'cardmaster',
                displayName: 'Card Master Shop',
                avatarUrl: null,
              },
            },
          ],
          page: 0,
          size: 6,
          totalItems: 1,
          totalPages: 1,
        },
      },
    }).as('getStoreListings');

    cy.intercept('GET', '**/api/v1/u/cardmaster*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          username: 'cardmaster',
          displayName: 'Card Master Shop',
          avatarUrl: null,
          phone: null,
        },
      },
    }).as('getStoreProfile');
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

  it('redirects store link to public seller storefront with products and profile', () => {
    cy.visit('/store/cardmaster');

    // Verifies redirect to public seller route
    cy.url().should('include', '/u/cardmaster');
    cy.wait('@getStoreProfile');
    cy.wait('@getStoreListings');

    // Asserts store profile information
    cy.contains('Card Master Shop').should('be.visible');
    cy.contains('Products for sale').should('be.visible');

    // Asserts seller's listed item
    cy.contains('Charizard Base Set Holo').should('be.visible');
  });
});
