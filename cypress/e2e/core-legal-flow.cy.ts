describe('Core Legal and About Pages Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Intercept cart for Navbar
    cy.intercept('GET', '**/api/v1/cart*', {
      statusCode: 200,
      body: {
        success: true,
        data: { id: 1, items: [], totalQuantity: 0, itemsSubtotal: 0 },
      },
    }).as('getCart');
  });

  it('renders about page with story and mission statement', () => {
    cy.visit('/about');

    cy.contains('h1', 'Empowering the TCG Community').should('be.visible');
    cy.contains('h2', 'Our Story').should('be.visible');
    cy.contains('Pegasus TCG is the premier destination').should('be.visible');
    cy.contains('What began as a passionate group').should('be.visible');
  });

  it('renders terms of service with legal sections and navigation', () => {
    cy.visit('/terms-of-service');

    cy.contains('LEGAL CENTER').should('be.visible');
    cy.contains('h1', 'Terms of Service').should('be.visible');

    // Key clauses
    cy.contains('Introduction').should('be.visible');
    cy.contains('Accounts and Registration').should('be.visible');
    cy.contains('Products and Pricing').should('be.visible');
    cy.contains('Payment and Billing').should('be.visible');
    cy.contains('Shipping and Returns').should('be.visible');
    cy.contains('Limitation of Liability').should('be.visible');

    // Section scroll interaction
    cy.contains('button, a', 'Products and Pricing').first().click();
    cy.get('#section-03').should('be.visible');
  });

  it('renders privacy policy with data protection sections', () => {
    cy.visit('/privacy-policy');

    cy.contains('h1', 'Privacy Policy').should('be.visible');
    cy.contains('Information We Collect').should('be.visible');
    cy.contains('How We Use Your Information').should('be.visible');
    cy.contains('Information Sharing').should('be.visible');
    cy.contains('Data Security').should('be.visible');
    cy.contains('Your Rights').should('be.visible');
  });

  it('navigates to legal pages via footer links', () => {
    cy.visit('/');

    cy.get('footer').scrollIntoView();
    cy.get('footer').contains('a', 'Terms of Service').click();
    cy.url().should('include', '/terms-of-service');
    cy.contains('h1', 'Terms of Service').should('be.visible');

    cy.get('footer').scrollIntoView();
    cy.get('footer').contains('a', 'Privacy Policy').click();
    cy.url().should('include', '/privacy-policy');
    cy.contains('h1', 'Privacy Policy').should('be.visible');
  });
});
