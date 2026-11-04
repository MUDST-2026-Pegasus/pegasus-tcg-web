describe('Core Seller Portal Flow', () => {
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

  const mockDashboardData = {
    period: { month: '2026-10', from: '2026-10-01', to: '2026-10-31' },
    sales: {
      value: 12500,
      previous: 10000,
      orderCount: 15,
      previousOrderCount: 12,
      monthly: [{ month: '2026-10', amount: 12500 }],
    },
    month: { revenue: 13000, cost: 200, commission: 300, net: 12500 },
    orders: { PAID: 3, SHIPPED: 5 },
    listings: {
      active: 8,
      publishedThisMonth: 4,
      lowStockThreshold: 2,
      lowStockCount: 1,
      lowStock: [
        {
          listingId: 101,
          productName: 'Pikachu Illustrator Promo',
          lotLabel: null,
          conditionCode: 'NM',
          quantityAvailable: 1,
          quantityTotal: 5,
        },
      ],
    },
    reviews: { average: 4.9, count: 28, thisMonth: 5, unreplied: 0 },
    wallet: { withdrawable: 8500, pending: 4000 },
    recentOrders: [],
  };

  const mockListingItem = {
    id: 101,
    card: {
      variantId: 1,
      sku: 'PKM-001',
      variantLabel: 'Holo',
      variantActive: true,
      productId: 50,
      productName: 'Charizard Base Set Holo',
      productSlug: 'charizard-base-set-holo',
      gameId: 1,
      officialImageUrl: null,
    },
    condition: 'NM',
    price: 15000,
    currency: 'THB',
    pricingMode: 'MANUAL',
    quantityTotal: 2,
    quantityReserved: 0,
    quantityAvailable: 2,
    status: 'ACTIVE',
    lotLabel: null,
    primaryPhotoUrl: null,
    updatedAt: '2026-10-14T10:00:00Z',
  };

  const visitAuthenticated = (url: string) => {
    cy.intercept("POST", "**/api/v1/auth/refresh", { statusCode: 200, body: { success: true, data: { tokens: { accessToken: 'mock-seller-token', expiresIn: 3600 } } } });
    cy.visit(url);
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Intercept auth
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockSellerUser,
      },
    }).as('getMe');

    // Intercept cart (called globally by Navbar/Root)
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');

    // Intercept seller endpoints
    cy.intercept('GET', '**/api/v1/sellers/me/dashboard*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockDashboardData,
      },
    }).as('getDashboard');

    cy.intercept('GET', '**/api/v1/sellers/me/verifications*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            sellerProfileId: 10,
            status: 'APPROVED',
            legalFirstName: 'สมชาย',
            legalLastName: 'ขายการ์ด',
            bankCode: 'KBANK',
            bankName: 'กสิกรไทย',
            bankAccountNumber: '1234567890',
            bankBookImageKey: 'key-123',
            bankBookImageUrl: null,
            submittedAt: '2026-01-01T00:00:00Z',
            reviewedBy: 1,
            reviewedAt: '2026-01-01T01:00:00Z',
            rejectionReason: null,
          },
        ],
      },
    }).as('getVerifications');

    cy.intercept('GET', '**/api/v1/sellers/me/payout-account*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          bankCode: 'KBANK',
          bankName: 'กสิกรไทย',
          accountNumber: '1234567890',
          accountName: 'สมชาย ขายการ์ด',
          verifiedAt: '2026-01-01T01:00:00Z',
        },
      },
    }).as('getPayoutAccount');

    cy.intercept('GET', '**/api/v1/sellers/me/shipping-options*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            sellerProfileId: 10,
            name: 'Kerry Express Standard',
            carrierCode: 'KERRY',
            baseFee: 50,
            perItemFee: 0,
            freeThreshold: 1000,
            estDaysMin: 1,
            estDaysMax: 2,
            active: true,
            displayOrder: 1,
          },
        ],
      },
    }).as('getShippingOptions');

    cy.intercept('GET', '**/api/v1/sellers/me/listings*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [mockListingItem],
          totalItems: 1,
          totalPages: 1,
          page: 0,
          size: 20,
        },
      },
    }).as('getListings');

    cy.intercept('GET', '**/api/v1/sellers/me', {
      statusCode: 200,
      body: {
        success: true,
        data: mockSellerProfile,
      },
    }).as('getSellerProfile');
  });

  it('renders seller dashboard with stats and sidebar navigation', () => {
    visitAuthenticated('/seller');

    cy.wait('@getMe');
    cy.wait('@getSellerProfile');
    cy.wait('@getDashboard');

    // Sidebar navigation checks
    cy.get('[data-slot="sidebar"]').should('be.visible');
    cy.contains('DASHBOARD').should('be.visible');
    cy.contains('SELLER').should('be.visible');
    cy.contains('แดชบอร์ด').should('be.visible');
    cy.contains('จัดการสินค้า').should('be.visible');
    cy.contains('จัดการร้านค้า').should('be.visible');

    // Dashboard metrics & content
    cy.contains('ยอดขาย').should('be.visible');
  });

  it('navigates to product management page and displays listing item', () => {
    visitAuthenticated('/seller/products');

    cy.wait('@getMe');
    cy.wait('@getSellerProfile');
    cy.wait('@getListings');

    // Heading and table checks
    cy.contains('จัดการสินค้า').should('be.visible');
    cy.contains('Charizard Base Set Holo').should('be.visible');
    cy.contains('15,000').should('be.visible');
  });

  it('navigates to shop settings page and displays shop information and shipping options', () => {
    visitAuthenticated('/seller/shop');

    cy.wait('@getMe');
    cy.wait('@getSellerProfile');
    cy.wait('@getShippingOptions');

    cy.contains('จัดการร้านค้า').should('be.visible');
    cy.contains('ร้านค้าเปิดใช้งาน').should('be.visible');
    cy.contains('Card Master Shop').should('be.visible');
    cy.contains('Kerry Express Standard').should('be.visible');
  });

  it('renders seller payout account verification page (/seller/verification)', () => {
    visitAuthenticated('/seller/verification');

    cy.wait('@getMe');
    cy.wait('@getSellerProfile');
    cy.wait('@getVerifications');

    cy.contains('h1', 'ยืนยันบัญชีรับเงิน').should('be.visible');
    cy.get('input[name="legalFirstName"]').should('be.visible');
    cy.get('input[name="legalLastName"]').should('be.visible');
    cy.get('input[name="bankAccountNumber"]').should('be.visible');
  });
});
