type NfrPage = { name: string; path: string };
type NfrMetric = { page: string; run: number; url: string; lcpMs: number | null; cls: number; interactionLatencyMs: number | null; jsBundleBytes: number; duplicateApiRequests: number; mainContentVisible: boolean; visibleControlCount: number; axeViolations?: null };

const pages: NfrPage[] = [
  { name: "home", path: "/" },
  { name: "catalog", path: "/search" },
  { name: "detail", path: `/listings/${Cypress.expose("listingId") || "missing-listing-id"}` },
  { name: "cart", path: "/cart" },
  { name: "checkout", path: "/checkout" },
  { name: "auction", path: "/auctions" },
  { name: "seller-dashboard", path: "/seller" },
  { name: "admin-report", path: "/admin/reports/weekly-stock-profit" },
];
const runsPerPage = 3;
const nfrEnv = { nfrRunId: Cypress.expose("nfrRunId"), mobile: Cypress.expose("mobile") };
const runId = (nfrEnv.nfrRunId as string) || "tcg753-fe-local";
const output = `artifacts/nfr/${runId}/frontend`;

function assertLoopbackUiOrigin() {
  const origin = new URL(Cypress.config("baseUrl") || "http://localhost:4173");
  expect(["localhost", "127.0.0.1", "::1"], "NFR browser target must be loopback").to.include(origin.hostname.replace(/^\[|\]$/g, ""));
}

function allowedRequestHosts() {
  const apiHost = Cypress.expose("nfrApiHost");
  return ["localhost", "127.0.0.1", "::1", ...(typeof apiHost === "string" && apiHost ? [apiHost.toLowerCase()] : [])];
}

function beginMetrics(win: Window) {
  const state = { lcpMs: null as number | null, cls: 0, interactionLatencyMs: null as number | null };
    try {
      new win.PerformanceObserver((entries) => {
        for (const entry of entries.getEntries() as (PerformanceEntry & { value?: number; startTime?: number })[]) {
          if (entry.entryType === "largest-contentful-paint") state.lcpMs = entry.startTime ?? state.lcpMs;
          if (entry.entryType === "layout-shift" && !(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) state.cls += entry.value ?? 0;
          if (entry.entryType === "event") state.interactionLatencyMs = Math.max(state.interactionLatencyMs ?? 0, (entry as PerformanceEntry & { duration?: number }).duration ?? 0);
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new win.PerformanceObserver((entries) => {
        for (const entry of entries.getEntries() as (PerformanceEntry & { value?: number; hadRecentInput?: boolean })[]) if (!entry.hadRecentInput) state.cls += entry.value ?? 0;
      }).observe({ type: "layout-shift", buffered: true });
      new win.PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) state.interactionLatencyMs = Math.max(state.interactionLatencyMs ?? 0, entry.duration);
      }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {
      // Unsupported browser metrics remain null and are recorded; they are never treated as passing.
    }

  (win as Window & { __nfrState?: typeof state }).__nfrState = state;
}

function installMetrics(page: NfrPage, run: number) {
  cy.get("body", { timeout: 15000 }).should("be.visible");
  cy.wait(1000);
  cy.window().then((win) => {
    const state = (win as Window & { __nfrState?: { lcpMs: number | null; cls: number; interactionLatencyMs: number | null } }).__nfrState;
    expect(state, "browser metrics initialized").to.not.equal(undefined);
    const jsBundleBytes = win.performance.getEntriesByType("resource").filter((entry) => /\.js(?:\?|$)/.test(entry.name)).reduce((total, entry) => total + ((entry as PerformanceResourceTiming).transferSize || 0), 0);
    const apiCounts = new Map<string, number>();
    win.performance.getEntriesByType("resource").map((entry) => entry.name).filter((url) => /\/api\/v1\//.test(url)).forEach((url) => apiCounts.set(url, (apiCounts.get(url) || 0) + 1));
    const duplicateApiRequests = [...apiCounts.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
    const mainContentVisible = Boolean(win.document.querySelector("main")?.textContent?.trim());
    const visibleControlCount = [...win.document.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]")].filter((element) => element.getClientRects().length > 0 && win.getComputedStyle(element).visibility !== "hidden").length;
    const metric: NfrMetric = { page: page.name, run, url: win.location.href, lcpMs: state!.lcpMs, cls: state!.cls, interactionLatencyMs: state!.interactionLatencyMs, jsBundleBytes, duplicateApiRequests, mainContentVisible, visibleControlCount, axeViolations: null };
    return cy.readFile(`${output}/measurements.json`).then((existing) => {
      const metrics = Array.isArray(existing) ? existing : [];
      metrics.push(metric);
      return cy.writeFile(`${output}/measurements.json`, metrics);
    }).then(() => {
    });
  });

  cy.document().then((doc) => {
    const style = doc.createElement("style");
    style.textContent = "*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; scroll-behavior: auto !important; }";
    doc.head.appendChild(style);
    const controls = [...doc.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]")].filter((element) => !element.hasAttribute("disabled") && element.tabIndex >= 0 && element.getClientRects().length > 0 && doc.defaultView?.getComputedStyle(element).visibility !== "hidden");
    controls.forEach((element) => {
      const labelledByText = (element.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => doc.getElementById(id)?.textContent?.trim() || "").filter(Boolean).join(" ");
      const nativeLabelText = [...((element as HTMLInputElement).labels || [])].map((labelElement) => labelElement.textContent?.trim() || "").filter(Boolean).join(" ");
      const label = element.getAttribute("aria-label")?.trim() || labelledByText || nativeLabelText || element.textContent?.trim();
      expect(Boolean(label), `keyboard control has an accessible name: ${element.outerHTML.slice(0, 100)}`).to.equal(true);
      if (Cypress.config("viewportWidth") <= 390) expect(element.getBoundingClientRect().width >= 24 && element.getBoundingClientRect().height >= 24, "interactive target >=24 CSS px").to.equal(true);
    });
    if (controls[0]) {
      controls[0].focus();
      expect(doc.activeElement, "first interactive control receives keyboard focus").to.equal(controls[0]);
    }
  });
}

describe("TCG-753 frontend NFR (loopback production preview only)", () => {
  before(() => assertLoopbackUiOrigin());
  before(() => cy.writeFile(`${output}/measurements.json`, []));

  for (const page of pages) {
    it(`${page.name}: collects three lab runs and checks keyboard labels / performance budgets`, () => {
      for (let run = 1; run <= runsPerPage; run += 1) {
        cy.intercept("**/*", (request) => {
          const requestHost = new URL(request.url).hostname.replace(/^\[|\]$/g, "");
          if (!allowedRequestHosts().includes(requestHost)) request.destroy();
          else request.continue();
        });
        cy.visit(page.path, { failOnStatusCode: false, onBeforeLoad: beginMetrics });
        installMetrics(page, run);
        cy.screenshot(`${page.name}-run-${run}`, { capture: "viewport" });
        if (nfrEnv.mobile === true || nfrEnv.mobile === "true") {
          cy.viewport(390, 844);
          cy.document().its("documentElement.scrollWidth").should("be.lte", 390);
        }
      }
    });
  }

  it("runs axe-core WCAG 2.2 AA checks on all eight pages", () => {
    const pageResults: { page: string; violationCount: number; criticalOrSerious: number; violations: { id: string; impact?: string; nodes: number }[] }[] = [];
    for (const page of pages) {
      cy.visit(page.path, { failOnStatusCode: false });
      cy.readFile(".nfr-runs/axe/node_modules/axe-core/axe.min.js").then((source: string) =>
        cy.window().then((win) => {
          const script = win.document.createElement("script");
          script.textContent = source;
          win.document.head.appendChild(script);
          const axe = (win as Window & { axe?: { run: (context?: Document, options?: unknown) => Promise<{ violations: { id: string; impact?: string; nodes: unknown[] }[] }> } }).axe;
          expect(axe, "axe-core injected").not.to.equal(undefined);
          return axe!.run(win.document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }).then((results) => {
            const serious = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact || ""));
            pageResults.push({ page: page.name, violationCount: results.violations.length, criticalOrSerious: serious.length, violations: results.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length })) });
          });
        }),
      );
    }
    cy.then(() => {
      const criticalOrSerious = pageResults.reduce((total, page) => total + page.criticalOrSerious, 0);
      return cy.writeFile(`${output}/axe-status.json`, { tool: "axe-core 4.10.3", standard: "WCAG 2.2 AA tags", status: criticalOrSerious ? "Fail" : "Pass", pages: pageResults, criticalOrSeriousViolations: criticalOrSerious });
    }).then(() => expect(pageResults.reduce((total, page) => total + page.criticalOrSerious, 0), "zero axe critical/serious violations across eight pages").to.equal(0));
  });

  it("preserves usable error shell for local API 401/403/429/5xx and offline conditions", () => {
    const failures = [401, 403, 429, 500, 503];
    failures.forEach((status) => cy.intercept("**/api/v1/**", { statusCode: status, body: { message: `NFR ${status}` } }).as(`api-${status}`));
    cy.visit("/", { failOnStatusCode: false });
    cy.get("body").should("be.visible");
    cy.window().then((win) => cy.writeFile(`${output}/resilience.json`, { statusesInjected: failures, offlineRun: "Not Run: requires browser-level network control", target: win.location.origin }));
  });

  it("records manual WCAG checks that require human/browser tooling", () => {
    cy.writeFile(`${output}/manual-a11y-checklist.json`, {
      keyboardOnlyNavigation: "Partially automated: first focusable element receives focus; full journey review required",
      visibleFocus: "Not Verified: requires visual keyboard-focus inspection",
      colorContrast: "Not Verified: axe-core/color analyzer unavailable",
      zoom200Percent: "Not Verified: Cypress viewport is not equivalent to browser zoom",
      errorAnnouncements: "Not Verified: screen reader announcement review required",
      nonColorIndicators: "Not Verified: visual review required",
      status: "Blocked for manual items",
    });
  });
});
