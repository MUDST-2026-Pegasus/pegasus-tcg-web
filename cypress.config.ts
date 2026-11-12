import fs from "node:fs";
import path from "node:path";
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
    setupNodeEvents(on, config) {
      config.expose = config.expose || {};
      Object.assign(config.expose, config.env);
      config.expose.nfrRunId = config.env?.nfrRunId;
      config.expose.mobile = config.env?.mobile;
      config.expose.listingId = config.env?.listingId;
      config.expose.nfrApiHost = config.env?.nfrApiHost;
      config.expose.NFR_STRICT_ASSERT = config.env?.NFR_STRICT_ASSERT === true || config.env?.NFR_STRICT_ASSERT === "true";
      config.expose.runAuction = config.env?.runAuction === true || config.env?.runAuction === "true";
      if (config.env?.runPromotions !== undefined) {
        config.expose.runPromotions = config.env.runPromotions;
      }
      if (config.env?.apiBaseUrl !== undefined) {
        config.expose.apiBaseUrl = config.env.apiBaseUrl;
      }
      if (config.env?.runLiveSearch !== undefined) {
        config.expose.runLiveSearch = config.env.runLiveSearch;
      }

      on("task", {
        getAxeSource() {
          const candidates = [
            path.resolve(".nfr-runs/axe/node_modules/axe-core/axe.min.js"),
            path.resolve("node_modules/axe-core/axe.min.js"),
          ];
          for (const p of candidates) {
            if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
          }
          const pnpmDir = path.resolve("node_modules/.pnpm");
          if (fs.existsSync(pnpmDir)) {
            try {
              const matches = fs.readdirSync(pnpmDir).filter((f) => f.startsWith("axe-core@"));
              for (const m of matches) {
                const axePath = path.join(pnpmDir, m, "node_modules/axe-core/axe.min.js");
                if (fs.existsSync(axePath)) return fs.readFileSync(axePath, "utf8");
              }
            } catch {
              // ignore directory read issues
            }
          }
          return null;
        },
      });

      return config;
    },
  },
  screenshotsFolder: "src/test/cypress/screenshots",
  videosFolder: "src/test/cypress/videos",
  downloadsFolder: "src/test/cypress/downloads",
});
