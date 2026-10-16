describe('Core Payment & Checkout Flow', () => {
  const mockOrderData = {
    id: 101,
    orderNumber: 'ORD-101',
    buyerId: 1,
    status: 'PENDING_PAYMENT',
    currency: 'THB',
    itemsSubtotal: 1000,
    shippingTotal: 50,
    discountTotal: 0,
    grandTotal: 1050,
    shippingAddressId: 1,
    shippingAddressSnapshot: 'Bangkok, Thailand',
    placedAt: '2026-10-01T00:00:00Z',
    paidAt: null,
    completedAt: null,
    cancelledAt: null,
    sellerOrders: [
      {
        id: 501,
        salesOrderId: 101,
        sellerProfileId: 1,
        sellerName: 'Kaiba Corp TCG',
        sellerOrderNumber: 'SO-501',
        status: 'PENDING_PAYMENT',
        itemsSubtotal: 1000,
        shippingFee: 50,
        discountAmount: 0,
        grandTotal: 1050,
        items: [
          {
            id: 1,
            productName: 'Blue-Eyes White Dragon',
            variantLabel: 'Ultra Rare',
            condition: 'Near Mint',
            unitPrice: 1000,
            quantity: 1,
            lineTotal: 1000,
            imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
          },
        ],
      },
    ],
  };

  const mockPaymentData = {
    id: 201,
    salesOrderId: 101,
    method: 'BANK_TRANSFER',
    status: 'PENDING',
    amount: 1050,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    transferAccountJson: JSON.stringify({
      accountName: 'Pegasus TCG Co., Ltd.',
      promptPayId: '081-999-8888',
    }),
    referenceCode: null,
  };

  const visitAuthenticated = (url: string) => {
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'pegasus.auth.session',
          JSON.stringify({
            accessToken: 'mock-access',
            refreshToken: 'mock-refresh',
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
        data: {
          id: 1,
          email: 'buyer@example.com',
          username: 'buyeruser',
          displayName: 'Buyer User',
          roles: ['BUYER'],
        },
      },
    }).as('getMe');

    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');
  });

  it('renders payment QR code, order details, and account info', () => {
    cy.intercept('GET', '**/api/v1/orders/101*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockOrderData,
      },
    }).as('getOrder');

    cy.intercept('POST', '**/api/v1/payments*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockPaymentData,
      },
    }).as('createPayment');

    cy.intercept('GET', '**/api/v1/payments/201*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockPaymentData,
      },
    }).as('getPayment');

    visitAuthenticated('/payment?orderId=101');

    cy.wait('@getMe');
    cy.wait('@getOrder');
    cy.wait('@createPayment');

    // Asserts page title and amount due
    cy.contains('h1', 'Secure Checkout').should('be.visible');
    cy.contains('THB 1,050.00').should('be.visible');
    cy.contains('ORD-101').should('be.visible');

    // Asserts QR Code & PromptPay merchant details
    cy.get('svg#checkout-qr-svg').should('be.visible');
    cy.contains('Pegasus TCG Co., Ltd.').should('be.visible');
    cy.contains('PromptPay ID 081-999-8888').should('be.visible');

    // Asserts order summary items
    cy.contains('Blue-Eyes White Dragon').should('be.visible');
    cy.contains('THB 1,050').should('be.visible');
  });

  it('displays payment success page with confirmed order and link to history', () => {
    cy.intercept('GET', '**/api/v1/orders/101*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...mockOrderData,
          status: 'PAID',
        },
      },
    }).as('getPaidOrder');

    cy.intercept('GET', '**/api/v1/payments/201*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...mockPaymentData,
          status: 'SUCCEEDED',
        },
      },
    }).as('getSucceededPayment');

    visitAuthenticated('/payment/success?orderId=101&paymentId=201');

    cy.wait('@getMe');
    cy.wait('@getPaidOrder');
    cy.wait('@getSucceededPayment');

    // Asserts success message and order details
    cy.contains('h1', 'Payment Successful').should('be.visible');
    cy.contains('ORD-101').should('be.visible');
    cy.contains('THB 1,050.00').should('be.visible');

    // Link to order history
    cy.contains('a', 'View Order Details')
      .should('be.visible')
      .should('have.attr', 'href', '/account/orders?orderId=101');
  });

  it('uploads payment slip, enters reference code, and submits payment for verification', () => {
    cy.intercept('GET', '**/api/v1/orders/101*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockOrderData,
      },
    }).as('getOrder');

    cy.intercept('POST', '**/api/v1/payments', {
      statusCode: 200,
      body: {
        success: true,
        data: mockPaymentData,
      },
    }).as('createPayment');

    cy.intercept('GET', '**/api/v1/payments/201*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockPaymentData,
      },
    }).as('getPayment');

    cy.intercept('POST', '**/api/v1/uploads/presign*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          uploadUrl: 'https://minio.example.com/mock-slip-upload',
          objectKey: 'payments/slip-201.jpg',
          expiresIn: 900,
        },
      },
    }).as('presignSlip');

    cy.intercept('PUT', 'https://minio.example.com/mock-slip-upload*', {
      statusCode: 200,
      body: '',
    }).as('uploadSlipToStorage');

    cy.intercept('POST', '**/api/v1/payments/201/slip*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...mockPaymentData,
          status: 'AWAITING_VERIFICATION',
          referenceCode: '202610160001',
        },
      },
    }).as('attachSlip');

    visitAuthenticated('/payment?orderId=101');

    cy.wait('@getMe');
    cy.wait('@getOrder');
    cy.wait('@createPayment');

    // Upload slip image
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('mock slip image bytes'),
        fileName: 'transfer-slip.jpg',
        mimeType: 'image/jpeg',
      },
      { force: true },
    );

    cy.wait('@presignSlip');
    cy.wait('@uploadSlipToStorage');
    cy.contains('Ready').should('be.visible');

    // Enter reference number
    cy.get('input[aria-label="เลขอ้างอิงการโอน"]').type('202610160001');

    // Submit payment for verification
    cy.contains('button', 'Submit payment for verification')
      .should('not.be.disabled')
      .click();

    cy.wait('@attachSlip').its('request.body').should('deep.equal', {
      slipImageKey: 'payments/slip-201.jpg',
      referenceCode: '202610160001',
    });

    cy.contains('ส่งหลักฐานเรียบร้อยแล้ว · รอผู้ดูแลระบบตรวจสอบ').should('be.visible');
    cy.contains('Payment Under Review').should('be.visible');
  });
});
