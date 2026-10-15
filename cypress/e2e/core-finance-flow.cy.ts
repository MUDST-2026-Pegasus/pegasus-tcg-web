describe('Core Finance & Payout Flow', () => {
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

  const mockWallet = {
    balanceAvailable: 15000,
    balancePending: 2000,
    reservedForPayout: 1000,
    withdrawable: 12000,
    entries: {
      items: [
        {
          id: 1,
          type: 'ORDER_PAYMENT',
          direction: 'CREDIT',
          amount: 3500,
          createdAt: '2026-10-10T10:00:00Z',
        },
      ],
      totalItems: 1,
    },
  };

  const mockPayoutAccount = {
    bankName: 'กสิกรไทย (KBANK)',
    accountName: 'นาย สมชาย ขายดี',
    accountNumber: '1234567890',
  };

  const mockPayoutList = [
    {
      id: 101,
      sellerProfileId: 10,
      amount: 5000,
      currency: 'THB',
      status: 'PAID',
      requestedAt: '2026-10-05T09:00:00Z',
      approvedAt: '2026-10-05T10:00:00Z',
      paidAt: '2026-10-05T12:00:00Z',
      transferReference: 'TXN-998877',
      rejectionReason: null,
    },
  ];

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

    // Intercept auth
    cy.intercept('GET', '**/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockSellerUser,
      },
    }).as('getMe');

    // Intercept cart
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');

    // Intercept seller profile
    cy.intercept('GET', '**/api/v1/sellers/me', {
      statusCode: 200,
      body: {
        success: true,
        data: mockSellerProfile,
      },
    }).as('getSellerProfile');

    // Intercept wallet
    cy.intercept('GET', '**/api/v1/me/wallet*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockWallet,
      },
    }).as('getWallet');

    // Intercept payout account
    cy.intercept('GET', '**/api/v1/sellers/me/payout-account*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockPayoutAccount,
      },
    }).as('getPayoutAccount');

    // Intercept payout history
    cy.intercept('GET', '**/api/v1/sellers/me/payouts*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockPayoutList,
      },
    }).as('getPayouts');
  });

  it('renders wallet balance, payout account, and payout history', () => {
    visitAuthenticated('/seller/payout');

    cy.wait('@getMe');
    cy.wait('@getSellerProfile');
    cy.wait('@getWallet');
    cy.wait('@getPayoutAccount');
    cy.wait('@getPayouts');

    // Header & balance assertions
    cy.contains('h1', 'ถอนเงิน').should('be.visible');
    cy.contains('ยอดเงินพร้อมถอน').should('be.visible');
    cy.contains('12,000.00').should('be.visible');
    cy.contains('กำลังดำเนินการ').should('be.visible');
    cy.contains('รอครบกำหนด').should('be.visible');

    // Payout account assertions
    cy.contains('บัญชีรับเงิน').should('be.visible');
    cy.contains('กสิกรไทย').should('be.visible');
    cy.contains('••••7890').should('be.visible');
    cy.contains('นาย สมชาย ขายดี').should('be.visible');

    // History assertions
    cy.contains('ประวัติการถอนเงิน').should('be.visible');
    cy.contains('#101').should('be.visible');
    cy.contains('5,000.00').should('be.visible');
    cy.contains('โอนสำเร็จ').should('be.visible');
    cy.contains('TXN-998877').should('be.visible');
  });

  it('submits a payout request successfully', () => {
    cy.intercept('POST', '**/api/v1/sellers/me/payouts*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 102,
          sellerProfileId: 10,
          amount: 2500,
          currency: 'THB',
          status: 'REQUESTED',
          requestedAt: new Date().toISOString(),
          approvedAt: null,
          paidAt: null,
          transferReference: null,
          rejectionReason: null,
        },
      },
    }).as('requestPayout');

    visitAuthenticated('/seller/payout');

    cy.wait('@getWallet');

    // Automatically confirm the browser confirm dialog
    cy.on('window:confirm', () => true);

    // Open payout request modal/card
    cy.contains('button', 'ถอนเงินตอนนี้').click();
    cy.contains('ขอถอนเงิน').should('be.visible');

    // Enter payout amount
    cy.get('input[aria-label="จำนวนเงินที่ต้องการถอน"]').clear().type('2500');

    // Submit payout
    cy.contains('button', 'ยืนยันคำขอถอนเงิน').click();

    cy.wait('@requestPayout').its('request.body').should('deep.include', {
      amount: 2500,
    });

    // Check success notification
    cy.contains('ส่งคำขอถอนแล้ว').should('be.visible');
  });

  it('expands wallet transaction log', () => {
    visitAuthenticated('/seller/payout');

    cy.wait('@getWallet');

    // Click wallet movements details
    cy.contains('รายการเคลื่อนไหว Wallet').click();
    cy.contains('+฿3,500.00').should('be.visible');
  });
});
