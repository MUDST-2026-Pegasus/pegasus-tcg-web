// TCG-561: English smoke. With "en" stored, main pages render without Thai UI text and keep English after reload.

// Thai letters only — ฿ (U+0E3F) is the currency sign and stays in English too
const THAI = /[฀-฾เ-๿]/;

// DB content (category names, banners, product names) is out of scope [TCG-560] — blank its Thai so only UI text is checked
function scrub(v: unknown): unknown {
  if (typeof v === "string") return THAI.test(v) ? "db" : v;
  if (Array.isArray(v)) return v.map(scrub);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrub(x)]));
  return v;
}

const visitEn = (path: string) =>
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem("__tolgee_currentLanguage", "en");
    },
  });

const expectNoThai = () => {
  cy.get("html").should("have.attr", "lang", "en");
  // wait for lazy namespaces to load, then check visible text only
  cy.get("main", { timeout: 15000 }).should("be.visible");
  cy.wait(1000);
  cy.get("body").invoke("prop", "innerText").should((text: string) => {
    const hit = text.split("\n").find((line) => THAI.test(line));
    expect(hit, "line with Thai text").to.equal(undefined);
  });
};

describe("i18n EN smoke [TCG-561]", () => {
  beforeEach(() => {
    // guest — no backend needed for the session bootstrap
    cy.intercept("POST", "**/api/v1/auth/refresh", { statusCode: 401, body: { success: false } });
    cy.intercept({ method: "GET", url: "**/api/**" }, (req) => {
      req.continue((res) => {
        if (res.body && typeof res.body === "object") res.body = scrub(res.body);
      });
    });
  });

  it("keeps English after reload", () => {
    visitEn("/");
    expectNoThai();
    cy.reload();
    expectNoThai();
  });

  ["/", "/search", "/sale", "/auctions", "/login", "/register"].forEach((path) => {
    it(`has no Thai text on ${path}`, () => {
      visitEn(path);
      expectNoThai();
    });
  });
});
