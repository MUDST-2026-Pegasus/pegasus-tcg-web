describe('Core Account Addresses Flow', () => {
  const mockBuyerUser = {
    id: 1,
    email: 'buyer@pegasus.com',
    username: 'buyeruser',
    displayName: 'Buyer User',
    roles: ['BUYER'],
    status: 'ACTIVE',
    bio: null,
    phone: '0812345678',
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: null,
  };

  const initialAddress = {
    id: 1,
    userId: 1,
    label: 'Home',
    recipientName: 'Ash Ketchum',
    phone: '0812345678',
    line1: '123 Pallet Town',
    line2: null,
    subdistrict: 'Pallet',
    district: 'Kanto',
    province: 'Bangkok',
    postalCode: '10110',
    countryCode: 'TH',
    defaultShipping: true,
    defaultBilling: true,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const newAddress = {
    id: 2,
    userId: 1,
    label: 'Office',
    recipientName: 'Brock Pewter',
    phone: '0899887766',
    line1: '456 Gym Road',
    line2: 'Floor 2',
    subdistrict: 'Pewter',
    district: 'Bouldergym',
    province: 'Bangkok',
    postalCode: '10120',
    countryCode: 'TH',
    defaultShipping: false,
    defaultBilling: false,
    createdAt: '2026-01-02T00:00:00Z',
  };

  const updatedAddress = {
    ...initialAddress,
    label: 'Sweet Home',
    line1: '999 Pallet Town Central',
  };

  const visitAuthenticated = (url: string) => {
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'pegasus.auth.session',
          JSON.stringify({
            accessToken: 'mock-buyer-token',
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
        data: mockBuyerUser,
      },
    }).as('getMe');

    cy.intercept('POST', '**/api/v1/auth/refresh*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          tokens: {
            accessToken: 'mock-buyer-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
          },
        },
      },
    }).as('refreshToken');

    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');
  });

  it('lists existing addresses and allows adding a new address', () => {
    let addressesList = [initialAddress];

    cy.intercept('GET', '**/api/v1/addresses*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: addressesList,
        },
      });
    }).as('getAddresses');

    cy.intercept('POST', '**/api/v1/addresses', (req) => {
      addressesList = [initialAddress, newAddress];
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: newAddress,
        },
      });
    }).as('createAddress');

    visitAuthenticated('/account/addresses');

    cy.wait('@getMe');
    cy.wait('@getAddresses');

    cy.contains('h1', 'Address Book').should('be.visible');
    cy.contains('Ash Ketchum').should('be.visible');
    cy.contains('123 Pallet Town').should('be.visible');

    // Click Add New Address
    cy.contains('button', 'Add New Address').click();

    // Fill the dialog form
    cy.get('input#label').type('Office');
    cy.get('input#recipientName').type('Brock Pewter');
    cy.get('input#phone').type('0899887766');
    cy.get('input#line1').type('456 Gym Road');
    cy.get('input#line2').type('Floor 2');
    cy.get('input#subdistrict').type('Pewter');
    cy.get('input#district').type('Bouldergym');
    cy.get('input#province').type('Bangkok');
    cy.get('input#postalCode').type('10120');

    // Click Add Address
    cy.contains('button', /Add address/i).click();

    cy.wait('@createAddress');

    // Check newly added address appears
    cy.contains('Brock Pewter').should('be.visible');
    cy.contains('456 Gym Road').should('be.visible');
  });

  it('edits an existing address and saves changes', () => {
    let addressesList = [initialAddress];

    cy.intercept('GET', '**/api/v1/addresses*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: addressesList,
        },
      });
    }).as('getAddresses');

    cy.intercept('PUT', '**/api/v1/addresses/1', (req) => {
      addressesList = [updatedAddress];
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: updatedAddress,
        },
      });
    }).as('updateAddress');

    visitAuthenticated('/account/addresses');

    cy.wait('@getMe');
    cy.wait('@getAddresses');

    cy.contains('Ash Ketchum').should('be.visible');

    // Click Edit button on card
    cy.contains('button', 'Edit').click();

    // Update label and line1
    cy.get('input#label').clear().type('Sweet Home');
    cy.get('input#line1').clear().type('999 Pallet Town Central');

    // Save
    cy.contains('button', /Save changes/i).click();

    cy.wait('@updateAddress');

    cy.contains('Sweet Home').should('be.visible');
    cy.contains('999 Pallet Town Central').should('be.visible');
  });

  it('deletes an address after confirmation', () => {
    let addressesList = [initialAddress, newAddress];

    cy.intercept('GET', '**/api/v1/addresses*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: addressesList,
        },
      });
    }).as('getAddresses');

    cy.intercept('DELETE', '**/api/v1/addresses/2', (req) => {
      addressesList = [initialAddress];
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: null,
        },
      });
    }).as('deleteAddress');

    visitAuthenticated('/account/addresses');

    cy.wait('@getMe');
    cy.wait('@getAddresses');

    cy.contains('Brock Pewter').should('be.visible');

    // Click Delete on Brock Pewter's card
    cy.contains('Brock Pewter')
      .parents('[data-slot="card"]')
      .within(() => {
        cy.contains('button', 'Delete').click();
      });

    // Confirmation dialog
    cy.contains('Delete this address?').should('be.visible');
    cy.get('[data-slot="alert-dialog-content"]').within(() => {
      cy.contains('button', 'Delete').click();
    });

    cy.wait('@deleteAddress');

    cy.contains('Brock Pewter').should('not.exist');
  });
});
