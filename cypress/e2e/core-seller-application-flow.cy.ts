describe('Core Seller Application Flow', () => {
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

  const mockSellerUser = {
    ...mockBuyerUser,
    roles: ['SELLER'],
  };

  const mockSubmittedVerification = {
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
  };

  const visitAuthenticated = (url: string, isSeller = false) => {
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'pegasus.auth.session',
          JSON.stringify({
            accessToken: isSeller ? 'seller-token' : 'buyer-token',
            refreshToken: 'refresh-token',
            accessExpiresAt: Date.now() + 3600000,
          }),
        );
      },
    });
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Intercept cart for Navbar
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');
  });

  it('renders application form when buyer has no pending application', () => {
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockBuyerUser,
      },
    }).as('getMe');

    cy.intercept('GET', '**/api/v1/sellers/me/verifications*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('getVerifications');

    visitAuthenticated('/become-a-seller');

    cy.wait('@getMe');
    cy.wait('@getVerifications');

    // Header & form assertions
    cy.contains('h1', 'สมัครเป็นผู้ขาย').should('be.visible');
    cy.contains('ใช้เวลาไม่ถึง 2 นาที').should('be.visible');
    cy.get('input[name="legalFirstName"]').should('be.visible');
    cy.get('input[name="legalLastName"]').should('be.visible');
    cy.get('input[name="bankAccountNumber"]').should('be.visible');
  });

  it('renders application status view when buyer has already submitted KYC', () => {
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockBuyerUser,
      },
    }).as('getMe');

    cy.intercept('GET', '**/api/v1/sellers/me/verifications*', {
      statusCode: 200,
      body: {
        success: true,
        data: [mockSubmittedVerification],
      },
    }).as('getVerifications');

    visitAuthenticated('/become-a-seller');

    cy.wait('@getMe');
    cy.wait('@getVerifications');

    // Verification status assertions
    cy.contains('สมชาย รักการ์ด').should('be.visible');
    cy.contains('กสิกรไทย').should('be.visible');
    cy.contains('ดูสถานะคำขอ').should('be.visible');
    cy.contains('a', 'กลับหน้าแรก').should('be.visible');
  });

  it('redirects to seller dashboard if user is already a seller', () => {
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockSellerUser,
      },
    }).as('getMe');

    cy.intercept('GET', '**/api/v1/sellers/me/verifications*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            ...mockSubmittedVerification,
            status: 'APPROVED',
          },
        ],
      },
    }).as('getVerifications');

    cy.intercept('GET', '**/api/v1/sellers/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 5,
          userId: 5,
          status: 'VERIFIED',
          canPublish: true,
          vacationMode: false,
          handlingDays: 2,
          autoAcceptOrders: true,
          verifiedAt: '2026-01-01T00:00:00Z',
          suspendedReason: null,
          createdAt: '2026-01-01T00:00:00Z',
        },
      },
    }).as('getSellerProfile');

    cy.intercept('GET', '**/api/v1/sellers/me/dashboard*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          period: { month: '2026-10', from: '2026-10-01', to: '2026-10-31' },
          sales: { value: 0, previous: 0, orderCount: 0, previousOrderCount: 0, monthly: [] },
          month: { revenue: 0, cost: 0, commission: 0, net: 0 },
          orders: {},
          listings: { active: 0, publishedThisMonth: 0, lowStockThreshold: 2, lowStockCount: 0, lowStock: [] },
          reviews: { average: null, count: 0, thisMonth: 0, unreplied: 0 },
          wallet: { withdrawable: 0, pending: 0 },
          recentOrders: [],
        },
      },
    }).as('getDashboard');

    visitAuthenticated('/become-a-seller', true);

    // Should redirect to /seller
    cy.url().should('include', '/seller');
    cy.contains('SELLER').should('be.visible');
  });
});
