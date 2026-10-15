// cypress/support/e2e.ts
// Cypress support file loaded before each E2E test run

import "./commands";

// Prevent Cypress from failing tests on uncaught ResizeObserver or benign hydration errors
Cypress.on("uncaught:exception", (err) => {
  if (
    err.message.includes("ResizeObserver loop") ||
    err.message.includes("Script error") ||
    err.message.includes("Minified React error")
  ) {
    return false;
  }
  return true;
});
