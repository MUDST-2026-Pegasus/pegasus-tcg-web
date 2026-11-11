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

    cy.contains('h1', 'เติบโตไปด้วยกันกับชุมชน TCG').should('be.visible');
    cy.contains('h2', 'เรื่องราวของเรา').should('be.visible');
    cy.contains('Pegasus TCG คือพื้นที่สำหรับนักสะสม').should('be.visible');
    cy.contains('Pegasus TCG เริ่มต้นจากกลุ่มคนรักการ์ด').should('be.visible');
  });

  it('renders terms of service with legal sections and navigation', () => {
    cy.visit('/terms-of-service');

    cy.contains(/LEGAL CENTER|ศูนย์ข้อมูลกฎหมาย/).should('be.visible');
    cy.contains('h1', /Terms of Service|ข้อกำหนดการใช้บริการ/).should('be.visible');

    // Key clauses
    cy.contains(/Introduction|บทนำ/).should('be.visible');
    cy.contains(/Accounts and Registration|บัญชีผู้ใช้และการลงทะเบียน/).should('be.visible');
    cy.contains(/Products and Pricing|สินค้าและราคา/).should('be.visible');
    cy.contains(/Payment and Billing|การชำระเงินและการเรียกเก็บเงิน/).should('be.visible');
    cy.contains(/Shipping and Returns|การจัดส่งและการคืนสินค้า/).should('be.visible');
    cy.contains(/Limitation of Liability|ข้อจำกัดความรับผิด/).should('be.visible');

    // Section scroll interaction
    cy.contains('button, a', /Products and Pricing|สินค้าและราคา/).first().click();
    cy.get('#section-03').should('be.visible');
  });

  it('renders privacy policy with data protection sections', () => {
    cy.visit('/privacy-policy');

    cy.contains('h1', /Privacy Policy|นโยบายความเป็นส่วนตัว/).should('be.visible');
    cy.contains(/Information We Collect|ข้อมูลที่เราจัดเก็บ/).should('be.visible');
    cy.contains(/How We Use Your Information|วิธีการใช้ข้อมูลของคุณ/).should('be.visible');
    cy.contains(/Information Sharing|การเปิดเผยข้อมูล/).should('be.visible');
    cy.contains(/Data Security|ความปลอดภัยของข้อมูล/).should('be.visible');
    cy.contains(/Your Rights|สิทธิของคุณ/).should('be.visible');
  });

  it('navigates to legal pages via footer links', () => {
    cy.visit('/');

    cy.get('footer').scrollIntoView();
    cy.get('footer').contains('a', /Terms of Service|ข้อกำหนดการใช้บริการ/).click();
    cy.url().should('include', '/terms-of-service');
    cy.contains('h1', /Terms of Service|ข้อกำหนดการใช้บริการ/).should('be.visible');

    cy.get('footer').scrollIntoView();
    cy.get('footer').contains('a', /Privacy Policy|นโยบายความเป็นส่วนตัว/).click();
    cy.url().should('include', '/privacy-policy');
    cy.contains('h1', /Privacy Policy|นโยบายความเป็นส่วนตัว/).should('be.visible');
  });

  it('renders 404 Not Found page on unknown routes and navigates back', () => {
    cy.visit('/unknown-route-that-does-not-exist-404');

    cy.contains('ERROR 404 · ไม่พบหน้านี้').should('be.visible');
    cy.contains('h1', 'ไม่พบหน้าที่คุณกำลังหา').should('be.visible');
    cy.contains('a', 'ดูสินค้าทั้งหมด').should('have.attr', 'href', '/products');
  });
});
