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

// TCG-561: pin Thai before each page load so specs don't depend on a language left over from another run.
// A spec that wants English sets "en" in its own onBeforeLoad; we only fill the key when it's empty.
Cypress.on("window:before:load", (win) => {
  if (!win.localStorage.getItem("__tolgee_currentLanguage")) {
    win.localStorage.setItem("__tolgee_currentLanguage", "th");
  }
});
