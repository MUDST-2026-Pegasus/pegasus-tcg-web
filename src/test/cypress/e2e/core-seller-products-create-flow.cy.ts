describe('Core Seller Products Create Flow', () => {
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

  const mockVariantLookup = {
    productId: 50,
    productName: 'Charizard Base Set Holo',
    productSlug: 'charizard-base-set-holo',
    variantLabel: 'en / HOLO / UNLIMITED',
    variant: {
      id: 1,
      catalogProductId: 50,
      sku: 'PKM-001',
      languageCode: 'en',
      finish: 'HOLO',
      edition: 'UNLIMITED',
      printingNote: null,
      barcode: '123456789012',
      imageUrl: null,
      active: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
  };

  const mockProductDetail = {
    product: {
      id: 50,
      gameId: 1,
      cardSetId: 1,
      productType: 'SINGLE_CARD',
      name: 'Charizard Base Set Holo',
      nameLocal: 'ลิซาร์ดอน',
      slug: 'charizard-base-set-holo',
      cardNumber: '004/102',
      rarityCode: 'HR',
    },
    variants: [
      {
        id: 1,
        catalogProductId: 50,
        sku: 'PKM-001',
        languageCode: 'en',
        finish: 'HOLO',
        edition: 'UNLIMITED',
        printingNote: null,
        barcode: '123456789012',
        imageUrl: null,
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    images: [
      {
        id: 1,
        catalogVariantId: 1,
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
        altText: 'Charizard',
        primary: true,
      },
    ],
  };

  const mockMarketResponse = {
    items: [
      { id: 1, price: 15000, quantityAvailable: 2, condition: 'NM' },
      { id: 2, price: 18000, quantityAvailable: 1, condition: 'NM' },
    ],
    totalItems: 2,
    totalPages: 1,
    page: 0,
    size: 100,
  };

  const mockListingResponse = {
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
    quantityTotal: 1,
    quantityReserved: 0,
    quantityAvailable: 1,
    status: 'ACTIVE',
    lotLabel: null,
    updatedAt: '2026-01-01T00:00:00Z',
    gradingCompany: null,
    gradeValue: null,
    autoPriceOffsetPercent: null,
    autoPriceFloor: null,
    autoPriceCeiling: null,
    lastAutoPricedAt: null,
    publicNote: null,
    version: 1,
    publishedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    photos: [],
    similarListings: [],
    costBasis: {
      quantity: 1,
      totalCost: 10000,
      averageUnitCost: 10000,
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

  it('navigates through create listing steps, selects card, sets price and publishes', () => {
    // Intercept card lookup
    cy.intercept('GET', '**/api/v1/catalog/variants/by-code/**', {
      statusCode: 200,
      body: {
        success: true,
        data: mockVariantLookup,
      },
    }).as('lookupVariant');

    cy.intercept('GET', '**/api/v1/catalog/products/50**', {
      statusCode: 200,
      body: {
        success: true,
        data: mockProductDetail,
      },
    }).as('getProductDetail');

    cy.intercept('GET', '**/api/v1/listings*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockMarketResponse,
      },
    }).as('getMarket');

    cy.intercept('POST', '**/api/v1/sellers/me/listings', {
      statusCode: 200,
      body: {
        success: true,
        data: { ...mockListingResponse, status: 'DRAFT' },
      },
    }).as('createListing');

    cy.intercept('POST', '**/api/v1/sellers/me/listings/101/units', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('addUnits');

    cy.intercept('PATCH', '**/api/v1/sellers/me/listings/101/status', {
      statusCode: 200,
      body: {
        success: true,
        data: mockListingResponse,
      },
    }).as('publishListing');

    cy.intercept('GET', '**/api/v1/sellers/me/listings*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [],
          totalItems: 0,
          totalPages: 0,
          page: 0,
          size: 20,
        },
      },
    }).as('getListings');

    visitAuthenticated('/seller/products/new');

    cy.wait('@getMe');
    cy.wait('@getSellerProfile');

    // Page title and Step 1
    cy.contains('h1', 'ลงขายสินค้าใหม่').should('be.visible');
    cy.contains('เลือกการ์ดจากแคตตาล็อก').should('be.visible');

    // Code lookup
    cy.get('input[aria-label="SKU หรือบาร์โค้ด"]').type('PKM-001');
    cy.contains('button', 'ค้นด้วยรหัส').click();

    cy.wait('@lookupVariant');

    // Select the resolved card
    cy.contains('button', 'ใช้การ์ดนี้').click();

    // Now on Step 2: สภาพและราคา
    cy.contains('สภาพและราคา').should('be.visible');
    cy.contains('Charizard Base Set Holo').should('be.visible');

    // Select condition NM
    cy.contains('Near Mint (NM)').click();

    // Fill price, quantity, and cost
    cy.contains('label', 'ราคาขายต่อใบ').then(($lbl) => {
      cy.get('#' + $lbl.attr('for')).clear().type('15000');
    });
    cy.contains('label', 'ต้นทุนต่อใบ').then(($lbl) => {
      cy.get('#' + $lbl.attr('for')).clear().type('10000');
    });
    cy.contains('label', 'จำนวนที่มี').then(($lbl) => {
      cy.get('#' + $lbl.attr('for')).clear().type('1');
    });

    // Go to Step 3: รูปภาพ
    cy.contains('button', 'ถัดไป: รูปภาพ').click();
    cy.contains('รูปการ์ดจริง').should('be.visible');

    // Go to Step 4: ตรวจสอบ
    cy.contains('button', 'ถัดไป: ตรวจสอบ').click();
    cy.contains('ตรวจสอบก่อนลงขาย').should('be.visible');

    // Publish listing
    cy.contains('button', 'ลงขายทันที').click();

    cy.wait('@createListing');
    cy.wait('@addUnits');
    cy.wait('@publishListing');

    // Redirects to seller products page
    cy.url().should('include', '/seller/products');
  });
});
