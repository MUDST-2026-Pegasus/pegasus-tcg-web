/**
 * Shared helpers for the auction e2e flows [TCG-641 · QA-1].
 *
 * These specs need a real API with the BE-13 full seed and mock payments, so they
 * are skipped unless Cypress runs with `--env runAuction=true` (see
 * `scripts/test-auction-e2e.sh`, which starts a throwaway stack for them).
 */

export const auctionDescribe = Cypress.expose("runAuction") ? describe : describe.skip;

export const PASSWORD = "Password123!";
export const SELLER = "cardkingdom@example.com";
export const ADMIN = "admin@example.com";

/** Short timings so a whole flow fits in about two minutes. */
const SHORT_SETTINGS: Record<string, string> = {
  "auction.min_duration_minutes": "1",
  // Wide enough that a UI bid placed inside the window always lands before the deadline.
  "auction.extension_seconds": "30",
  // 36 seconds to pay.
  "auction.payment_hours": "0.01",
};
export const EXTENSION_SECONDS = 30;

export interface Auction {
  id: number;
  status: string;
  endsAt: string;
  currentPrice: number;
  bidCount: number;
  extensionCount: number;
  buyNowAvailable: boolean;
  winnerAlias: string | null;
}
export type CreatedAuction = Auction & { unitUid: string };

interface Envelope<T> {
  success: boolean;
  data: T;
}
interface Setting {
  key: string;
  value: string;
}
interface EligibleUnits {
  page: { items: Array<{ unitUid: string; availability: string }> };
}

const apiRoot = () => String(Cypress.expose("apiBaseUrl") || "http://localhost:8080").replace(/\/$/, "") + "/api/v1";

export function request<T>(token: string, method: string, path: string, body?: object, headers: Record<string, string> = {}): Cypress.Chainable<T> {
  return cy
    .request<Envelope<T>>({ method, url: apiRoot() + path, body, headers: { Authorization: `Bearer ${token}`, ...headers } })
    .then((response) => response.body.data) as unknown as Cypress.Chainable<T>;
}

export function apiLogin(email: string): Cypress.Chainable<string> {
  return cy
    .request<Envelope<{ tokens: { accessToken: string } }>>("POST", apiRoot() + "/auth/login", { email, password: PASSWORD })
    .then(({ body }) => body.data.tokens.accessToken) as unknown as Cypress.Chainable<string>;
}

/** Signs in through the login page and yields the access token the app received. */
export function login(email: string): Cypress.Chainable<string> {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.intercept("POST", "**/api/v1/auth/login").as("auctionLogin");
  cy.visit("/login");
  cy.get("#email").type(email);
  cy.get("#password").type(PASSWORD, { log: false });
  cy.get('button[type="submit"]').click();
  return cy.wait("@auctionLogin").then(({ response }) => {
    expect(response?.statusCode).to.eq(200);
    const token = response?.body.data.tokens.accessToken as string;
    return cy.location("pathname").should("not.eq", "/login").then(() => token);
  }) as unknown as Cypress.Chainable<string>;
}

/** Sets short auction timings through the admin API before each test and restores them after. */
export function useShortAuctionSettings() {
  let admin = "";
  let original: Setting[] = [];
  beforeEach(() => {
    apiLogin(ADMIN).then((token) => {
      admin = token;
      request<Setting[]>(admin, "GET", "/admin/settings").then((values) => {
        original = values.filter((item) => item.key in SHORT_SETTINGS);
        expect(original.map((item) => item.key)).to.have.members(Object.keys(SHORT_SETTINGS));
        Object.entries(SHORT_SETTINGS).forEach(([key, value]) => request(admin, "PUT", `/admin/settings/${key}`, { value }));
      });
    });
  });
  afterEach(() => {
    original.forEach(({ key, value }) => request(admin, "PUT", `/admin/settings/${key}`, { value }));
  });
}

type Units = EligibleUnits["page"]["items"];

/** Every card the seller could auction, across all pages (the seed seller has more than one page). */
export function sellerUnits(token: string, page = 0, seen: Units = []): Cypress.Chainable<Units> {
  return request<EligibleUnits>(token, "GET", `/sellers/me/auctions/eligible-units?size=100&page=${page}`).then(({ page: result }) => {
    const all = [...seen, ...result.items];
    return result.items.length < 100 ? cy.wrap(all, { log: false }) : sellerUnits(token, page + 1, all);
  }) as unknown as Cypress.Chainable<Units>;
}

/** Cards the seller may auction: free ones, or ones on a listing (opening the auction takes them off it). */
export const SELECTABLE = ["AVAILABLE", "LISTED"];

/** Opens an auction on one of the seller's selectable cards, closing about 65 seconds from now. */
export function createAuction(options: { buyNow?: boolean } = {}): Cypress.Chainable<CreatedAuction> {
  return apiLogin(SELLER).then((token) =>
    sellerUnits(token).then((items) => {
      const unit = items.find((item) => item.availability === "AVAILABLE") ?? items.find((item) => SELECTABLE.includes(item.availability));
      expect(unit, "seed has a card the seller can auction").not.to.eq(undefined);
      return request<Auction>(token, "POST", "/sellers/me/auctions", {
        unitUid: unit!.unitUid,
        startingPrice: 100,
        bidIncrement: 10,
        endsAt: new Date(Date.now() + 65_000).toISOString(),
        buyNowPrice: options.buyNow ? 300 : null,
        sellerNote: "TCG-641 automated QA",
      }).then((auction) => ({ ...auction, unitUid: unit!.unitUid }));
    }),
  ) as unknown as Cypress.Chainable<CreatedAuction>;
}

export function getAuction(id: number, token: string) {
  return request<Auction>(token, "GET", `/auctions/${id}`);
}

/** Re-reads the auction every half second until `accept` passes or the timeout runs out. */
export function poll(id: number, token: string, accept: (auction: Auction) => boolean, timeout = 95_000): Cypress.Chainable<Auction> {
  // The deadline starts when this command runs, not when the spec queues it.
  let deadline = 0;
  const next = (): Cypress.Chainable<Auction> =>
    getAuction(id, token).then((auction) => {
      if (accept(auction)) return cy.wrap(auction, { log: false });
      expect(Date.now(), `auction ${id} reaches the expected state in time`).to.be.lessThan(deadline);
      return cy.wait(500, { log: false }).then(next);
    });
  return cy.wrap(null, { log: false }).then(() => {
    deadline = Date.now() + timeout;
  }).then(next) as unknown as Cypress.Chainable<Auction>;
}

export const secondsLeft = (auction: Auction) => (new Date(auction.endsAt).getTime() - Date.now()) / 1000;

/** Places a bid through the auction page as whoever is signed in. */
export function bid(id: number, amount: number) {
  cy.intercept("POST", `**/api/v1/auctions/${id}/bids`).as("placedBid");
  cy.visit(`/auctions/${id}`);
  cy.contains("label", "ราคาที่จะบิด").invoke("attr", "for").then((inputId) => {
    cy.get(`#${inputId}`).clear().type(String(amount));
  });
  cy.contains("button", /^บิด THB/).click();
  cy.get('[role="alertdialog"], [role="dialog"]').within(() => cy.contains("button", /^ยืนยันบิด/).click());
  cy.wait("@placedBid").its("response.statusCode").should("be.oneOf", [200, 201]);
}

/** The winner checks out with their first address and pays through the mock gateway. */
export function pay(id: number, token: string) {
  return request<Array<{ id: number }>>(token, "GET", "/addresses").then((addresses) => {
    expect(addresses, "winner has an address").to.have.length.greaterThan(0);
    return request<{ orderId: number }>(
      token,
      "POST",
      `/auctions/${id}/checkout`,
      { shippingAddressId: addresses[0].id },
      { "Idempotency-Key": `tcg-641-${id}-${Date.now()}` },
    ).then((order) => {
      request(token, "POST", `/orders/${order.orderId}/pay`);
      return poll(id, token, (auction) => auction.status === "SOLD", 15_000);
    });
  });
}
