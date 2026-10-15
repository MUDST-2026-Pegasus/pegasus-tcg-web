describe('Core Admin Management Flow', () => {
  const mockAdminUser = {
    id: 1,
    email: 'admin@pegasus.com',
    username: 'superadmin',
    displayName: 'Super Admin',
    roles: ['ADMIN'],
    status: 'ACTIVE',
    bio: null,
    phone: null,
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: null,
  };

  const mockOverview = {
    period: {
      month: '2026-10',
      from: '2026-10-01T00:00:00+07:00',
      to: '2026-11-01T00:00:00+07:00',
      previousFrom: '2026-09-01T00:00:00+07:00',
      previousTo: '2026-10-01T00:00:00+07:00',
    },
    stats: {
      gmv: { value: 428500, previous: 362400, sparkline: [0, 0, 0, 0, 0, 0, 0, 0] },
      newSellers: { value: 32, previous: 0, sparkline: [0, 1, 0, 0, 0, 0, 0, 3] },
      activeListings: { value: 6184, sellerCount: 442 },
      commission: {
        value: 12850,
        previous: 12850,
        sparkline: [1, 2, 3, 4, 5, 6, 7, 8],
        averageRatePercent: 3,
      },
    },
    monthlySales: [
      { month: '2026-08', singles: 200000, sealed: 50000 },
      { month: '2026-09', singles: 250000, sealed: 60000 },
      { month: '2026-10', singles: 350000, sealed: 78500 },
    ],
    topSellers: [
      { sellerProfileId: 1, username: 'cardmaster', displayName: 'Card Master Shop', amount: 85000 },
      { sellerProfileId: 2, username: 'dragontcg', displayName: 'Dragon TCG', amount: 62000 },
    ],
    gameShare: [
      { gameId: 1, gameName: 'Pokémon', amount: 250000, percent: 60, others: false },
      { gameId: 2, gameName: 'Magic: The Gathering', amount: 100000, percent: 25, others: false },
    ],
  };

  const mockUsers = {
    items: [
      {
        id: 1,
        username: 'superadmin',
        displayName: 'Super Admin',
        email: 'admin@pegasus.com',
        roles: ['ADMIN'],
        status: 'ACTIVE',
        bio: null,
        phone: null,
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00Z',
        lastLoginAt: '2026-10-15T08:00:00Z',
      },
      {
        id: 2,
        username: 'cardseller',
        displayName: 'Card Kingdom',
        email: 'seller@pegasus.com',
        roles: ['SELLER'],
        status: 'ACTIVE',
        bio: null,
        phone: null,
        avatarUrl: null,
        createdAt: '2026-01-02T00:00:00Z',
        lastLoginAt: '2026-10-15T09:00:00Z',
      },
    ],
    page: 0,
    size: 20,
    totalItems: 2,
    totalPages: 1,
  };

  const mockBoard = {
    columns: [
      {
        key: 'PENDING_PAYMENT',
        statuses: ['PENDING_PAYMENT'],
        count: 1,
        items: [
          {
            sellerOrderId: 101,
            sellerOrderNumber: 'PGS-20261014-000101-1',
            salesOrderId: 101,
            orderNumber: 'PGS-20261014-000101',
            status: 'PENDING_PAYMENT',
            grandTotal: 1200,
            itemCount: 1,
            seller: { id: 1, username: 'cardseller', displayName: 'Card Kingdom' },
            buyer: { id: 2, username: 'buyer1', displayName: 'Buyer One' },
            createdAt: '2026-10-14T10:00:00Z',
            paidAt: null,
            shippedAt: null,
            completedAt: null,
            cancelledAt: null,
            tracking: null,
            returnReasonCode: null,
            reviewRating: null,
          },
        ],
      },
    ],
    alerts: [],
  };

  const mockGames = [
    {
      id: 1,
      code: 'POKEMON',
      name: 'Pokémon',
      nameLocal: 'โปเกมอน',
      slug: 'pokemon',
      logoUrl: null,
      displayOrder: 1,
      active: true,
      createdBy: 1,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockAttributes = [
    {
      id: 11,
      gameId: 1,
      attrKey: 'hp',
      label: 'HP',
      dataType: 'NUMBER',
      required: false,
      filterable: true,
      displayOrder: 1,
      options: [],
    },
  ];

  const mockCatalogProducts = {
    items: [
      {
        id: 501,
        gameId: 1,
        name: 'Pikachu Illustrator',
        nameLocal: 'พิคาชู อิลลัสเตรเตอร์',
        cardNumber: '001/PROMO',
        cardSetId: 1,
        setName: 'Promo Cards',
        imageUrl: null,
        active: true,
        variantCount: 1,
      },
    ],
    page: 0,
    size: 20,
    totalItems: 1,
    totalPages: 1,
  };

  const visitAuthenticated = (url: string) => {
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'pegasus.auth.session',
          JSON.stringify({
            accessToken: 'mock-admin-token',
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
        data: mockAdminUser,
      },
    }).as('getMe');

    cy.intercept('POST', '**/api/v1/auth/refresh*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          tokens: {
            accessToken: 'mock-refreshed-token',
            refreshToken: 'mock-refreshed-refresh-token',
            expiresIn: 3600,
          },
        },
      },
    }).as('refreshToken');

    // Overview endpoints
    cy.intercept('GET', '**/api/v1/admin/metrics/overview*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockOverview,
      },
    }).as('getOverview');

    // Users endpoints
    cy.intercept('GET', '**/api/v1/admin/users/counts*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          total: 2,
          sellers: 1,
          suspended: 0,
        },
      },
    }).as('getUserCounts');

    cy.intercept('GET', '**/api/v1/admin/users*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockUsers,
      },
    }).as('getUsers');

    // Orders endpoints
    cy.intercept('GET', '**/api/v1/admin/orders/board*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockBoard,
      },
    }).as('getOrderBoard');

    cy.intercept('GET', '**/api/v1/admin/orders*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [],
          page: 0,
          size: 20,
          totalItems: 0,
          totalPages: 0,
        },
      },
    }).as('getOrders');

    // Catalog endpoints
    cy.intercept('GET', '**/api/v1/admin/games*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockGames,
      },
    }).as('getGames');

    cy.intercept('GET', '**/api/v1/admin/catalog/counts*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          total: 1,
          active: 1,
          inactive: 0,
        },
      },
    }).as('getCatalogCounts');

    cy.intercept('GET', '**/api/v1/admin/catalog/products*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockCatalogProducts,
      },
    }).as('getCatalogProducts');

    cy.intercept('GET', '**/api/v1/admin/games/1/attributes*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockAttributes,
      },
    }).as('getGameAttributes');

    cy.intercept('GET', '**/api/v1/card-sets*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('getCardSets');

    cy.intercept('GET', '**/api/v1/admin/categories*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('getCategories');
  });

  it('navigates through admin overview, users, orders, catalog, and card attributes', () => {
    // 1. Overview Page
    visitAuthenticated('/admin');
    cy.contains('ภาพรวมแพลตฟอร์ม').should('be.visible');
    cy.contains('cardmaster').should('be.visible');
    cy.contains('Pokémon').should('be.visible');

    // 2. Users Page
    visitAuthenticated('/admin/users');
    cy.contains('จัดการผู้ใช้').should('be.visible');
    cy.contains('superadmin').should('be.visible');
    cy.contains('cardseller').should('be.visible');

    // 3. Orders Page
    visitAuthenticated('/admin/orders');
    cy.contains('ภาพรวมคำสั่งซื้อ').should('be.visible');
    cy.contains('PGS-20261014-000101').should('be.visible');
    cy.contains('buyer1').should('be.visible');

    // 4. Catalog Page
    visitAuthenticated('/admin/catalog');
    cy.contains('จัดการแคตตาล็อก').should('be.visible');
    cy.contains('Pikachu Illustrator').should('be.visible');

    // 5. Card Attributes Page
    visitAuthenticated('/admin/card-attributes');
    cy.contains('เกมและคุณสมบัติการ์ด').should('be.visible');
    cy.contains('HP').should('be.visible');
  });
});
