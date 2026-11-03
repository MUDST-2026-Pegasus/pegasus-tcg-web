import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "src/test/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "src/test/cypress/support/e2e.ts",
    fixturesFolder: "src/test/cypress/fixtures",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
  },
  screenshotsFolder: "src/test/cypress/screenshots",
  videosFolder: "src/test/cypress/videos",
  downloadsFolder: "src/test/cypress/downloads",
});
