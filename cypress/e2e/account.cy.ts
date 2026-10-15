describe('Account & Profile Flow', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/auth/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: { 
          id: 1, 
          email: 'test@example.com', 
          username: 'testuser', 
          displayName: 'John Doe',
          phone: '0812345678',
          bio: 'Hello I am a collector',
          roles: ['BUYER'],
          status: 'ACTIVE',
          avatarUrl: null,
          createdAt: '2026-01-01T00:00:00Z',
          lastLoginAt: '2026-01-01T00:00:00Z'
        }
      }
    }).as('meRequest');

    cy.intercept('GET', '**/api/v1/addresses*', {
      statusCode: 200,
      body: {
        success: true,
        data: []
      }
    }).as('addressesRequest');

    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          userId: 1,
          sessionKey: null,
          currency: 'THB',
          items: [],
          totalQuantity: 0,
          itemsSubtotal: 0,
          expiresAt: null
        }
      }
    }).as('cartRequest');

    cy.intercept('PUT', '**/api/v1/users/me*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Jane Doe', // Changed name
          phone: '0812345678',
          bio: 'Hello I am a collector',
          roles: ['BUYER'],
          status: 'ACTIVE',
          avatarUrl: null,
          createdAt: '2026-01-01T00:00:00Z',
          lastLoginAt: '2026-01-01T00:00:00Z'
        }
      }
    }).as('updateProfile');
  });

  const visitProfile = () => {
    cy.visit('/account/profile', {
      onBeforeLoad(win) {
        win.localStorage.setItem('pegasus.auth.session', JSON.stringify({
          accessToken: 'mock-access',
          refreshToken: 'mock-refresh',
          accessExpiresAt: Date.now() + 3600000
        }));
      }
    });
  };

  it('allows user to view and open edit profile dialog', () => {
    visitProfile();
    cy.wait('@meRequest');

    // Should see user's display name somewhere on the page
    cy.contains('John Doe').should('be.visible');

    // Click edit profile (adjust selector based on actual button text or aria-label)
    cy.contains(/edit profile/i).click();

    // Dialog should be open
    cy.get('[data-slot="dialog-content"]').should('be.visible');
    cy.get('input[name="displayName"]').should('have.value', 'John Doe');
    cy.get('#email').should('have.attr', 'disabled');
    cy.get('#email').should('have.value', 'test@example.com');
  });

  it('allows user to save profile changes', () => {
    visitProfile();
    cy.wait('@meRequest');

    cy.contains(/edit profile/i).click();
    cy.get('[data-slot="dialog-content"]').should('be.visible');

    // Edit display name
    cy.get('input[name="displayName"]').should('be.enabled').clear().type('Jane Doe');
    
    // Save changes
    cy.get('button[type="submit"]').contains(/save changes/i).click();

    // Verify API was called
    cy.wait('@updateProfile').then((interception) => {
      expect(interception.request.body.displayName).to.equal('Jane Doe');
    });

    // Dialog should close and success toast should appear
    cy.get('[data-slot="dialog-content"]').should('not.exist');
    cy.contains(/profile updated/i).should('be.visible');
  });
});
