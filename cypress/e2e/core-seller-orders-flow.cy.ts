describe('Core Seller Orders Flow', () => {
  const mockSellerUser = {
    id: 10,
    email: 'seller@pegasus.com',
    username: 'cardmaster',
    displayName: 'Card Master Shop',
    roles: ['SELLER'],
    status: 'ACTIVE',
    bio: null,
    phone: null,
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: null,
  };

  const mockSellerProfile = {
    id: 10,
    userId: 10,
    status: 'VERIFIED',
    canPublish: true,
    vacationMode: false,
    handlingDays: 2,
    autoAcceptOrders: true,
    verifiedAt: '2026-01-01T00:00:00Z',
    suspendedReason: null,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockAddress = {
    recipientName: 'Buyer User',
    line1: '123 Sukhumvit Road',
    subdistrict: 'Khlong Toei',
    district: 'Khlong Toei',
    province: 'Bangkok',
    postalCode: '10110',
    phone: '0812345678',
  };

  const mockOrderSummary = {
    order: {
      id: 501,
      salesOrderId: 101,
      sellerProfileId: 10,
      sellerOrderNumber: 'PGS-20261014-000501-S10',
      status: 'PAID',
      itemsSubtotal: 2500,
      shippingFee: 50,
      discountAmount: 0,
      grandTotal: 2550,
      commissionAmount: 127.5,
      sellerNetAmount: 2422.5,
      acceptedAt: '2026-10-14T10:00:00Z',
      shippedAt: null,
      deliveredAt: null,
      autoCompleteAt: null,
      completedAt: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: '2026-10-14T09:00:00Z',
      items: [
        {
          id: 1,
          listingId: 101,
          catalogVariantId: 1,
          productName: 'Charizard Base Set Holo',
          variantLabel: 'Holo',
          condition: 'NM',
          unitPrice: 2500,
          quantity: 1,
          lineTotal: 2500,
          gameName: 'Pokemon TCG',
          imageKey: null,
          imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
          unitIds: [1],
        },
      ],
      shipments: [],
      statusHistory: [],
      sellerName: 'Card Master Shop',
    },
    orderNumber: 'ORD-101',
    buyer: { id: 5, username: 'buyeruser', displayName: 'Buyer User' },
    paidAt: '2026-10-14T09:30:00Z',
    shipBy: '2026-10-16T09:30:00Z',
    shippingAddressSnapshot: JSON.stringify(mockAddress),
    buyerNote: null,
  };

  const mockOrderDetail = {
    summary: mockOrderSummary,
    payment: {
      method: 'BANK_TRANSFER',
      status: 'SUCCEEDED',
      amount: 2550,
      paidAt: '2026-10-14T09:30:00Z',
    },
    costTotal: 1000,
    buyerOrderCount: 1,
  };

  const visitAuthenticated = (url: string) => {
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'pegasus.auth.session',
          JSON.stringify({
            accessToken: 'mock-seller-token',
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
        data: mockSellerUser,
      },
    }).as('getMe');

    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');

    cy.intercept('GET', '**/api/v1/sellers/me', {
      statusCode: 200,
      body: {
        success: true,
        data: mockSellerProfile,
      },
    }).as('getSellerProfile');

    cy.intercept('GET', '**/api/v1/sellers/me/orders/counts*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          PENDING_PAYMENT: 0,
          PAID: 1,
          SHIPPED: 0,
          COMPLETED: 0,
          CANCELLED: 0,
        },
      },
    }).as('getOrderCounts');

    cy.intercept('GET', '**/api/v1/sellers/me/orders*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            items: [mockOrderSummary],
            totalItems: 1,
            totalPages: 1,
            page: 0,
            size: 10,
          },
        },
      });
    }).as('getOrders');
  });

  it('renders seller orders page with status tabs, order list, and filter', () => {
    visitAuthenticated('/seller/orders');

    cy.wait('@getMe');
    cy.wait('@getSellerProfile');
    cy.wait('@getOrderCounts');
    cy.wait('@getOrders');

    // Page title and tabs
    cy.contains('h1', 'จัดการคำสั่งซื้อ').should('be.visible');
    cy.contains('button', 'รอแพ็ค 1').should('be.visible');

    // Order card details
    cy.contains('PGS-20261014-000501-S10').should('be.visible');
    cy.contains('Buyer User').should('be.visible');
    cy.contains('Charizard Base Set Holo').should('be.visible');
    cy.contains('2,550').should('be.visible');
  });

  it('navigates to order detail page and views packing and shipping info', () => {
    cy.intercept('GET', '**/api/v1/sellers/me/orders/501*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockOrderDetail,
      },
    }).as('getOrderDetail');

    visitAuthenticated('/seller/orders/501');

    cy.wait('@getMe');
    cy.wait('@getOrderDetail');

    // Order number in detail view
    cy.contains('PGS-20261014-000501-S10').should('be.visible');

    // Packing list card
    cy.contains('รายการที่ต้องแพ็ค').should('be.visible');
    cy.contains('Charizard Base Set Holo').should('be.visible');
    cy.contains('Holo · Near Mint').should('be.visible');

    // Destination
    cy.contains('123 Sukhumvit Road').should('be.visible');

    // Profit breakdown
    cy.contains('กำไรจากออเดอร์นี้').should('be.visible');
    cy.contains('1,422.50').should('be.visible');
  });

  it('confirms shipping for a paid seller order', () => {
    cy.intercept('GET', '**/api/v1/sellers/me/orders/501*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockOrderDetail,
      },
    }).as('getOrderDetail');

    cy.intercept('POST', '**/api/v1/sellers/me/orders/501/ship*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...mockOrderDetail,
          summary: {
            ...mockOrderDetail.summary,
            order: {
              ...mockOrderDetail.summary.order,
              status: 'SHIPPED',
              shippedAt: new Date().toISOString(),
            },
          },
        },
      },
    }).as('shipOrder');

    visitAuthenticated('/seller/orders/501');

    cy.wait('@getOrderDetail');

    // Fill tracking number
    cy.get('input[placeholder*="TH2408"]').should('be.visible').type('TH123456789TH');

    // Click confirm ship in header
    cy.contains('button', 'ยืนยันจัดส่ง').click();

    // Confirm inside alertdialog
    cy.get('[role="alertdialog"]').contains('button', 'ยืนยันจัดส่ง').click();

    cy.wait('@shipOrder').its('request.body').should('deep.include', {
      trackingNumber: 'TH123456789TH',
    });
  });
});
