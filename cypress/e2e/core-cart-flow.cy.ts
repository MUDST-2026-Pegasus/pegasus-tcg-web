describe('Core Shopping Cart Flow', () => {
  const initialCartData = {
    id: 1,
    userId: 1,
    sessionKey: null,
    currency: 'THB',
    items: [
      {
        id: 101,
        cartId: 1,
        listingId: 1001,
        quantity: 2,
        unitPriceAtAdd: 500,
        currentPrice: 500,
        priceChanged: false,
        purchasable: true,
        quantityAvailable: 10,
        sellerProfileId: 1,
        catalogVariantId: 1,
        condition: 'NM',
        currency: 'THB',
        addedAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
        productName: 'Blue-Eyes White Dragon',
        variantLabel: 'Ultra Rare',
        sellerName: 'Kaiba Corp TCG',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
        productId: 1,
      },
      {
        id: 102,
        cartId: 1,
        listingId: 1002,
        quantity: 1,
        unitPriceAtAdd: 300,
        currentPrice: 300,
        priceChanged: false,
        purchasable: true,
        quantityAvailable: 5,
        sellerProfileId: 2,
        catalogVariantId: 2,
        condition: 'LP',
        currency: 'THB',
        addedAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
        productName: 'Dark Magician',
        variantLabel: 'Secret Rare',
        sellerName: 'Yugi Card Shop',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
        productId: 2,
      },
    ],
    totalQuantity: 3,
    itemsSubtotal: 1300,
    expiresAt: null,
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    cy.intercept('GET', '**/api/v1/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          email: 'buyer@example.com',
          username: 'buyeruser',
          roles: ['BUYER'],
        },
      },
    }).as('getMe');
  });

  it('renders cart items with correct subtotal, shipping, and total calculations', () => {
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: initialCartData,
      },
    }).as('getCart');

    cy.visit('/cart');
    cy.wait('@getCart');

    // Verify page title
    cy.contains('h1', 'Shopping Cart').should('be.visible');

    // Verify items
    cy.contains('Blue-Eyes White Dragon').should('be.visible');
    cy.contains('Kaiba Corp TCG').should('be.visible');
    cy.contains('Dark Magician').should('be.visible');
    cy.contains('Yugi Card Shop').should('be.visible');

    // Verify summary: 1300 subtotal, 100 shipping, 1400 total
    cy.contains('Subtotal (2 items)').should('be.visible');
    cy.contains('฿1,300').should('be.visible');
    cy.contains('฿100').should('be.visible');
    cy.contains('฿1,400').should('be.visible');

    // Checkout button should be enabled
    cy.contains('button', 'Proceed to Checkout').should('not.be.disabled');
  });

  it('toggles item selection and updates order summary calculations', () => {
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: initialCartData,
      },
    }).as('getCart');

    cy.visit('/cart');
    cy.wait('@getCart');

    // Click "Select All" to deselect all items
    cy.get('label[for="select-all"]').click();

    // Summary should show 0 subtotal and checkout button should be disabled
    cy.contains('Subtotal (0 items)').should('be.visible');
    cy.contains('button', 'Proceed to Checkout').should('be.disabled');

    // Click "Select All" again to re-select all items
    cy.get('label[for="select-all"]').click();

    // Summary should restore to 2 items
    cy.contains('Subtotal (2 items)').should('be.visible');
    cy.contains('button', 'Proceed to Checkout').should('not.be.disabled');
  });

  it('removes an item from cart and dynamically updates the cart', () => {
    let currentCart = JSON.parse(JSON.stringify(initialCartData));

    cy.intercept('GET', '**/api/v1/cart*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: currentCart,
        },
      });
    }).as('getCartDynamic');

    cy.intercept('DELETE', '**/api/v1/cart/items/102', (req) => {
      currentCart = {
        ...currentCart,
        items: currentCart.items.filter((i: { id: number }) => i.id !== 102),
        totalQuantity: 2,
        itemsSubtotal: 1000,
      };
      req.reply({
        statusCode: 200,
        body: {
          success: true,
        },
      });
    }).as('removeDarkMagician');

    cy.visit('/cart');
    cy.wait('@getCartDynamic');

    cy.contains('Dark Magician').should('be.visible');

    // Click remove on the second item (Dark Magician)
    cy.get('button').contains('Remove').last().click();

    cy.wait('@removeDarkMagician');
    cy.wait('@getCartDynamic');

    // Dark Magician should no longer be in the cart
    cy.contains('Dark Magician').should('not.exist');
    cy.contains('Blue-Eyes White Dragon').should('be.visible');
    cy.contains('Subtotal (1 items)').should('be.visible');
  });
});
