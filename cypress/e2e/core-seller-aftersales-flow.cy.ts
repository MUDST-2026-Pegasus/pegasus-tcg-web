describe('Core Seller Aftersales Flow', () => {
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

  const mockReturns = [
    {
      id: 1,
      sellerOrderId: 501,
      sellerOrderNumber: 'PGS-20261014-000501-S10',
      reasonCode: 'DAMAGED_CARD',
      description: 'The card corner has a crease not mentioned in listing',
      status: 'REQUESTED',
      resolution: null,
      refundAmount: null,
      evidenceKeys: ['evidence-1.jpg'],
      returnTrackingNumber: null,
      requestedAt: '2026-10-14T10:00:00Z',
      reviewedAt: null,
      receivedAt: null,
      closedAt: null,
      sellerOrderGrandTotal: 1500,
      deliveredAt: '2026-10-13T12:00:00Z',
      autoCompleteAt: '2026-10-16T12:00:00Z',
      buyer: {
        username: 'poke_collector',
        displayName: 'Poke Collector',
      },
      items: [
        {
          returnItemId: 1,
          orderItemId: 101,
          cardName: 'Charizard Base Set',
          variantLabel: 'Holo Rare',
          conditionCode: 'NM',
          imageUrl: null,
          unitPrice: 1500,
          quantityReturned: 1,
          quantityOrdered: 1,
          restock: true,
        },
      ],
    },
  ];

  const mockDashboard = {
    period: {
      month: '2026-10',
      from: '2026-10-01T00:00:00+07:00',
      to: '2026-11-01T00:00:00+07:00',
    },
    sales: {
      value: 24850,
      previous: 22187.5,
      orderCount: 56,
      previousOrderCount: 50,
      monthly: [
        { month: '2026-09', amount: 22187.5 },
        { month: '2026-10', amount: 24850 },
      ],
    },
    month: { revenue: 26000, cost: 16420, commission: 1242.5, net: 8337.5 },
    orders: { PAID: 5, PREPARING: 3, PENDING_PAYMENT: 2, COMPLETED: 40 },
    listings: {
      active: 142,
      publishedThisMonth: 5,
      lowStockThreshold: 2,
      lowStockCount: 2,
      lowStock: [],
    },
    reviews: { average: 4.8, count: 25, thisMonth: 4, unreplied: 1 },
    wallet: { withdrawable: 3420, pending: 1850.5 },
    recentOrders: [],
  };

  const mockPublicReviews = {
    reviews: [
      {
        id: 71,
        rating: 5,
        title: 'แพ็คดีมาก การ์ดสวยตรงปก',
        comment: 'จัดส่งรวดเร็ว ห่อบับเบิ้ลหนาแน่น การ์ดไม่มีรอยเลย แนะนำร้านนี้ครับ',
        replyComment: null,
        createdAt: '2026-10-14T08:30:00Z',
        reviewerUsername: 'card_hunter_99',
      },
    ],
    summary: {
      ratingCount: 25,
      ratingAvg: 4.8,
      count1: 0,
      count2: 0,
      count3: 1,
      count4: 3,
      count5: 21,
    },
  };

  const visitAuthenticated = (url: string) => {
    cy.intercept("POST", "**/api/v1/auth/refresh", { statusCode: 200, body: { success: true, data: { tokens: { accessToken: 'mock-seller-token', expiresIn: 3600 } } } });
    cy.visit(url);
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

    cy.intercept('POST', '**/api/v1/auth/refresh*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          tokens: {
            accessToken: 'mock-refreshed-token',
            expiresIn: 3600,
          },
        },
      },
    }).as('refreshToken');

    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { items: [], total: 0 },
      },
    }).as('getCart');

    cy.intercept('GET', '**/api/v1/sellers/me', {
      statusCode: 200,
      body: {
        success: true,
        data: mockSellerProfile,
      },
    }).as('getSellerProfile');
  });

  it('allows seller to view returns list, inspect request, and open return policy', () => {
    cy.intercept('GET', '**/api/v1/sellers/me/returns*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockReturns,
      },
    }).as('getReturns');

    visitAuthenticated('/seller/returns');

    cy.wait('@getMe');
    cy.wait('@getReturns');

    // Page Header
    cy.contains('h1', 'คำขอคืนสินค้า').should('be.visible');
    cy.contains('ต้องดำเนินการ (1)').should('be.visible');
    cy.contains('รอผู้ซื้อส่งคืน (0)').should('be.visible');

    // Return Request Card
    cy.contains('RT-1').should('be.visible');
    cy.contains('poke_collector').should('be.visible');
    cy.contains('Charizard Base Set').should('be.visible');

    // Open Return Policy Dialog
    cy.contains('button', 'นโยบายการคืนสินค้า').click();
    cy.contains('นโยบายและขั้นตอนการคืนสินค้า').should('be.visible');
    cy.contains('button', 'เข้าใจแล้ว').click();
    cy.contains('นโยบายและขั้นตอนการคืนสินค้า').should('not.exist');
  });

  it('allows seller to view reviews page, see rating overview, and browse reviews', () => {
    cy.intercept('GET', '**/api/v1/sellers/me/dashboard*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockDashboard,
      },
    }).as('getDashboard');

    cy.intercept('GET', '**/api/v1/u/cardmaster/reviews*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockPublicReviews,
      },
    }).as('getReviews');

    visitAuthenticated('/seller/reviews');

    cy.wait('@getMe');
    cy.wait('@getDashboard');
    cy.wait('@getReviews');

    // Page Header & Stats
    cy.contains('h1', 'รีวิวร้านค้า').should('be.visible');
    cy.contains('คะแนนเฉลี่ย').should('be.visible');
    cy.contains('4.8').should('be.visible');
    cy.contains('รีวิวทั้งหมด').should('be.visible');
    cy.contains('25').should('be.visible');

    // Review Item
    cy.contains('card_hunter_99').should('be.visible');
    cy.contains('แพ็คดีมาก การ์ดสวยตรงปก').should('be.visible');
    cy.contains('จัดส่งรวดเร็ว ห่อบับเบิ้ลหนาแน่น').should('be.visible');

    // Filter tabs
    cy.contains('button', 'ยังไม่ตอบ 1').should('be.visible');
  });
});
