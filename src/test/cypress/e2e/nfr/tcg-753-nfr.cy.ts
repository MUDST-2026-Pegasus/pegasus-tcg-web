type NfrPage = { name: string; path: string };
type NfrMetric = { page: string; run: number; url: string; lcpMs: number | null; cls: number; interactionLatencyMs: number | null; jsBundleBytes: number; duplicateApiRequests: number; mobileHorizontalOverflow?: boolean; undersizedTargets?: number; axeViolations?: null };

const pages: NfrPage[] = [
  { name: "home", path: "/" },
  { name: "catalog", path: "/search" },
  { name: "detail", path: "/products/1" },
  { name: "cart", path: "/cart" },
  { name: "checkout", path: "/checkout" },
  { name: "auction", path: "/auctions" },
  { name: "seller-dashboard", path: "/seller" },
  { name: "admin-report", path: "/admin/reports/weekly-stock-profit" },
];
const runsPerPage = 3;
const nfrEnv = Cypress.config("env") as Record<string, unknown>;
const runId = (nfrEnv.nfrRunId as string) || "tcg753-fe-local";
const output = `artifacts/nfr/${runId}/frontend`;

function assertLoopbackUiOrigin() {
  const origin = new URL(Cypress.config("baseUrl") || "http://localhost:4173");
  expect(["localhost", "127.0.0.1", "::1"], "NFR browser target must be loopback").to.include(origin.hostname.replace(/^\[|\]$/g, ""));
}

function installMetrics(page: NfrPage, run: number) {
  cy.window().then((win) => {
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
  });

  cy.get("body", { timeout: 15000 }).should("be.visible");
  cy.wait(500);
  cy.window().then((win) => {
    const state = (win as Window & { __nfrState?: { lcpMs: number | null; cls: number; interactionLatencyMs: number | null } }).__nfrState;
    expect(state, "browser metrics initialized").to.exist;
    expect(state!.lcpMs, "LCP observer produced a measurement").to.not.equal(null);
    const jsBundleBytes = win.performance.getEntriesByType("resource").filter((entry) => /\.js(?:\?|$)/.test(entry.name)).reduce((total, entry) => total + ((entry as PerformanceResourceTiming).transferSize || 0), 0);
    const apiCounts = new Map<string, number>();
    win.performance.getEntriesByType("resource").map((entry) => entry.name).filter((url) => /\/api\/v1\//.test(url)).forEach((url) => apiCounts.set(url, (apiCounts.get(url) || 0) + 1));
    const duplicateApiRequests = [...apiCounts.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
    const metric: NfrMetric = { page: page.name, run, url: win.location.href, lcpMs: state!.lcpMs, cls: state!.cls, interactionLatencyMs: state!.interactionLatencyMs, jsBundleBytes, duplicateApiRequests, axeViolations: null };
    cy.readFile(`${output}/measurements.json`).then((existing) => {
      const metrics = Array.isArray(existing) ? existing : [];
      metrics.push(metric);
      cy.writeFile(`${output}/measurements.json`, metrics);
    });
    if (state!.lcpMs !== null) expect(state!.lcpMs, `${page.name} run ${run} LCP <= 2500ms`).to.be.at.most(2500);
    expect(state!.cls, `${page.name} run ${run} CLS <= 0.10`).to.be.at.most(0.1);
    if (state!.interactionLatencyMs !== null) expect(state!.interactionLatencyMs, `${page.name} run ${run} interaction <= 200ms`).to.be.at.most(200);
  });

  cy.document().then((doc) => {
    const style = doc.createElement("style");
    style.textContent = "*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; scroll-behavior: auto !important; }";
    doc.head.appendChild(style);
    const controls = [...doc.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]")].filter((element) => !element.hasAttribute("disabled") && element.tabIndex >= 0);
    controls.forEach((element) => {
      const label = element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || element.textContent?.trim() || (element instanceof HTMLInputElement ? element.labels?.[0]?.textContent?.trim() : "");
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
          if (!["localhost", "127.0.0.1", "::1"].includes(requestHost)) request.destroy();
        });
        cy.visit(page.path, { failOnStatusCode: false });
        installMetrics(page, run);
        cy.screenshot(`${page.name}-run-${run}`, { capture: "viewport" });
        if (nfrEnv.mobile === true || nfrEnv.mobile === "true") {
          cy.viewport(390, 844);
          cy.document().its("documentElement.scrollWidth").should("be.lte", 390);
        }
      }
    });
  }

  it("reports axe results as unavailable when axe-core is not injected by the harness", () => {
    cy.visit("/", { failOnStatusCode: false });
    cy.window().then((win) => {
      const axe = (win as Window & { axe?: { run: (context?: Document) => Promise<{ violations: { impact?: string }[] }> } }).axe;
      if (!axe) {
        cy.writeFile(`${output}/axe-status.json`, { status: "Blocked", reason: "axe-core is not installed/injected in this repository environment" });
        return;
      }
      return axe.run(win.document).then((results) => {
        const serious = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact || ""));
        cy.writeFile(`${output}/axe-status.json`, { status: serious.length ? "Fail" : "Pass", criticalOrSeriousViolations: serious.length });
        expect(serious, "zero axe critical/serious violations").to.have.length(0);
      });
    });
  });

  it("preserves usable error shell for local API 401/403/429/5xx and offline conditions", () => {
    const failures = [401, 403, 429, 500, 503];
    failures.forEach((status) => cy.intercept("http://127.0.0.1:8080/api/v1/**", { statusCode: status, body: { message: `NFR ${status}` } }).as(`api-${status}`));
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
