describe('Account & Profile Flow', () => {
  beforeEach(() => {
    // Setup authenticated state using API mocks
    window.localStorage.setItem('auth-storage', JSON.stringify({
      state: { session: { accessToken: 'mock-access', refreshToken: 'mock-refresh' } },
      version: 0
    }));

    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: { 
          id: '1', 
          email: 'test@example.com', 
          username: 'testuser', 
          displayName: 'John Doe',
          phone: '0812345678',
          bio: 'Hello I am a collector',
          roles: ['BUYER'] 
        }
      }
    }).as('meRequest');

    cy.intercept('PATCH', '**/users/profile', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: '1',
          displayName: 'Jane Doe', // Changed name
          phone: '0812345678',
          bio: 'Hello I am a collector',
        }
      }
    }).as('updateProfile');
  });

  it('allows user to view and open edit profile dialog', () => {
    // Assuming /account or /profile is the route for account settings
    cy.visit('/account/profile');
    cy.wait('@meRequest');

    // Should see user's display name somewhere on the page
    cy.contains('John Doe').should('be.visible');

    // Click edit profile (adjust selector based on actual button text or aria-label)
    cy.contains(/edit profile/i).click();

    // Dialog should be open
    cy.get('div[role="dialog"]').should('be.visible');
    cy.get('input[name="displayName"]').should('have.value', 'John Doe');
    cy.get('input[name="email"]').should('be.disabled').and('have.value', 'test@example.com');
  });

  it('allows user to save profile changes', () => {
    cy.visit('/account/profile');
    cy.wait('@meRequest');

    cy.contains(/edit profile/i).click();

    // Edit display name
    cy.get('input[name="displayName"]').clear().type('Jane Doe');
    
    // Save changes
    cy.get('button[type="submit"]').contains(/save changes/i).click();

    // Verify API was called
    cy.wait('@updateProfile').then((interception) => {
      expect(interception.request.body.displayName).to.equal('Jane Doe');
    });

    // Dialog should close and success toast should appear
    cy.get('div[role="dialog"]').should('not.exist');
    cy.contains(/profile updated/i).should('be.visible');
  });
});
