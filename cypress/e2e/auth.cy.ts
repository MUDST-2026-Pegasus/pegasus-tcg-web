describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('allows a user to navigate to the login page and see the form', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').contains(/log in/i).should('exist');
  });

  it('shows validation errors when submitting an empty form', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.contains(/email is required/i).should('be.visible');
    cy.contains(/password is required/i).should('be.visible');
  });

  it('allows a user to navigate to the register page', () => {
    cy.visit('/login');
    cy.contains(/sign up/i).click();
    cy.url().should('include', '/register');
    cy.get('input[name="username"]').should('exist');
    cy.get('input[name="email"]').should('exist');
  });

  it('simulates a successful login flow', () => {
    // Mock the API response for login
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
        user: { id: '1', email: 'test@example.com', roles: ['BUYER'] }
      }
    }).as('loginRequest');

    // Mock the /auth/me request that happens after login
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { id: '1', email: 'test@example.com', username: 'testuser', displayName: 'Test User', roles: ['BUYER'] }
    }).as('meRequest');

    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    
    // Should be redirected to home page
    cy.url().should('not.include', '/login');
  });
});
