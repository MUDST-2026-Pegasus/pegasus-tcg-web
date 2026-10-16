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

    // Navbar cart query
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');

    // Admin verifications query on overview
    cy.intercept('GET', '**/api/v1/admin/verifications*', {
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
    }).as('getVerifications');

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

    cy.intercept('GET', '**/api/v1/admin/users?*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockUsers,
      },
    }).as('getUsersQuery');

    cy.intercept('GET', '**/api/v1/admin/users', {
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

    cy.intercept('GET', '**/api/v1/admin/orders?*', {
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
    }).as('getOrdersQuery');

    cy.intercept('GET', '**/api/v1/admin/orders', {
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
        data: [
          {
            id: 1,
            code: 'SINGLE_CARD',
            name: 'Single Cards',
            nameLocal: 'การ์ดเดี่ยว',
            slug: 'single-cards',
            parentId: null,
            displayOrder: 1,
            active: true,
          },
        ],
      },
    }).as('getCategories');

    // Public games/categories for commission page
    cy.intercept('GET', '**/api/v1/games*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockGames,
      },
    }).as('getPublicGames');

    cy.intercept('GET', '**/api/v1/categories*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            code: 'SINGLE_CARD',
            name: 'Single Cards',
            nameLocal: 'การ์ดเดี่ยว',
            slug: 'single-cards',
            parentId: null,
            displayOrder: 1,
            active: true,
          },
        ],
      },
    }).as('getPublicCategories');
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
    cy.wait('@getGameAttributes');
    cy.contains('เกมและคุณสมบัติการ์ด').should('be.visible');
    cy.contains('HP').should('be.visible');
  });

  it('manages admin finance (payments, refunds, payouts, commission) and seller reviews moderation', () => {
    // 1. Admin Payments (/admin/payments)
    const mockPaymentItem = {
      id: 901,
      salesOrderId: 101,
      orderNumber: 'PGS-20261014-000101',
      buyer: {
        id: 2,
        username: 'buyer1',
        displayName: 'Buyer One',
        avatarUrl: null,
      },
      amount: 1200,
      unpaidTotal: 1200,
      status: 'AWAITING_VERIFICATION',
      method: 'PROMPTPAY_MANUAL',
      referenceCode: 'REF999888',
      slipUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300',
      failureReason: null,
      createdAt: '2026-10-14T10:00:00Z',
      expiresAt: '2026-10-20T10:00:00Z',
      verifiedAt: null,
      splits: [
        {
          sellerOrderId: 101,
          sellerOrderNumber: 'PGS-20261014-000101-1',
          seller: {
            id: 1,
            username: 'cardseller',
            displayName: 'Card Kingdom',
            avatarUrl: null,
          },
          grandTotal: 1200,
        },
      ],
    };

    cy.intercept('GET', '**/api/v1/admin/payments*', {
      statusCode: 200,
      body: {
        success: true,
        data: [mockPaymentItem],
      },
    }).as('getAdminPayments');

    cy.intercept('GET', '**/api/v1/admin/payments/summary*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          awaitingVerification: 1,
          approvedToday: 5,
          rejectedToday: 0,
          awaitingTransfer: 0,
        },
      },
    }).as('getPaymentSummary');

    cy.intercept('GET', '**/api/v1/admin/settings/payment.slip_auto_approve*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          key: 'payment.slip_auto_approve',
          value: 'false',
          description: 'Auto approve slips',
          updatedBy: null,
        },
      },
    }).as('getSlipAutoApprove');

    cy.intercept('GET', '**/api/v1/admin/settings/payment.transfer_account*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          key: 'payment.transfer_account',
          value: JSON.stringify({
            bankName: 'กสิกรไทย',
            accountName: 'บจก. เพกาซัส เทรดดิ้ง',
            accountNumber: '123-4-56789-0',
          }),
          description: 'Transfer account',
          updatedBy: null,
        },
      },
    }).as('getTransferAccount');

    cy.intercept('POST', '**/api/v1/admin/payments/901/verify*', {
      statusCode: 200,
      body: {
        success: true,
        data: { ...mockPaymentItem, status: 'SUCCEEDED' },
      },
    }).as('verifyPayment');

    visitAuthenticated('/admin/payments');
    cy.wait('@getAdminPayments');
    cy.contains('h1', 'ตรวจสอบสลิปชำระเงิน').should('be.visible');
    cy.contains('PGS-20261014-000101').should('be.visible').click();
    cy.contains('REF999888').should('be.visible');
    cy.contains('button', 'อนุมัติการชำระเงิน').click();
    cy.wait('@verifyPayment').its('request.body').should('deep.equal', { approved: true });

    // 2. Admin Refunds (/admin/refunds)
    const mockRefundItem = {
      id: 801,
      salesOrderId: 101,
      orderNumber: 'PGS-20261014-000101',
      sellerOrderId: 101,
      sellerOrderNumber: 'PGS-20261014-000101-1',
      returnRequestId: 701,
      resolution: 'FULL_REFUND',
      buyer: {
        id: 2,
        username: 'buyer1',
        displayName: 'Buyer One',
        avatarUrl: null,
      },
      seller: {
        id: 1,
        username: 'cardseller',
        displayName: 'Card Kingdom',
        avatarUrl: null,
      },
      amount: 1200,
      reason: 'Card bent during transit',
      status: 'APPROVED',
      method: 'BANK_TRANSFER',
      bankName: 'กสิกรไทย',
      accountName: 'สมชาย ใจดี',
      accountNumber: '0987654321',
      transferReference: null,
      escrowAmount: 1200,
      escrowRefunded: 0,
      failedAttempts: 0,
      lastFailureReason: null,
      requestedAt: '2026-10-14T12:00:00Z',
      processedAt: null,
    };

    cy.intercept('GET', '**/api/v1/admin/refunds*', {
      statusCode: 200,
      body: {
        success: true,
        data: [mockRefundItem],
      },
    }).as('getAdminRefunds');

    cy.intercept('GET', '**/api/v1/admin/refunds/summary*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ready: 1,
          processing: 0,
          failedAwaitingBuyer: 0,
          processedThisMonth: 2,
          processedAmountThisMonth: 2500,
        },
      },
    }).as('getRefundSummary');

    cy.intercept('GET', '**/api/v1/admin/refunds/801/transfers*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('getRefundTransfers');

    visitAuthenticated('/admin/refunds');
    cy.wait('@getAdminRefunds');
    cy.contains('h1', 'คืนเงินผู้ซื้อ').should('be.visible');
    cy.contains('PGS-20261014-000101').should('be.visible').click();
    cy.contains('สมชาย ใจดี').should('be.visible');
    cy.contains('098-7-65432-1').should('be.visible');

    // 3. Admin Payouts (/admin/payouts)
    const mockPayoutItem = {
      id: 601,
      sellerProfileId: 1,
      seller: {
        id: 1,
        username: 'cardseller',
        displayName: 'Card Kingdom',
        avatarUrl: null,
      },
      amount: 5000,
      currency: 'THB',
      status: 'REQUESTED',
      account: {
        bankName: 'ไทยพาณิชย์',
        accountName: 'บจก. การ์ดคิงดอม',
        accountNumber: '1234563456',
        verifiedAt: '2026-01-02T00:00:00Z',
      },
      wallet: {
        available: 10000,
        pending: 2000,
        reserved: 5000,
      },
      requestedAt: '2026-10-15T09:00:00Z',
      approvedAt: null,
      approvedBy: null,
      paidAt: null,
      transferReference: null,
      rejectionReason: null,
      orders: [],
      ordersLinked: false,
    };

    cy.intercept('GET', '**/api/v1/admin/payouts*', {
      statusCode: 200,
      body: {
        success: true,
        data: [mockPayoutItem],
      },
    }).as('getAdminPayouts');

    cy.intercept('GET', '**/api/v1/admin/payouts/summary*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          requested: 1,
          inProgress: 0,
          paidAmountThisMonth: 15000,
          closedThisMonth: 3,
        },
      },
    }).as('getPayoutSummary');

    cy.intercept('POST', '**/api/v1/admin/payouts/601/approve*', {
      statusCode: 200,
      body: {
        success: true,
        data: { ...mockPayoutItem, status: 'APPROVED' },
      },
    }).as('approvePayout');

    visitAuthenticated('/admin/payouts');
    cy.wait('@getAdminPayouts');
    cy.contains('h1', 'ถอนเงินผู้ขาย').should('be.visible');
    cy.contains('PO-601').should('be.visible').click();
    cy.contains('บจก. การ์ดคิงดอม').should('be.visible');
    cy.contains('button', /^อนุมัติ$/).click();
    cy.wait('@approvePayout');

    // 4. Admin Commission (/admin/commission)
    cy.intercept('GET', '**/api/v1/admin/commission-rules*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            scope: 'GAME',
            gameId: 1,
            categoryId: null,
            sellerProfileId: null,
            ratePercent: 4.5,
            fixedFee: 0,
            minFee: 10,
            maxFee: 500,
            active: true,
            effectiveFrom: '2026-01-01T00:00:00Z',
            effectiveTo: null,
            priority: 1,
          },
        ],
      },
    }).as('getCommissionRules');

    cy.intercept('GET', '**/api/v1/admin/settings/commission.default_rate*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          key: 'commission.default_rate',
          value: '5',
          description: 'Default platform commission rate',
          updatedBy: null,
        },
      },
    }).as('getDefaultCommissionRate');

    visitAuthenticated('/admin/commission');
    cy.wait('@getCommissionRules');
    cy.contains('h1', 'ค่าคอมมิชชั่น').should('be.visible');
    cy.contains('อัตราเริ่มต้นทั้งแพลตฟอร์ม').should('be.visible');
    cy.contains('Pokémon').should('be.visible');

    // 5. Admin Reviews Moderation (/admin/reviews)
    const mockReview = {
      id: 401,
      sellerOrderId: 101,
      rating: 5,
      title: 'ประทับใจมาก',
      comment: 'จัดส่งไวมาก แพ็คดีเยี่ยม',
      replyComment: null,
      visible: true,
      createdAt: '2026-10-15T10:00:00Z',
      reviewerUsername: 'buyer1',
      reviewerAvatarUrl: null,
    };

    cy.intercept('GET', '**/api/v1/u/cardseller*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          username: 'cardseller',
          displayName: 'Card Kingdom',
          avatarUrl: null,
        },
      },
    }).as('getSellerPublicProfile');

    cy.intercept('GET', '**/api/v1/admin/reviews*', {
      statusCode: 200,
      body: {
        success: true,
        data: [mockReview],
      },
    }).as('getAdminReviews');

    cy.intercept('PUT', '**/api/v1/admin/reviews/401/visibility*', {
      statusCode: 200,
      body: {
        success: true,
        data: { ...mockReview, visible: false, repliedAt: null },
      },
    }).as('toggleReviewVisibility');

    visitAuthenticated('/admin/reviews?seller=cardseller');
    cy.wait('@getAdminReviews');
    cy.contains('h1', 'จัดการรีวิว').should('be.visible');
    cy.contains('จัดส่งไวมาก แพ็คดีเยี่ยม').should('be.visible');
    cy.get('[role="switch"]').first().click();
    cy.wait('@toggleReviewVisibility').its('request.body').should('deep.equal', { visible: false });
  });
});



