describe('Core Admin Portal Flow', () => {
  const mockAdminUser = {
    id: 99,
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

  const mockBuyerUser = {
    id: 5,
    email: 'buyer@pegasus.com',
    username: 'buyeruser',
    displayName: 'Buyer User',
    roles: ['BUYER'],
    status: 'ACTIVE',
    bio: null,
    phone: null,
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: null,
  };

  const mockMetricsOverview = {
    period: {
      month: '2026-10',
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-31T23:59:59Z',
      previousFrom: '2026-09-01T00:00:00Z',
      previousTo: '2026-09-30T23:59:59Z',
    },
    stats: {
      gmv: { value: 250000, previous: 200000, sparkline: [10, 20, 30, 40, 50, 60, 70, 80] },
      newSellers: { value: 12, previous: 8, sparkline: [1, 1, 2, 1, 2, 2, 1, 2] },
      activeListings: { value: 450, sellerCount: 35 },
      commission: { value: 12500, previous: 10000, sparkline: [1, 2, 1, 2, 1, 2, 1, 2], averageRatePercent: 5.0 },
    },
    monthlySales: [
      { month: '2026-09', singles: 180000, sealed: 20000 },
      { month: '2026-10', singles: 220000, sealed: 30000 },
    ],
    topSellers: [
      { sellerProfileId: 10, username: 'cardmaster', displayName: 'Card Master Shop', amount: 85000 },
    ],
    gameShare: [
      { gameId: 1, gameName: 'Pokémon', amount: 150000, percent: 60.0, others: false },
      { gameId: 2, gameName: 'One Piece', amount: 100000, percent: 40.0, others: false },
    ],
  };

  const mockVerificationQueue = {
    items: [
      {
        id: 1,
        sellerProfileId: 5,
        status: 'SUBMITTED',
        legalFirstName: 'สมชาย',
        legalLastName: 'รักการ์ด',
        bankCode: 'KBANK',
        bankName: 'กสิกรไทย',
        bankAccountNumber: '1234567890',
        bankBookImageKey: 'key-sample-image',
        bankBookImageUrl: null,
        submittedAt: '2026-10-14T10:00:00Z',
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
      },
    ],
    totalItems: 1,
    totalPages: 1,
    page: 0,
    size: 5,
  };

  const visitWithRole = (url: string, user: typeof mockAdminUser | typeof mockBuyerUser) => {
    cy.intercept("POST", "**/api/v1/auth/refresh", { statusCode: 200, body: { success: true, data: { tokens: { accessToken: `${user.roles[0].toLowerCase()}-token`, expiresIn: 3600 } } } });
    cy.visit(url);
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Intercept cart for layout
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');
  });

  it('renders admin overview dashboard with platform metrics and sidebar navigation', () => {
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockAdminUser,
      },
    }).as('getMe');

    cy.intercept('GET', '**/api/v1/admin/metrics/overview*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockMetricsOverview,
      },
    }).as('getOverview');

    cy.intercept('GET', '**/api/v1/admin/verifications*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockVerificationQueue,
      },
    }).as('getVerificationsQueue');

    visitWithRole('/admin', mockAdminUser);

    cy.wait('@getMe');
    cy.wait('@getOverview');
    cy.wait('@getVerificationsQueue');

    // Page title and headers
    cy.contains('h1', 'ภาพรวมแพลตฟอร์ม').should('be.visible');
    cy.contains('สรุปผลประกอบการและกิจกรรมทั้งหมดบน Pegasus TCG').should('be.visible');

    // Sidebar navigation checks
    cy.contains('DASHBOARD').should('be.visible');
    cy.contains('ADMIN').should('be.visible');
    cy.contains('จัดการแคตตาล็อก').should('be.visible');
    cy.contains('อนุมัติผู้ขาย').should('be.visible');
    cy.contains('จัดการผู้ใช้').should('be.visible');

    // Chart & card checks
    cy.contains('ยอดขายรายเดือน').should('be.visible');
    cy.contains('ร้านค้าที่ทำยอดขายสูงสุด').should('be.visible');
    cy.contains('cardmaster').should('be.visible');
    cy.contains('สัดส่วนยอดขายตามเกม').should('be.visible');
    cy.contains('คำขอเปิดร้านที่รอตรวจ').should('be.visible');
    cy.contains('สมชาย รักการ์ด').should('be.visible');
  });

  it('guards admin route and redirects non-admin users to home', () => {
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockBuyerUser,
      },
    }).as('getMe');

    visitWithRole('/admin', mockBuyerUser);

    cy.wait('@getMe');

    // Unauthorized buyer should be redirected away from /admin
    cy.url().should('not.include', '/admin');
  });
});
