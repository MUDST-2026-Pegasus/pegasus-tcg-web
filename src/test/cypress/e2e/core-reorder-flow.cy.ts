describe('Reorder and order status filter', () => {
  const pendingOrder = {
    id: 11,
    orderNumber: 'ORD-PENDING-11',
    status: 'PENDING_PAYMENT',
    grandTotal: 0,
    sellerOrders: [],
    placedAt: '2026-10-15T10:00:00Z',
  };
  const completedOrder = {
    id: 67,
    orderNumber: 'ORD-COMPLETED-67',
    buyerId: 1,
    status: 'COMPLETED',
    currency: 'THB',
    itemsSubtotal: 8000,
    shippingTotal: 0,
    discountTotal: 0,
    grandTotal: 8000,
    placedAt: '2026-10-17T12:00:00Z',
    completedAt: '2026-10-19T14:00:00Z',
    sellerOrders: [{
      id: 88,
      salesOrderId: 67,
      sellerProfileId: 1,
      sellerName: 'Card Kingdom TH',
      sellerOrderNumber: 'SO-88',
      status: 'COMPLETED',
      itemsSubtotal: 8000,
      shippingFee: 0,
      discountAmount: 0,
      grandTotal: 8000,
      createdAt: '2026-10-17T12:00:00Z',
      items: [{
        id: 501,
        listingId: 1001,
        catalogVariantId: 10,
        quantity: 1,
        unitPrice: 8000,
        lineTotal: 8000,
        productName: 'Bio-Broly (SR)',
        variantLabel: 'JP • FOIL',
        condition: 'DMG',
        gameName: 'Dragon Ball Super Card Game',
        imageUrl: null,
        unitIds: [1],
      }],
      shipments: [],
      statusHistory: [],
    }],
  };
  const preview = {
    orderId: 67,
    sellerOrders: [{
      sellerProfileId: 1,
      sellerName: 'Card Kingdom TH',
      sellerAvailable: true,
      vacationMode: false,
      items: [{
        originalOrderItemId: 501,
        catalogVariantId: 10,
        productName: 'Bio-Broly (SR)',
        variantLabel: 'JP • FOIL',
        originalCondition: 'DMG',
        originalPrice: 8000,
        originalQuantity: 1,
        imageUrl: null,
        currentListing: { listingId: 1001, condition: 'DMG', price: 8000, quantityAvailable: 0, isAvailable: false },
        alternativeConditions: [
          { listingId: 1002, condition: 'NM', price: 9500, quantityAvailable: 2, isAvailable: true },
          { listingId: 1003, condition: 'LP', price: 8900, quantityAvailable: 1, isAvailable: true },
        ],
        status: 'AVAILABLE',
      }],
    }],
  };
  const cartItem = {
    id: 201,
    cartId: 1,
    listingId: 1003,
    quantity: 1,
    unitPriceAtAdd: 8900,
    currentPrice: 8900,
    priceChanged: false,
    purchasable: true,
    quantityAvailable: 1,
    sellerProfileId: 1,
    catalogVariantId: 10,
    condition: 'LP',
    currency: 'THB',
    addedAt: '2026-11-02T10:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
    productName: 'Bio-Broly (SR)',
    variantLabel: 'JP • FOIL',
    sellerName: 'Card Kingdom TH',
    imageUrl: null,
    productId: 10,
  };
  const cart = { id: 1, userId: 1, sessionKey: null, currency: 'THB', items: [cartItem], totalQuantity: 1, itemsSubtotal: 8900, expiresAt: null };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept('POST', '**/api/v1/auth/refresh', {
      statusCode: 200,
      body: { success: true, data: { tokens: { accessToken: 'mock-buyer-token', expiresIn: 3600 } } },
    });
    cy.intercept('GET', '**/api/v1/auth/me*', {
      statusCode: 200,
      body: { success: true, data: { id: 1, email: 'buyer@pegasus.com', username: 'buyeruser', displayName: 'Buyer User', roles: ['BUYER'], status: 'ACTIVE' } },
    });
    cy.intercept('GET', '**/api/v1/refunds*', { statusCode: 200, body: { success: true, data: [] } });
    cy.intercept('GET', '**/api/v1/orders?*', {
      statusCode: 200,
      body: { success: true, data: { items: [pendingOrder, completedOrder], totalItems: 2, totalPages: 1, page: 0, size: 50 } },
    }).as('orders');
  });

  it('filters Completed orders', () => {
    cy.visit('/account/orders');
    cy.wait('@orders');
    cy.contains('[role="tab"]', 'Completed').click();
    cy.contains('[role="tab"]', 'Completed').should('have.attr', 'aria-selected', 'true');
    cy.contains('ORD-COMPLETED-67').should('be.visible');
    cy.contains('ORD-PENDING-11').should('not.exist');
  });

  it('reorders an available condition and selects the new item in the cart', () => {
    cy.intercept('GET', '**/api/v1/orders/67/reorder-preview*', {
      statusCode: 200,
      body: { success: true, data: preview },
    }).as('preview');
    cy.intercept('POST', '**/api/v1/cart/items/batch', {
      statusCode: 200,
      body: { success: true, data: cart },
    }).as('batch');
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: { success: true, data: cart },
    }).as('cart');

    cy.visit('/account/orders');
    cy.wait('@orders');
    cy.contains('[role="tab"]', 'Completed').click();
    cy.contains('button', 'Reorder').click();
    cy.wait('@preview');
    cy.contains('[role="dialog"]', 'Reorder Items').should('be.visible');
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^DMG/).should('be.disabled');
      cy.contains('button', /^LP/).click();
      cy.contains('button', /^LP/).should('have.attr', 'aria-pressed', 'true');
      cy.contains('button', 'สั่งสินค้านี้อีกครั้ง').click();
    });
    cy.wait('@batch').its('request.body').should('deep.equal', [{ listingId: 1003, quantity: 1 }]);
    cy.location('pathname').should('eq', '/cart');
    cy.wait('@cart');
    cy.get('[role="checkbox"][aria-label="เลือก Bio-Broly (SR)"]').next('input[type="checkbox"]').should('be.checked');
  });
});
