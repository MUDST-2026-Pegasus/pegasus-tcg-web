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
    sellerOrders: [
      {
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
        items: [
          {
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
          },
        ],
        shipments: [],
        statusHistory: [],
      },
    ],
  };

  const reorderItemsResponse = {
    orderId: 67,
    orderNumber: 'ORD-COMPLETED-67',
    items: [
      {
        orderItemId: 501,
        catalogVariantId: 10,
        productSlug: 'bio-broly-sr',
        productName: 'Bio-Broly (SR)',
        variantLabel: 'JP • FOIL • Dragon Ball Super Card Game',
        rarity: 'SR',
        imageUrl: null,
        originalCondition: 'DMG',
        originalPrice: 8000,
        originalQuantity: 1,
        originalSellerName: 'Card Kingdom TH',
      },
      {
        orderItemId: 502,
        catalogVariantId: 10,
        productSlug: 'bio-broly-sr',
        productName: 'Bio-Broly (SR)',
        variantLabel: 'JP • FOIL • Dragon Ball Super Card Game',
        rarity: 'SR',
        imageUrl: null,
        originalCondition: 'DMG',
        originalPrice: 8000,
        originalQuantity: 2,
        originalSellerName: 'Card Kingdom TH',
      },
    ],
  };

  const visitAuthenticated = (url: string) => {
    cy.intercept('POST', '**/api/v1/auth/refresh*', {
      statusCode: 200,
      body: { success: true, data: { tokens: { accessToken: 'mock-buyer-token', expiresIn: 3600 } } },
    });
    cy.visit(url);
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    cy.intercept('POST', '**/api/v1/auth/refresh*', {
      statusCode: 200,
      body: { success: true, data: { tokens: { accessToken: 'mock-buyer-token', expiresIn: 3600 } } },
    });

    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          email: 'buyer@pegasus.com',
          username: 'buyeruser',
          displayName: 'Buyer User',
          roles: ['BUYER'],
          status: 'ACTIVE',
        },
      },
    });

    cy.intercept('GET', '**/api/v1/games*', {
      statusCode: 200,
      body: { success: true, data: [] },
    });

    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: { success: true, data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 } },
    });

    cy.intercept('GET', '**/api/v1/refunds*', {
      statusCode: 200,
      body: { success: true, data: [] },
    });

    cy.intercept('GET', '**/api/v1/orders/*/reviews/mine*', {
      statusCode: 200,
      body: { success: true, data: null },
    });

    cy.intercept('GET', '**/api/v1/orders/*/returns*', {
      statusCode: 200,
      body: { success: true, data: [] },
    });

    cy.intercept('GET', '**/api/v1/orders?*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [pendingOrder, completedOrder],
          totalItems: 2,
          totalPages: 1,
          page: 0,
          size: 50,
        },
      },
    }).as('orders');
  });

  it('filters Completed orders', () => {
    visitAuthenticated('/account/orders');
    cy.wait('@orders');
    cy.contains('[role="tab"]', 'Completed').click();
    cy.contains('[role="tab"]', 'Completed').should('have.attr', 'aria-selected', 'true');
    cy.contains('ORD-COMPLETED-67').should('be.visible');
    cy.contains('ORD-PENDING-11').should('not.exist');
  });

  it('reorders a completed item, deduplicates duplicate cards, and navigates to the product detail page', () => {
    cy.intercept('GET', '**/api/v1/orders/67/reorder-items*', {
      statusCode: 200,
      body: { success: true, data: reorderItemsResponse },
    }).as('reorderItems');

    cy.intercept('GET', '**/api/v1/catalog/products/bio-broly-sr*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 10,
          slug: 'bio-broly-sr',
          name: 'Bio-Broly (SR)',
          gameId: 1,
          gameName: 'Dragon Ball Super Card Game',
          rarity: 'SR',
          images: [],
          variants: [],
        },
      },
    }).as('getProduct');

    cy.intercept('GET', '**/api/v1/catalog/products/*/market*', { statusCode: 200, body: { success: true, data: [] } });
    cy.intercept('GET', '**/api/v1/catalog/products/*/effects*', { statusCode: 200, body: { success: true, data: [] } });
    cy.intercept('GET', '**/api/v1/catalog/products/*/collectors*', { statusCode: 200, body: { success: true, data: [] } });

    visitAuthenticated('/account/orders');
    cy.wait('@orders');

    cy.contains('[role="tab"]', 'Completed').click();
    cy.contains('button', 'Reorder').click();
    cy.wait('@reorderItems');

    // Assert reorder modal is open with title and order number
    cy.get('[data-testid="reorder-modal"]').should('be.visible');
    cy.contains('สั่งซื้อสินค้าอีกครั้ง').should('be.visible');
    cy.contains('#ORD-COMPLETED-67').should('be.visible');

    // Assert cards are deduplicated (order had 2 items of Bio-Broly (SR), but only 1 row appears)
    cy.get('[data-testid="reorder-item-btn"]').should('have.length', 1);
    cy.contains('Bio-Broly (SR)').should('be.visible');
    cy.contains('สภาพเดิม: DMG').should('be.visible');
    cy.contains('ราคาเดิมที่เคยซื้อ').should('be.visible');

    // Click "สั่งซื้ออีกครั้ง →" button
    cy.get('[data-testid="reorder-item-btn"]').first().click();

    // Assert modal is closed
    cy.get('[data-testid="reorder-modal"]').should('not.exist');

    // Assert URL matches the Product Detail Page route (/products/:slug)
    cy.url().should('match', /\/products\/[a-zA-Z0-9-]+/);
    cy.location('pathname').should('eq', '/products/bio-broly-sr');
  });
});
