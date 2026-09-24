describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies/local storage before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('allows a user to navigate to the login page and see the form', () => {
    cy.visit('/');
    // Assuming there's a login link in the header/navbar
    cy.contains(/log in/i).click();
    
    // URL should include /login
    cy.url().should('include', '/login');
    
    // Check if the form elements exist
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').contains(/log in/i).should('exist');
  });

  it('shows validation errors when submitting an empty form', () => {
    cy.visit('/login');
    
    cy.get('button[type="submit"]').click();
    
    // Check for validation messages
    cy.contains(/email is required/i).should('be.visible');
    cy.contains(/password is required/i).should('be.visible');
  });

  it('allows a user to navigate to the register page', () => {
    cy.visit('/login');
    
    // Click the sign up link
    cy.contains(/sign up/i).click();
    
    // URL should include /register
    cy.url().should('include', '/register');
    
    // Check if the form elements exist
    cy.get('input[name="username"]').should('exist');
    cy.get('input[name="email"]').should('exist');
  });
});
