describe('Core Catalog Listings and Public Shop Flow', () => {
  const mockProduct = {
    product: {
      id: 50,
      gameId: 1,
      categoryId: 1,
      cardSetId: 1,
      productType: 'SINGLE_CARD',
      name: 'Charizard Base Set',
      nameLocal: 'ลิซาร์ดอน',
      slug: 'charizard-base-set',
      cardNumber: '004/102',
      rarityCode: 'Holo Rare',
      description: 'First edition holographic Charizard card.',
      attributes: {},
      active: true,
    },
    variants: [
      {
        id: 99,
        catalogProductId: 50,
        sku: 'PKM-BS-004-1ST',
        languageCode: 'en',
        finish: 'Foil',
        edition: '1st Edition',
        printingNote: null,
        imageUrl: null,
        active: true,
      },
    ],
    images: [
      {
        id: 1,
        catalogVariantId: 99,
        imageKey: 'charizard.jpg',
        url: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=500',
        altText: 'Charizard Base Set',
        sortOrder: 1,
        primary: true,
      },
    ],
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
    },
  ];

  const mockPublicListing = {
    id: 101,
    card: {
      variantId: 99,
      sku: 'PKM-BS-004-1ST',
      variantLabel: '1st Edition Holo',
      productId: 50,
      productName: 'Charizard Base Set',
      productSlug: 'charizard-base-set',
      gameId: 1,
      officialImageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=500',
    },
    condition: 'NM',
    price: 15000,
    currency: 'THB',
    quantityAvailable: 1,
    primaryPhotoUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=500',
    seller: {
      username: 'cardseller',
      displayName: 'Card Kingdom',
      avatarUrl: null,
    },
  };

  const mockListingDetail = {
    listing: {
      ...mockPublicListing,
      publicNote: 'Near mint condition, stored in protective sleeve and magnetic case.',
      gradingCompany: 'PSA',
      gradeValue: 9,
    },
    photoUrls: ['https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=500'],
  };

  const mockPublicProfile = {
    username: 'cardseller',
    displayName: 'Card Kingdom',
    avatarUrl: null,
    bio: 'Premium collectible card shop.',
    memberSince: '2026-01-01T00:00:00Z',
  };

  const mockStorefrontListings = {
    items: [mockPublicListing],
    page: 0,
    size: 6,
    totalItems: 1,
    totalPages: 1,
  };

  const mockSellerReviews = {
    reviews: [
      {
        id: 701,
        sellerOrderId: 801,
        rating: 5,
        title: 'การ์ดสวยตรงปก',
        comment: 'แพ็คของดีมาก จัดส่งไว แนะนำเลยครับ',
        replyComment: 'ขอบคุณที่อุดหนุนครับ!',
        createdAt: '2026-10-15T10:00:00Z',
        reviewerUsername: 'poke_collector',
      },
    ],
    summary: {
      ratingCount: 1,
      ratingAvg: 5.0,
      count1: 0,
      count2: 0,
      count3: 0,
      count4: 0,
      count5: 1,
    },
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Catalog & Games
    cy.intercept('GET', '**/api/v1/games*', {
      statusCode: 200,
      body: { success: true, data: mockGames },
    }).as('getGames');

    cy.intercept('GET', '**/api/v1/catalog/products/charizard-base-set*', {
      statusCode: 200,
      body: { success: true, data: mockProduct },
    }).as('getProductDetail');

    cy.intercept('GET', '**/api/v1/listings?*productId=50*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [mockPublicListing],
          page: 0,
          size: 100,
          totalItems: 1,
          totalPages: 1,
        },
      },
    }).as('getProductListings');

    // Listing Detail
    cy.intercept('GET', '**/api/v1/listings/101*', {
      statusCode: 200,
      body: { success: true, data: mockListingDetail },
    }).as('getListingDetail');

    // Public Seller Storefront
    cy.intercept('GET', '**/api/v1/u/cardseller/listings*', {
      statusCode: 200,
      body: { success: true, data: mockStorefrontListings },
    }).as('getStorefront');

    cy.intercept('GET', '**/api/v1/u/cardseller/reviews*', {
      statusCode: 200,
      body: { success: true, data: mockSellerReviews },
    }).as('getSellerReviews');

    cy.intercept('GET', '**/api/v1/u/cardseller*', {
      statusCode: 200,
      body: { success: true, data: mockPublicProfile },
    }).as('getPublicProfile');
  });

  it('browses market listings, inspects listing details, and navigates to public seller shop', () => {
    // 1. Visit Market Listings page
    cy.visit('/products/charizard-base-set/listings');
    cy.contains('Market listings').should('be.visible');
    cy.contains('Charizard Base Set').should('be.visible');
    cy.contains('Card Kingdom').should('be.visible');
    cy.contains('฿15,000').should('be.visible');

    // 2. Visit Listing Detail page
    cy.visit('/listings/101');
    cy.contains('Charizard Base Set').should('be.visible');
    cy.contains('Card Kingdom').should('be.visible');
    cy.contains('จำนวนที่มี: 1').should('be.visible');
    cy.contains('รายละเอียดจากผู้ขาย').should('be.visible');
    cy.contains('Near mint condition').should('be.visible');
    cy.contains('PSA 9').should('be.visible');

    // 3. Navigate to Public Seller Shop
    cy.contains('a', 'Card Kingdom').click();
    cy.url().should('include', '/u/cardseller');
    cy.contains('Card Kingdom').should('be.visible');
    cy.contains('@cardseller').should('be.visible');

    // Verify storefront product listing
    cy.contains('Charizard Base Set').should('be.visible');

    // 4. Switch to Reviews Tab
    cy.contains('รีวิวจากผู้ซื้อ').click();
    cy.contains('5.0').should('be.visible');
    cy.contains('การ์ดสวยตรงปก').should('be.visible');
    cy.contains('แพ็คของดีมาก จัดส่งไว แนะนำเลยครับ').should('be.visible');
    cy.contains('ร้านค้าตอบกลับ').should('be.visible');
    cy.contains('ขอบคุณที่อุดหนุนครับ!').should('be.visible');
  });
});
