// cypress/support/commands.ts
// Custom Cypress commands for Pegasus TCG E2E testing

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Injects session tokens into localStorage to simulate an authenticated user.
       */
      loginAs(role: "BUYER" | "SELLER" | "ADMIN", overrides?: Record<string, unknown>): Chainable<void>;

      /**
       * Sets up standard mock intercepts for catalog, cart, and authentication.
       */
      setupStandardMocks(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loginAs", (role = "BUYER", overrides = {}) => {
  const token = `mock-${role.toLowerCase()}-token`;
  const user = {
    id: role === "ADMIN" ? 1 : role === "SELLER" ? 2 : 3,
    email: `${role.toLowerCase()}@example.com`,
    username: `${role.toLowerCase()}_user`,
    displayName: `${role} User`,
    roles: [role],
    ...overrides,
  };

  cy.window().then((win) => {
    win.localStorage.setItem(
      "pegasus.auth.session",
      JSON.stringify({
        accessToken: token,
        refreshToken: `refresh-${token}`,
        accessExpiresAt: Date.now() + 3600000,
      })
    );
  });

  cy.intercept("GET", "**/api/v1/auth/me", {
    statusCode: 200,
    body: { success: true, data: user },
  }).as("meRequest");
});

Cypress.Commands.add("setupStandardMocks", () => {
  cy.intercept("GET", "**/api/v1/cart", {
    statusCode: 200,
    body: {
      success: true,
      data: {
        id: 1,
        items: [],
        totalQuantity: 0,
        itemsSubtotal: 0,
        currency: "THB",
      },
    },
  }).as("getCart");
});

export {};
