describe('Core Seller Products Manage Flow', () => {
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

  const mockListing = {
    id: 101,
    card: {
      variantId: 1,
      sku: 'PKM-001',
      variantLabel: 'en / HOLO / UNLIMITED',
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
    updatedAt: '2026-01-01T00:00:00Z',
    gradingCompany: null,
    gradeValue: null,
    autoPriceOffsetPercent: null,
    autoPriceFloor: null,
    autoPriceCeiling: null,
    lastAutoPricedAt: null,
    publicNote: 'Near mint condition foil',
    version: 1,
    publishedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    photos: [],
    similarListings: [],
    costBasis: {
      quantity: 2,
      totalCost: 20000,
      averageUnitCost: 10000,
    },
  };

  const mockStockInHistory = {
    receivedTotal: 2,
    soldTotal: 0,
    lots: {
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 0,
      size: 20,
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
  });

  it('updates listing price and saves changes', () => {
    cy.intercept('GET', '**/api/v1/sellers/me/listings/101', {
      statusCode: 200,
      body: {
        success: true,
        data: mockListing,
      },
    }).as('getListing');

    cy.intercept('GET', '**/api/v1/listings*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [],
          totalItems: 0,
          totalPages: 0,
          page: 0,
          size: 100,
        },
      },
    }).as('getMarket');

    cy.intercept('PATCH', '**/api/v1/sellers/me/listings/101/price', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...mockListing,
          price: 16500,
        },
      },
    }).as('changePrice');

    visitAuthenticated('/seller/products/101/edit');

    cy.wait('@getMe');
    cy.wait('@getSellerProfile');
    cy.wait('@getListing');

    cy.contains('h1', 'แก้ไขสินค้า').should('be.visible');
    cy.contains('Charizard Base Set Holo').should('be.visible');

    // Change price
    cy.contains('label', 'ราคาขายต่อใบ').then(($lbl) => {
      cy.get('#' + $lbl.attr('for')).clear().type('16500');
    });

    // Save button becomes enabled
    cy.contains('button', 'บันทึกการเปลี่ยนแปลง').should('be.enabled').click();

    cy.wait('@changePrice');
    cy.contains('บันทึกการเปลี่ยนแปลงแล้ว').should('be.visible');
  });

  it('restocks inventory units and redirects to products list', () => {
    cy.intercept('GET', '**/api/v1/sellers/me/listings/101', {
      statusCode: 200,
      body: {
        success: true,
        data: mockListing,
      },
    }).as('getListing');

    cy.intercept('GET', '**/api/v1/sellers/me/inventory/stock-ins*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockStockInHistory,
      },
    }).as('getStockIns');

    cy.intercept('POST', '**/api/v1/sellers/me/listings/101/units', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('addUnits');

    cy.intercept('GET', '**/api/v1/sellers/me/listings*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [mockListing],
          totalItems: 1,
          totalPages: 1,
          page: 0,
          size: 20,
        },
      },
    }).as('getListings');

    visitAuthenticated('/seller/products/101/restock');

    cy.wait('@getMe');
    cy.wait('@getSellerProfile');
    cy.wait('@getListing');

    cy.contains('h1', 'เติมสต็อก').should('be.visible');
    cy.contains('รับสินค้าเข้าล็อตใหม่').should('be.visible');

    // Enter quantity and cost
    cy.contains('label', 'จำนวนที่รับเข้า').then(($lbl) => {
      cy.get('#' + $lbl.attr('for')).clear().type('5');
    });
    cy.contains('label', 'ต้นทุนรวมทั้งล็อต').then(($lbl) => {
      cy.get('#' + $lbl.attr('for')).clear().type('50000');
    });

    // Save
    cy.contains('button', 'บันทึกการรับเข้า').should('be.enabled').click();

    cy.wait('@addUnits');
    cy.url().should('include', '/seller/products');
  });
});
