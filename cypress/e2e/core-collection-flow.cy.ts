describe('Core Collection Management Flow', () => {
  const initialCollection = {
    items: [
      {
        id: 1,
        variantId: 101,
        condition: 'NM',
        photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
        publicItem: true,
        notes: 'Mint condition',
        card: {
          variantId: 101,
          sku: 'LOB-001',
          variantLabel: 'Ultra Rare',
          productId: 1,
          productName: 'Blue-Eyes White Dragon',
          productSlug: 'blue-eyes-white-dragon',
          gameId: 1,
          officialImageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
        },
      },
      {
        id: 2,
        variantId: 102,
        condition: 'LP',
        photoUrl: null,
        publicItem: false,
        notes: null,
        card: {
          variantId: 102,
          sku: 'LOB-005',
          variantLabel: 'Secret Rare',
          productId: 2,
          productName: 'Dark Magician',
          productSlug: 'dark-magician',
          gameId: 1,
          officialImageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
        },
      },
    ],
    page: 0,
    size: 20,
    totalItems: 2,
    totalPages: 1,
  };

  const visitAuthenticated = (url: string) => {
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'pegasus.auth.session',
          JSON.stringify({
            accessToken: 'mock-access',
            refreshToken: 'mock-refresh',
            accessExpiresAt: Date.now() + 3600000,
          }),
        );
      },
    });
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          email: 'collector@example.com',
          username: 'collector_pro',
          displayName: 'Collector Pro',
          roles: ['BUYER'],
        },
      },
    }).as('getMe');

    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');
  });

  it('renders my collection binder with card items and status', () => {
    cy.intercept('GET', '**/api/v1/collection*', {
      statusCode: 200,
      body: {
        success: true,
        data: initialCollection,
      },
    }).as('getCollection');

    visitAuthenticated('/account/collection');

    cy.wait('@getMe');
    cy.wait('@getCollection');

    // Heading & card count
    cy.contains('h1', 'My Collection').should('be.visible');
    cy.contains('2 cards in your collection.').should('be.visible');

    // Cards
    cy.contains('Blue-Eyes White Dragon').should('be.visible');
    cy.contains('Ultra Rare').should('be.visible');
    cy.contains('Dark Magician').should('be.visible');
    cy.contains('Secret Rare').should('be.visible');

    // Visibility status toggles
    cy.contains('Public').should('be.visible');
    cy.contains('Private').should('be.visible');
  });

  it('opens confirmation modal and removes card from collection', () => {
    let currentCollection = JSON.parse(JSON.stringify(initialCollection));

    cy.intercept('GET', '**/api/v1/collection*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: currentCollection,
        },
      });
    }).as('getCollectionDynamic');

    cy.intercept('DELETE', '**/api/v1/collection/2', (req) => {
      currentCollection = {
        items: [initialCollection.items[0]],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      };
      req.reply({
        statusCode: 200,
        body: {
          success: true,
        },
      });
    }).as('deleteDarkMagician');

    visitAuthenticated('/account/collection');
    cy.wait('@getCollectionDynamic');

    cy.contains('Dark Magician').should('be.visible');

    // Click trash button on Dark Magician
    cy.get('button[aria-label="Remove Dark Magician"]').click();

    // Confirm alert dialog appears
    cy.contains('Remove card?').should('be.visible');
    cy.contains('button', 'Remove Card').click();

    cy.wait('@deleteDarkMagician');
    cy.wait('@getCollectionDynamic');

    // Dark Magician should disappear and total items update
    cy.contains('Dark Magician').should('not.exist');
    cy.contains('1 cards in your collection.').should('be.visible');
  });
});
