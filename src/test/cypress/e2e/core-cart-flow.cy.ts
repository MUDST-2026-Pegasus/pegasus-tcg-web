describe('Core Shopping Cart Flow', () => {
  const initialCartData = {
    id: 1,
    userId: 1,
    sessionKey: null,
    currency: 'THB',
    items: [
      {
        id: 101,
        cartId: 1,
        listingId: 1001,
        quantity: 2,
        unitPriceAtAdd: 500,
        currentPrice: 500,
        priceChanged: false,
        purchasable: true,
        quantityAvailable: 10,
        sellerProfileId: 1,
        catalogVariantId: 1,
        condition: 'NM',
        currency: 'THB',
        addedAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
        productName: 'Blue-Eyes White Dragon',
        variantLabel: 'Ultra Rare',
        sellerName: 'Kaiba Corp TCG',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
        productId: 1,
      },
      {
        id: 102,
        cartId: 1,
        listingId: 1002,
        quantity: 1,
        unitPriceAtAdd: 300,
        currentPrice: 300,
        priceChanged: false,
        purchasable: true,
        quantityAvailable: 5,
        sellerProfileId: 2,
        catalogVariantId: 2,
        condition: 'LP',
        currency: 'THB',
        addedAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
        productName: 'Dark Magician',
        variantLabel: 'Secret Rare',
        sellerName: 'Yugi Card Shop',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
        productId: 2,
      },
    ],
    totalQuantity: 3,
    itemsSubtotal: 1300,
    expiresAt: null,
  };

  /** Totals for the ticked items with no codes, like the BE when nothing is collected. */
  function stubPromotions(getCart: () => typeof initialCartData) {
    cy.intercept('GET', '**/api/v1/checkout/promotions*', {
      statusCode: 200,
      body: { success: true, data: [] },
    });
    cy.intercept('POST', '**/api/v1/checkout/promo-preview', (req) => {
      const ids: number[] = req.body.cartItemIds;
      const subtotal = getCart().items
        .filter((item) => ids.includes(item.id))
        .reduce((sum, item) => sum + item.currentPrice * item.quantity, 0);
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            sellers: [],
            itemsSubtotal: subtotal,
            shippingTotal: null,
            sellerDiscountTotal: 0,
            platformDiscountTotal: 0,
            grandTotal: subtotal,
            shippingEstimated: true,
            codes: [],
            bestPick: req.body.autoPick ? { platformCode: null, sellerCodes: {} } : null,
          },
        },
      });
    });
  }

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    cy.intercept('GET', '**/api/v1/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          email: 'buyer@example.com',
          username: 'buyeruser',
          roles: ['BUYER'],
        },
      },
    }).as('getMe');
  });

  it('renders cart items per shop with the subtotal and total before shipping', () => {
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: initialCartData,
      },
    }).as('getCart');
    stubPromotions(() => initialCartData);

    cy.visit('/cart');
    cy.wait('@getCart');

    // Verify page title
    cy.contains('h1', 'ตะกร้าสินค้า').should('be.visible');

    // Verify items
    cy.contains('Blue-Eyes White Dragon').should('be.visible');
    cy.contains('Kaiba Corp TCG').should('be.visible');
    cy.contains('Dark Magician').should('be.visible');
    cy.contains('Yugi Card Shop').should('be.visible');

    // Verify summary: 2 + 1 cards for 1300; shipping is worked out at checkout
    cy.contains('ยอดสินค้า (3 ใบ)').should('be.visible');
    cy.contains('คิดในหน้าถัดไป').should('be.visible');
    cy.get('[aria-label="ยอดรวม"]').should('contain.text', '฿1,300');

    // Checkout button should be enabled
    cy.contains('button', 'ไปชำระเงิน (3)').should('not.be.disabled');
  });

  it('toggles item selection and updates order summary calculations', () => {
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: initialCartData,
      },
    }).as('getCart');
    stubPromotions(() => initialCartData);

    cy.visit('/cart');
    cy.wait('@getCart');

    // Click "เลือกทั้งหมด" to deselect all items
    cy.contains('label', 'เลือกทั้งหมด').click();

    // Summary should show 0 cards and checkout button should be disabled
    cy.contains('ยอดสินค้า (0 ใบ)').should('be.visible');
    cy.contains('button', 'ไปชำระเงิน (0)').should('be.disabled');

    // Click "เลือกทั้งหมด" again to re-select all items
    cy.contains('label', 'เลือกทั้งหมด').click();

    // Summary should restore to 3 cards
    cy.contains('ยอดสินค้า (3 ใบ)').should('be.visible');
    cy.contains('button', 'ไปชำระเงิน (3)').should('not.be.disabled');
  });

  it('removes an item from cart and dynamically updates the cart', () => {
    let currentCart = JSON.parse(JSON.stringify(initialCartData));

    cy.intercept('GET', '**/api/v1/cart*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: currentCart,
        },
      });
    }).as('getCartDynamic');

    cy.intercept('DELETE', '**/api/v1/cart/items/102', (req) => {
      currentCart = {
        ...currentCart,
        items: currentCart.items.filter((i: { id: number }) => i.id !== 102),
        totalQuantity: 2,
        itemsSubtotal: 1000,
      };
      req.reply({
        statusCode: 200,
        body: {
          success: true,
        },
      });
    }).as('removeDarkMagician');
    stubPromotions(() => currentCart);

    cy.visit('/cart');
    cy.wait('@getCartDynamic');

    cy.contains('Dark Magician').should('be.visible');

    // Click remove on the second item (Dark Magician)
    cy.get('button[aria-label="ลบ Dark Magician"]').click();

    cy.wait('@removeDarkMagician');
    cy.wait('@getCartDynamic');

    // Dark Magician should no longer be in the cart
    cy.contains('Dark Magician').should('not.exist');
    cy.contains('Blue-Eyes White Dragon').should('be.visible');
    cy.contains('ยอดสินค้า (2 ใบ)').should('be.visible');
    cy.get('[aria-label="ยอดรวม"]').should('contain.text', '฿1,000');
  });
});
