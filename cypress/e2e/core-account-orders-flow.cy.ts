describe('Core Account Orders Flow', () => {
  const mockBuyerUser = {
    id: 1,
    email: 'buyer@pegasus.com',
    username: 'buyeruser',
    displayName: 'Buyer User',
    roles: ['BUYER'],
    status: 'ACTIVE',
    bio: null,
    phone: '0812345678',
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: null,
  };

  const mockOrderPending = {
    id: 101,
    orderNumber: 'ORD-20261015-000101',
    buyerId: 1,
    status: 'PENDING_PAYMENT',
    currency: 'THB',
    itemsSubtotal: 2500,
    shippingTotal: 50,
    discountTotal: 0,
    grandTotal: 2550,
    shippingAddressId: 1,
    shippingAddressSnapshot: JSON.stringify({
      recipientName: 'Buyer User',
      phone: '0812345678',
      line1: '123 Sukhumvit Road',
      province: 'Bangkok',
      postalCode: '10110',
    }),
    buyerNote: null,
    placedAt: '2026-10-15T10:00:00Z',
    cancellableUntil: '2026-10-15T11:00:00Z',
    paidAt: null,
    completedAt: null,
    cancelledAt: null,
    sellerOrders: [
      {
        id: 501,
        salesOrderId: 101,
        sellerProfileId: 10,
        sellerName: 'Card Master Shop',
        sellerOrderNumber: 'PGS-20261015-000501-S10',
        status: 'PENDING_PAYMENT',
        itemsSubtotal: 2500,
        shippingFee: 50,
        discountAmount: 0,
        grandTotal: 2550,
        commissionAmount: 127.5,
        sellerNetAmount: 2422.5,
        acceptedAt: null,
        shippedAt: null,
        deliveredAt: null,
        autoCompleteAt: null,
        completedAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: '2026-10-15T10:00:00Z',
        items: [
          {
            id: 1,
            listingId: 101,
            catalogVariantId: 1,
            productName: 'Charizard Base Set Holo',
            variantLabel: 'Holo Rare',
            condition: 'NM',
            unitPrice: 2500,
            quantity: 1,
            lineTotal: 2500,
            gameName: 'Pokemon TCG',
            imageKey: null,
            imageUrl: null,
            unitIds: [1],
          },
        ],
        shipments: [],
        statusHistory: [],
      },
    ],
  };

  const mockOrderCancelled = {
    ...mockOrderPending,
    status: 'CANCELLED',
    cancelledAt: '2026-10-15T10:30:00Z',
  };

  const visitAuthenticated = (url: string) => {
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'pegasus.auth.session',
          JSON.stringify({
            accessToken: 'mock-buyer-token',
            refreshToken: 'mock-refresh-token',
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
        data: mockBuyerUser,
      },
    }).as('getMe');

    cy.intercept('POST', '**/api/v1/auth/refresh*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          tokens: {
            accessToken: 'mock-buyer-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
          },
        },
      },
    }).as('refreshToken');

    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');

    cy.intercept('GET', '**/api/v1/refunds*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('getRefunds');

    cy.intercept('GET', '**/api/v1/orders/*/returns*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('getReturns');

    cy.intercept('GET', '**/api/v1/orders/*/reviews/mine*', {
      statusCode: 200,
      body: {
        success: true,
        data: null,
      },
    }).as('getMyReview');
  });

  it('displays orders list and opens order details modal', () => {
    cy.intercept('GET', '**/api/v1/orders*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [mockOrderPending],
          totalItems: 1,
          totalPages: 1,
          page: 0,
          size: 50,
        },
      },
    }).as('getOrders');

    visitAuthenticated('/account/orders');

    cy.wait('@getMe');
    cy.wait('@getOrders');

    cy.contains('h1', 'Order History').should('be.visible');
    cy.contains('ORD-20261015-000101').should('be.visible');
    cy.contains('Charizard Base Set Holo').should('be.visible');

    // Click View Details to open modal
    cy.contains('button', 'View Details').click();

    cy.contains('[data-slot="dialog-title"]', 'Order Details').should('be.visible');
    cy.contains('123 Sukhumvit Road').should('be.visible');

    // Close details modal
    cy.get('button[aria-label="Close"]').click();
    cy.contains('[data-slot="dialog-title"]', 'Order Details').should('not.exist');
  });

  it('cancels a pending order with confirmation', () => {
    let cancelled = false;

    cy.intercept('GET', '**/api/v1/orders*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            items: [cancelled ? mockOrderCancelled : mockOrderPending],
            totalItems: 1,
            totalPages: 1,
            page: 0,
            size: 50,
          },
        },
      });
    }).as('getOrdersDynamic');

    cy.intercept('POST', '**/api/v1/orders/101/cancel*', (req) => {
      cancelled = true;
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: mockOrderCancelled,
        },
      });
    }).as('cancelOrder');

    visitAuthenticated('/account/orders');

    cy.wait('@getMe');
    cy.wait('@getOrdersDynamic');

    cy.contains('ORD-20261015-000101').should('be.visible');

    // Click Cancel Order
    cy.contains('button', 'Cancel Order').click({ force: true });

    // Confirm in dialog
    cy.contains('Cancel this order?').should('be.visible');
    cy.get('[data-slot="dialog-content"]').within(() => {
      cy.contains('button', 'Confirm Cancel').click();
    });

    cy.wait('@cancelOrder');
    cy.contains('Order Cancelled').should('be.visible');
  });

  it('submits a seller review on a completed order from the order details modal', () => {
    const mockOrderCompleted = {
      ...mockOrderPending,
      status: 'COMPLETED',
      completedAt: '2026-10-16T08:00:00Z',
      sellerOrders: [
        {
          ...mockOrderPending.sellerOrders[0],
          status: 'COMPLETED',
          completedAt: '2026-10-16T08:00:00Z',
        },
      ],
    };

    cy.intercept('GET', '**/api/v1/orders?*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [mockOrderCompleted],
          totalItems: 1,
          totalPages: 1,
          page: 0,
          size: 50,
        },
      },
    }).as('getCompletedOrders');

    cy.intercept('POST', '**/api/v1/orders/501/reviews*', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 901,
          sellerOrderId: 501,
          rating: 5,
          title: 'ประทับใจมาก',
          comment: 'การ์ดแท้ แพ็คแน่นหนา ส่งไวครับ',
          replyComment: null,
          visible: true,
          createdAt: '2026-10-16T09:00:00Z',
          repliedAt: null,
        },
      },
    }).as('createReview');

    visitAuthenticated('/account/orders');
    cy.wait('@getCompletedOrders');

    cy.contains('button', 'View Details').click();
    cy.contains('[data-slot="dialog-title"]', 'Order Details').should('be.visible');
    cy.wait('@getMyReview');

    cy.contains('h4', 'รีวิวผู้ขาย').scrollIntoView().should('be.visible');
    cy.get('input[aria-label="หัวข้อรีวิว"]').type('ประทับใจมาก');
    cy.get('textarea[aria-label="ข้อความรีวิว"]').type('การ์ดแท้ แพ็คแน่นหนา ส่งไวครับ');
    cy.contains('button', 'ส่งรีวิว').click();

    cy.wait('@createReview').its('request.body').should('deep.equal', {
      rating: 5,
      title: 'ประทับใจมาก',
      comment: 'การ์ดแท้ แพ็คแน่นหนา ส่งไวครับ',
    });

    cy.contains('รีวิวที่ส่งแล้ว').should('be.visible');
    cy.contains('การ์ดแท้ แพ็คแน่นหนา ส่งไวครับ').should('be.visible');
  });
});
