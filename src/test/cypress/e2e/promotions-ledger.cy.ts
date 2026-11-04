type ApiErrorPayload = {
  code?: string;
  path?: string;
  details?: Record<string, unknown>;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  error?: { code?: string; message?: string };
};

type PromotionRecord = {
  id: number;
  code: string;
  ownerType: "PLATFORM" | "SELLER";
  claimedCount: number;
  usedCount: number;
  status: string;
  pauseReason?: string | null;
};

type CheckoutOrderResponse = {
  orderId: number;
  orderNumber: string;
  status: string;
  itemsSubtotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  sellerOrders: Array<{
    id: number;
    sellerProfileId: number;
    sellerOrderNumber: string;
    sellerName: string;
    status: string;
    itemsSubtotal: number;
    shippingFee: number;
    grandTotal: number;
    commissionAmount: number;
    sellerNetAmount: number;
    items: Array<{
      id: number;
      listingId: number;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  }>;
};

const apiRoot = () => {
  try {
    const exposed = Cypress.expose("apiBaseUrl");
    if (exposed) return String(exposed).replace(/\/$/, "");
  } catch {
    // Fallback to default local API root
  }
  return "http://localhost:8080/api/v1";
};

let clientSeq = 1;
function nextClientIp(): string {
  const index = clientSeq++;
  return `10.240.${Math.floor(index / 200) + 1}.${(index % 200) + 1}`;
}

function errorCodeOf(body: unknown): string | undefined {
  const envelope = body as { data?: ApiErrorPayload; error?: ApiErrorPayload } | undefined;
  return envelope?.data?.code ?? envelope?.error?.code;
}

function setDateTimeLocal(selector: string, value: string) {
  cy.get(selector).then(($input) => {
    const el = $input[0] as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function login(email: string): Cypress.Chainable<string> {
  const ip = nextClientIp();
  const alias = `realLogin_${clientSeq}`;
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => win.sessionStorage.clear());
  cy.intercept("POST", "**/api/v1/auth/login", (req) => {
    req.headers["X-Forwarded-For"] = ip;
  }).as(alias);
  cy.visit("/login");
  cy.get("#email").clear().type(email);
  cy.get("#password").clear().type("Password123!");
  cy.get('button[type="submit"]').click();
  return cy.wait(`@${alias}`).then(({ response }) => {
    expect(response?.statusCode).to.be.oneOf([200, 201]);
    const token = (response?.body as ApiEnvelope<{ tokens: { accessToken: string } }>).data
      .tokens.accessToken;
    return cy
      .location("pathname")
      .should("not.eq", "/login")
      .then(() => token);
  });
}

function apiLogin(email: string): Cypress.Chainable<string> {
  return cy
    .request<ApiEnvelope<{ tokens: { accessToken: string } }>>({
      method: "POST",
      url: `${apiRoot()}/auth/login`,
      headers: { "X-Forwarded-For": nextClientIp() },
      body: { email, password: "Password123!" },
    })
    .then(({ status, body }) => {
      expect(status).to.be.oneOf([200, 201]);
      return body.data.tokens.accessToken;
    });
}

function apiRequest<T>(
  token: string,
  method: string,
  path: string,
  body?: string | object | null,
  headers?: Record<string, string>,
): Cypress.Chainable<Cypress.Response<ApiEnvelope<T>>> {
  return cy.request<ApiEnvelope<T>>({
    method,
    url: `${apiRoot()}${path}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Forwarded-For": nextClientIp(),
      ...headers,
    },
    body,
    failOnStatusCode: false,
  });
}

function hitEndpointRepeatedly(
  token: string,
  ip: string,
  method: string,
  path: string,
  body: string | object | null | undefined,
  count: number,
): Cypress.Chainable<Cypress.Response<ApiEnvelope<unknown>>> {
  let last: Cypress.Response<ApiEnvelope<unknown>> | undefined;
  return cy
    .wrap(Array.from({ length: count }))
    .each(() =>
      apiRequest<unknown>(token, method, path, body, { "X-Forwarded-For": ip }).then(
        (response) => {
          last = response;
        },
      ),
    )
    .then(() => {
      if (!last) throw new Error(`No response received from ${path}`);
      return last;
    });
}

function activePromotion(
  code: string,
  options: {
    discountValue?: number;
    claimLimit?: number;
    claimRequired?: boolean;
    featuredOnHome?: boolean;
    visibility?: "PUBLIC" | "PRIVATE";
    minSpend?: number;
    usageLimitTotal?: number;
  } = {},
) {
  const now = Date.now();
  return {
    code,
    name: `TCG-565 ${code}`,
    description: "Cypress integration fixture",
    discountType: "FIXED",
    discountValue: options.discountValue ?? 50,
    maxDiscount: null,
    minSpend: options.minSpend ?? 0,
    scopeType: "ALL",
    scopeIds: [],
    visibility: options.visibility ?? "PUBLIC",
    newBuyerOnly: false,
    usageLimitTotal: options.usageLimitTotal ?? 20,
    usageLimitPerUser: 1,
    startsAt: new Date(now - 60_000).toISOString(),
    endsAt: new Date(now + 30 * 86_400_000).toISOString(),
    claimable: options.visibility !== "PRIVATE",
    claimRequired: options.claimRequired ?? false,
    claimLimit: options.claimLimit ?? 20,
    featuredOnHome: options.featuredOnHome ?? true,
    homeSort: null,
  };
}

function localDateTime(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function createPegasus10() {
  cy.intercept("POST", "**/api/v1/admin/promotions").as("createPegasusPromotion");
  cy.visit("/admin/promotions/new");
  cy.get("#promotion-code").clear().type("PEGASUS10");
  cy.get("#promotion-name").clear().type("TCG-565 Pegasus 10%");
  cy.get("#promotion-discountValue").clear().type("10");
  cy.get("#promotion-maxDiscount").clear().type("200");
  cy.get("#promotion-minSpend").clear().type("500");
  cy.get("#promotion-usageLimitTotal").clear().type("20");
  cy.get("#promotion-claimLimit").clear().type("20");
  setDateTimeLocal("#promotion-startsAt", localDateTime(new Date(Date.now() - 60_000)));
  // Ends in 14 days so SOONEST_ENDING tie-breaker prefers PEGASUS10 over POKEMON10 (+27d)
  setDateTimeLocal(
    "#promotion-endsAt",
    localDateTime(new Date(Date.now() + 14 * 86_400_000)),
  );
  cy.get("#promotion-claim-required").click({ force: true });
  cy.get("main header button").last().click();
  cy.contains("button", "เปิดใช้โค้ด").last().click();
  return cy.wait("@createPegasusPromotion").then(({ response }) => {
    expect(response?.statusCode).to.eq(201);
    expect(response?.body.data.code).to.eq("PEGASUS10");
    expect(response?.body.data.featuredOnHome).to.eq(true);
    expect(response?.body.data.claimRequired).to.eq(true);
  });
}

function createMinmin50() {
  cy.intercept("POST", "**/api/v1/sellers/me/promotions").as("createSellerPromotion");
  cy.visit("/seller/promotions");
  cy.contains("button", "สร้างโค้ดร้าน").click();
  cy.get('input[aria-label="รหัสโค้ด"]').clear().type("MINMIN50");
  cy.get('input[aria-label="ชื่อที่ลูกค้าเห็น"]').clear().type("TCG-565 Min Min discount");
  cy.get("#seller-promotion-discountValue").clear().type("50");
  cy.get("#seller-promotion-minSpend").clear().type("500");
  cy.contains('[role="dialog"] button', "สร้างโค้ด").click();
  return cy.wait("@createSellerPromotion").then(({ response }) => {
    expect(response?.statusCode).to.eq(201);
    expect(response?.body.data.code).to.eq("MINMIN50");
    expect(response?.body.data.claimable).to.eq(true);
  });
}

const isRunPromotions = (() => {
  try {
    const val = Cypress.expose("runPromotions");
    return val === true || val === "true";
  } catch {
    return false;
  }
})();
const describePromotionE2E = isRunPromotions ? describe : describe.skip;

describePromotionE2E("TCG-565 real promotion and ledger journeys", () => {
  let scenario1SellerOrderId = 0;

  beforeEach(() => {
    const testIp = nextClientIp();
    cy.intercept("**/api/v1/**", (req) => {
      if (!req.headers["X-Forwarded-For"]) {
        req.headers["X-Forwarded-For"] = testIp;
      }
    });
  });

  it("Scenario 1 & 2: admin and seller create PEGASUS10 & MINMIN50, buyer claims, cart auto-picks ฿2,980, checkouts B1 ฿3,025, pays, ships, confirms, and seller sees O1", () => {
    return login("admin@example.com")
      .then(() => createPegasus10())
      .then(() => login("tcgcorner@example.com"))
      .then(() => createMinmin50())
      .then(() => login("mai@example.com"))
      .then(() => {
        cy.intercept("GET", "**/api/v1/promotions/featured").as("featuredPromotions");
        cy.visit("/");
        cy.wait("@featuredPromotions").its("response.statusCode").should("eq", 200);
        cy.get('button[aria-label*="PEGASUS10"]').last().should("be.visible");
        cy.intercept("POST", "**/api/v1/promotions/*/claim").as("claimPegasusCode");
        cy.get('button[aria-label*="PEGASUS10"]').last().click();
        cy.wait("@claimPegasusCode").its("response.statusCode").should("eq", 200);

        cy.intercept("GET", "**/api/v1/u/tcg_corner/promotions").as("storePromotions");
        cy.visit("/u/tcg_corner");
        cy.wait("@storePromotions").its("response.statusCode").should("eq", 200);
        cy.get('button[aria-label*="MINMIN50"]').last().should("be.visible");
        cy.intercept("POST", "**/api/v1/promotions/*/claim").as("claimSellerCode");
        cy.get('button[aria-label*="MINMIN50"]').last().click();
        cy.wait("@claimSellerCode").its("response.statusCode").should("eq", 200);

        // Cart auto-picks PEGASUS10 (-฿200) and MINMIN50 (-฿50) -> ฿3,230 - ฿250 = ฿2,980
        cy.intercept("POST", "**/api/v1/checkout/promo-preview").as("cartPromoPreview");
        cy.visit("/cart");
        cy.wait("@cartPromoPreview");
        cy.get("body")
          .should("contain.text", "PEGASUS10")
          .and("contain.text", "MINMIN50")
          .and("contain.text", "฿2,980");

        // Proceed to 2-store checkout -> B1 total ฿3,025 (฿2,980 + ฿45 shipping)
        cy.contains("button", "ไปชำระเงิน").click();
        cy.url().should("include", "/checkout");
        cy.get("body")
          .should("contain.text", "PEGASUS10")
          .and("contain.text", "MINMIN50")
          .and("contain.text", "฿3,025");

        cy.intercept("POST", "**/api/v1/checkout").as("placeB1Order");
        // Stub PaymentPage's automatic payment-intent creation so mock gateway payment can settle cleanly
        cy.intercept("POST", "**/api/v1/payments", {
          statusCode: 200,
          body: { success: true, data: {} },
        });
        cy.contains("button", "สั่งซื้อและไปชำระเงิน").click();

        return cy.wait("@placeB1Order").then(({ response }) => {
          expect(response?.statusCode).to.eq(201);
          const order = (response?.body as ApiEnvelope<CheckoutOrderResponse>).data;
          expect(order.grandTotal).to.eq(3025);
          expect(order.discountTotal).to.eq(250);
          expect(order.sellerOrders).to.have.length(2);

          const tcgCornerSubOrder = order.sellerOrders.find(
            (so) => so.sellerProfileId === 3,
          );
          expect(tcgCornerSubOrder, "tcg_corner sub-order").to.not.eq(undefined);
          scenario1SellerOrderId = tcgCornerSubOrder!.id;

          return apiLogin("mai@example.com").then((freshMaiToken) =>
            apiRequest<{ status: string; grandTotal: number }>(
              freshMaiToken,
              "POST",
              `/orders/${order.orderId}/pay`,
              { gateway: "MOCK_GATEWAY" },
            ).then(({ status: payStatus, body: payBody }) => {
              expect(payStatus).to.eq(200);
              expect(payBody.data.status).to.eq("PAID");
              expect(payBody.data.grandTotal).to.eq(3025);
            }),
          );
        });
      })
      .then(() => apiLogin("tcgcorner@example.com"))
      .then((sellerToken) =>
        apiRequest(
          sellerToken,
          "POST",
          `/sellers/me/orders/${scenario1SellerOrderId}/ship`,
          {
            carrierName: "Flash Express",
            trackingNumber: "TH565000001",
          },
        ).then(({ status }) => {
          expect(status).to.eq(200);
        }),
      )
      .then(() => apiLogin("mai@example.com"))
      .then((maiToken) =>
        apiRequest(
          maiToken,
          "POST",
          `/orders/${scenario1SellerOrderId}/confirm-received`,
        ).then(({ status }) => {
          expect(status).to.eq(200);
        }),
      )
      .then(() => login("tcgcorner@example.com"))
      .then(() => {
        cy.visit(`/seller/orders/${scenario1SellerOrderId}`);
        cy.get("main")
          .should("contain.text", "ส่วนลดร้าน · MINMIN50")
          .and("contain.text", "ส่วนลด Pegasus · PEGASUS10")
          .and("contain.text", "฿775.94")
          .and("contain.text", "Pegasus ชดเชยส่วนลด")
          .and("contain.text", "+ ฿49.06")
          .and("contain.text", "คอมมิชชั่น 5% ของ ฿780")
          .and("contain.text", "− ฿39")
          .and("contain.text", "฿786");
      });
  });

  it("Scenario 7: guest claim returns home after login and records the coupon", () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.intercept("GET", "**/api/v1/promotions/featured").as("guestFeatured");
    cy.visit("/");
    cy.wait("@guestFeatured").then(({ response }) => {
      const featured = (
        response?.body as ApiEnvelope<Array<{ id: number; code: string }>>
      ).data;
      const promotion = featured.find((item) => item.code === "PEGASUS10");
      expect(promotion, "featured PEGASUS10 from the previous scenario").to.not.eq(
        undefined,
      );
      cy.get('button[aria-label*="PEGASUS10"]').last().click();
      cy.get('[role="dialog"] a[href*="/login"]').click();
      cy.url().should("include", `claim=${promotion!.id}`);
      cy.get("#email").type("nattapong@example.com");
      cy.get("#password").type("Password123!");
      cy.get('button[type="submit"]').click();
      cy.url().should(
        "eq",
        `${Cypress.config("baseUrl") || "http://localhost:5173"}/`,
      );
      cy.get("main").should("contain.text", "PEGASUS10");
      cy.visit("/account/coupons");
      cy.get("main").should("contain.text", "PEGASUS10");
    });
  });

  it("Scenario 8a: requires a claim for VIP200 typed in the cart, then collects and applies it", () => {
    return login("ton@example.com").then(() => {
      cy.intercept("POST", "**/api/v1/checkout/promo-preview", (request) => {
        if (request.body.platformCode === "VIP200") {
          request.alias = "vip200Preview";
        }
      });
      cy.intercept("POST", "**/api/v1/me/promotions/claim-by-code").as(
        "claimTypedVip200",
      );
      cy.visit("/cart", {
        onBeforeLoad(win) {
          win.sessionStorage.setItem("pegasus.checkout.promotions.manual", "1");
        },
      });
      cy.contains("button", "เลือกโค้ดส่วนลด").click();
      cy.get("#promo-code-input")
        .type("VIP200")
        .closest("form")
        .find('button[type="submit"]')
        .click();
      cy.wait("@vip200Preview").then(({ response }) => {
        const outcome = response?.body.data.codes.find(
          (item: { code: string }) => item.code === "VIP200",
        );
        expect(outcome?.status).to.eq("PROMO_NOT_CLAIMED");
      });
      cy.get('[role="dialog"] button')
        .filter((_, button) => button.textContent?.includes("เก็บแล้วใช้เลย"))
        .click();
      cy.wait("@claimTypedVip200").its("response.statusCode").should("eq", 200);
      cy.wait("@vip200Preview").then(({ response }) => {
        const outcome = response?.body.data.codes.find(
          (item: { code: string }) => item.code === "VIP200",
        );
        expect(outcome?.status).to.eq("APPLIED");
      });
    });
  });

  it("Scenario 8b: one remaining claim is awarded once and the next buyer sees sold out", () => {
    return apiLogin("admin@example.com").then((adminToken) =>
      apiRequest<PromotionRecord>(
        adminToken,
        "POST",
        "/admin/promotions",
        activePromotion("ONECLAIM", {
          claimLimit: 1,
          claimRequired: true,
        }),
      ).then(({ status, body }) => {
        expect(status).to.eq(201);
        const promotionId = body.data.id;

        return apiLogin("ton@example.com")
          .then((buyerToken) =>
            apiRequest(buyerToken, "POST", `/promotions/${promotionId}/claim`, {
              source: "HOME",
            })
              .its("status")
              .should("eq", 200),
          )
          .then(() => login("buyer@example.com"))
          .then(() => {
            cy.intercept("GET", "**/api/v1/promotions/featured").as(
              "soldOutPromotion",
            );
            cy.visit("/");
            cy.wait("@soldOutPromotion");
            cy.get('button[aria-label*="ONECLAIM"]')
              .first()
              .parent()
              .parent()
              .within(() => {
                cy.contains("button:disabled", "หมดแล้ว").should("exist");
              });
          });
      }),
    );
  });

  it("Scenario 9: lets a buyer type a private code and drops it with a notice below its minimum spend", () => {
    return apiLogin("admin@example.com")
      .then((token) =>
        apiRequest<PromotionRecord>(
          token,
          "POST",
          "/admin/promotions",
          activePromotion("PRIVATE50", {
            visibility: "PRIVATE",
            featuredOnHome: false,
            minSpend: 3000,
          }),
        ).then(({ status }) => {
          expect(status).to.eq(201);
          return login("ton@example.com");
        }),
      )
      .then(() => {
        cy.intercept("POST", "**/api/v1/checkout/promo-preview", (request) => {
          if (request.body.platformCode === "PRIVATE50") {
            request.alias = "privateCodePreview";
          }
        });
        cy.visit("/cart", {
          onBeforeLoad(win) {
            win.sessionStorage.setItem("pegasus.checkout.promotions.manual", "1");
          },
        });
        cy.contains("button", "เลือกโค้ดส่วนลด").click();
        cy.get("#promo-code-input")
          .type("PRIVATE50")
          .closest("form")
          .find('button[type="submit"]')
          .click();
        cy.wait("@privateCodePreview").then(({ response }) => {
          const outcome = response?.body.data.codes.find(
            (item: { code: string }) => item.code === "PRIVATE50",
          );
          expect(outcome?.status).to.eq("APPLIED");
        });
        cy.get('[role="dialog"] button').last().click();
        cy.get('[role="dialog"]').should("not.exist");
        cy.get('a[href="/u/pegasus_official"]')
          .closest(".rounded-xl")
          .find('[role="checkbox"]')
          .first()
          .click();
        cy.wait("@privateCodePreview").then(({ response }) => {
          const outcome = response?.body.data.codes.find(
            (item: { code: string }) => item.code === "PRIVATE50",
          );
          expect(outcome?.status).to.eq("PROMO_MIN_SPEND_NOT_MET");
        });
        cy.get('[role="status"]').should("contain.text", "PRIVATE50");
        cy.get('button[aria-label*="PRIVATE50"]').should("not.exist");
      });
  });

  it("Scenario 3: shows PROMO_PAUSED to a buyer and the pause reason to the seller", () => {
    return login("ton@example.com").then(() => {
      cy.intercept("POST", "**/api/v1/checkout/promo-preview", (request) => {
        if (Object.values(request.body.sellerCodes ?? {}).includes("CORNER100")) {
          request.alias = "pausedCornerPreview";
        }
      });
      cy.visit("/cart");
      cy.contains("button", "โค้ดร้าน").first().click();
      cy.get("#promo-code-input")
        .type("CORNER100")
        .closest("form")
        .find('button[type="submit"]')
        .click();
      cy.wait("@pausedCornerPreview").then(({ response }) => {
        const outcome = response?.body.data.codes.find(
          (item: { code: string }) => item.code === "CORNER100",
        );
        expect(outcome?.status).to.eq("PROMO_PAUSED");
      });

      return login("tcgcorner@example.com").then((token) => {
        cy.intercept("GET", "**/api/v1/sellers/me/promotions*").as(
          "sellerPromotionList",
        );
        cy.visit("/seller/promotions");
        cy.wait("@sellerPromotionList").then(({ response }) => {
          const paused = response?.body.data.page.items.find(
            (item: { code: string }) => item.code === "CORNER100",
          );
          expect(paused?.pauseReason).to.be.a("string").and.not.eq("");
          cy.get("main")
            .should("contain.text", "CORNER100")
            .and("contain.text", paused.pauseReason);
          return apiRequest(
            token,
            "POST",
            `/sellers/me/promotions/${paused.id}/resume`,
          ).then(({ status, body }) => {
            expect(status).to.eq(409);
            expect(errorCodeOf(body)).to.eq("PROMO_PAUSED");
          });
        });
      });
    });
  });

  it("Scenario 4: 1-use code taken by Buyer 1 (paid) shows PROMO_CHANGED dialog to Buyer 2 on checkout", () => {
    return apiLogin("admin@example.com")
      .then((adminToken) =>
        apiRequest<PromotionRecord>(
          adminToken,
          "POST",
          "/admin/promotions",
          activePromotion("LAST100", {
            discountValue: 100,
            minSpend: 100,
            usageLimitTotal: 1,
            featuredOnHome: false,
          }),
        ).then(({ status }) => {
          expect(status).to.eq(201);
        }),
      )
      .then(() => login("ton@example.com"))
      .then(() => {
        cy.intercept("POST", "**/api/v1/checkout/promo-preview", (req) => {
          if (req.body.platformCode === "LAST100") {
            req.alias = "buyer2Last100Preview";
          }
        });
        cy.visit("/checkout?items=6", {
          onBeforeLoad(win) {
            win.sessionStorage.setItem(
              "pegasus.checkout.promotions",
              JSON.stringify({ platformCode: "LAST100", sellerCodes: {} }),
            );
          },
        });
        cy.wait("@buyer2Last100Preview").then(({ response }) => {
          expect(response?.body.data.grandTotal).to.eq(3250);
        });
        cy.get("body").should("contain.text", "฿3,250");

        // Buyer 1 checks out and pays for LAST100 while Buyer 2 is viewing checkout
        return apiLogin("buyer@example.com")
          .then((buyer1Token) =>
            apiRequest<{ id: number; listingId: number }>(
              buyer1Token,
              "POST",
              "/cart/items",
              { listingId: 29, quantity: 1 },
            ).then(({ status: addStatus, body: cartBody }) => {
              expect(addStatus).to.be.oneOf([200, 201]);
              const addedItemId = cartBody.data.id;
              expect(addedItemId, "Buyer 1 cart item id").to.be.a("number");

              return apiRequest<CheckoutOrderResponse>(
                buyer1Token,
                "POST",
                "/checkout",
                {
                  cartItemIds: [addedItemId],
                  shippingOptionBySeller: { 1: 1 },
                  platformCode: "LAST100",
                  sellerCodes: {},
                  expectedGrandTotal: 395,
                },
                { "Idempotency-Key": `last100-${Date.now()}` },
              ).then(({ status: checkoutStatus, body: orderBody }) => {
                expect(checkoutStatus).to.eq(201);
                return apiRequest(
                  buyer1Token,
                  "POST",
                  `/orders/${orderBody.data.orderId}/pay`,
                  { gateway: "MOCK_GATEWAY" },
                ).its("status").should("eq", 200);
              });
            }),
          )
          .then(() => {
            // Buyer 2 clicks purchase and receives the PROMO_CHANGED dialog
            cy.contains("button", "สั่งซื้อและไปชำระเงิน").click();
            cy.contains('[role="dialog"]', "ยอดชำระเปลี่ยนไป").should("be.visible");
            cy.contains('[role="dialog"]', "฿3,250").should("be.visible");
            cy.contains('[role="dialog"]', "฿3,350").should("be.visible");
          });
      });
  });

  it("Scenario 5: expired/cancelled unpaid order restores promotion used_count back to 0", () => {
    let adminToken = "";
    let expirePromoId = 0;

    return apiLogin("tcgcorner@example.com")
      .then((sellerToken) =>
        apiRequest<{ page: { items: PromotionRecord[] } }>(
          sellerToken,
          "GET",
          "/sellers/me/promotions?size=50",
        ).then(({ status, body }) => {
          expect(status).to.eq(200);
          // Seeded CORNER5 was used on ploy_collects's expired order #51 and released back to 0
          const corner5 = body.data.page.items.find((p) => p.code === "CORNER5");
          expect(corner5, "seeded CORNER5").to.not.eq(undefined);
          expect(corner5!.usedCount).to.eq(0);
        }),
      )
      .then(() => apiLogin("admin@example.com"))
      .then((token) => {
        adminToken = token;
        return apiRequest<PromotionRecord>(
          adminToken,
          "POST",
          "/admin/promotions",
          activePromotion("EXPIRE50", {
            discountValue: 50,
            minSpend: 100,
            usageLimitTotal: 5,
            featuredOnHome: false,
          }),
        );
      })
      .then(({ status, body }) => {
        expect(status).to.eq(201);
        expirePromoId = body.data.id;
        expect(body.data.usedCount).to.eq(0);
        return apiLogin("buyer@example.com");
      })
      .then((buyerToken) =>
        apiRequest<{ id: number; listingId: number }>(
          buyerToken,
          "POST",
          "/cart/items",
          { listingId: 48, quantity: 1 },
        ).then(({ status: addStatus, body: cartBody }) => {
          expect(addStatus).to.be.oneOf([200, 201]);
          const itemId = cartBody.data.id;
          expect(itemId, "cart item id for listing 48").to.be.a("number");

          return apiRequest<CheckoutOrderResponse>(
            buyerToken,
            "POST",
            "/checkout",
            {
              cartItemIds: [itemId],
              shippingOptionBySeller: { 1: 1 },
              platformCode: "EXPIRE50",
              sellerCodes: {},
              expectedGrandTotal: 315,
            },
            { "Idempotency-Key": `expire50-${Date.now()}` },
          ).then(({ status: checkoutStatus, body: orderBody }) => {
            expect(checkoutStatus).to.eq(201);
            const orderId = orderBody.data.orderId;

            return apiRequest<PromotionRecord>(
              adminToken,
              "GET",
              `/admin/promotions/${expirePromoId}`,
            )
              .then(({ body: duringBody }) => {
                expect(duringBody.data.usedCount).to.eq(1);
                return apiRequest(buyerToken, "POST", `/orders/${orderId}/cancel`, {
                  reason: "Payment window expired",
                });
              })
              .then(({ status: cancelStatus }) => {
                expect(cancelStatus).to.eq(200);
                return apiRequest<PromotionRecord>(
                  adminToken,
                  "GET",
                  `/admin/promotions/${expirePromoId}`,
                );
              })
              .then(({ body: afterBody }) => {
                expect(afterBody.data.usedCount).to.eq(0);
              });
          });
        }),
      );
  });

  it("Scenario 6: partial return of a discounted order deducts the allocated discount from the refund", () => {
    let sellerOrderId = 0;
    let orderItemId = 0;
    let returnId = 0;

    return apiLogin("admin@example.com")
      .then((adminToken) =>
        apiRequest<PromotionRecord>(
          adminToken,
          "POST",
          "/admin/promotions",
          activePromotion("RETURN50", {
            discountValue: 50,
            minSpend: 100,
            featuredOnHome: false,
          }),
        ).its("status").should("eq", 201),
      )
      .then(() => apiLogin("ploy@example.com"))
      .then((ployToken) =>
        // ploy_collects cart item #4: 2 x ฿175 (฿350) from grand_line_cards (sellerProfileId=6, shipping=฿45)
        // With RETURN50 (-฿50), allocated discount is ฿50 across 2 units (฿25/unit), so 1 returned unit refunds ฿150.00
        apiRequest<CheckoutOrderResponse>(
          ployToken,
          "POST",
          "/checkout",
          {
            cartItemIds: [4],
            shippingOptionBySeller: { 6: 10 },
            platformCode: "RETURN50",
            sellerCodes: {},
            expectedGrandTotal: 345,
          },
          { "Idempotency-Key": `return50-${Date.now()}` },
        )
          .then(({ status, body }) => {
            expect(status).to.eq(201);
            sellerOrderId = body.data.sellerOrders[0].id;
            orderItemId = body.data.sellerOrders[0].items[0].id;

            return apiRequest(
              ployToken,
              "POST",
              `/orders/${body.data.orderId}/pay`,
              { gateway: "MOCK_GATEWAY" },
            );
          })
          .then(({ status: payStatus }) => {
            expect(payStatus).to.eq(200);
            return apiLogin("grandline@example.com");
          })
          .then((grandlineToken) =>
            apiRequest(
              grandlineToken,
              "POST",
              `/sellers/me/orders/${sellerOrderId}/ship`,
              {
                carrierName: "Flash Express",
                trackingNumber: "TH565000006",
              },
            )
              .then(({ status: shipStatus }) => {
                expect(shipStatus).to.eq(200);
                return apiRequest<{ id: number }>(
                  ployToken,
                  "POST",
                  `/orders/${sellerOrderId}/returns`,
                  {
                    reasonCode: "DAMAGED",
                    description: "One card has a corner ding",
                    evidenceKeys: [],
                    items: [{ orderItemId, quantity: 1 }],
                  },
                );
              })
              .then(({ status: reqStatus, body: reqBody }) => {
                expect(reqStatus).to.eq(200);
                returnId = reqBody.data.id;
                return apiRequest<
                  Array<{ id: number; refundEstimate: number; sellerOrderGrandTotal: number }>
                >(grandlineToken, "GET", "/sellers/me/returns?status=REQUESTED");
              })
              .then(({ status: queueStatus, body: queueBody }) => {
                expect(queueStatus).to.eq(200);
                const queued = queueBody.data.find((r) => r.id === returnId);
                expect(queued, "queued partial return").to.not.eq(undefined);
                expect(queued!.refundEstimate).to.eq(150);

                return apiRequest<{
                  id: number;
                  status: string;
                  resolution: string;
                  refundAmount: number;
                }>(
                  grandlineToken,
                  "POST",
                  `/sellers/me/returns/${returnId}/approve`,
                  {
                    resolution: "PARTIAL_REFUND",
                    refundAmount: null,
                    requireShipBack: false,
                  },
                );
              })
              .then(({ status: approveStatus, body: approveBody }) => {
                expect(approveStatus).to.eq(200);
                expect(approveBody.data.status).to.eq("CLOSED");
                expect(approveBody.data.resolution).to.eq("PARTIAL_REFUND");
                expect(approveBody.data.refundAmount).to.eq(150);
              }),
          ),
      );
  });

  it("PRM-13: admin ends an active code immediately", () => {
    return apiLogin("admin@example.com").then((token) =>
      apiRequest<PromotionRecord>(
        token,
        "POST",
        "/admin/promotions",
        activePromotion("ENDNOW", {
          featuredOnHome: false,
        }),
      ).then(({ status, body }) => {
        expect(status).to.eq(201);
        return apiRequest<PromotionRecord>(
          token,
          "POST",
          `/admin/promotions/${body.data.id}/end`,
        ).then(({ status: endStatus, body: ended }) => {
          expect(endStatus).to.eq(200);
          expect(ended.data.status).to.eq("EXPIRED");
        });
      }),
    );
  });

  it("api#96: keeps promotion controls unavailable to a seller without VERIFIED status", () => {
    return login("newbie@example.com").then((token) => {
      cy.visit("/seller/promotions");
      cy.get("main header button")
        .should("be.disabled")
        .then(() =>
          apiRequest(token, "POST", "/sellers/me/promotions", {
            code: "PENDING50",
            name: "Pending seller code",
            discountType: "FIXED",
            discountValue: 50,
            minSpend: 0,
            visibility: "PUBLIC",
            newBuyerOnly: false,
            usageLimitTotal: 10,
            usageLimitPerUser: 1,
            claimable: true,
            claimRequired: false,
            claimLimit: 10,
            startsAt: new Date(Date.now() - 60_000).toISOString(),
            endsAt: new Date(Date.now() + 86_400_000).toISOString(),
          }),
        )
        .then(({ status, body }) => {
          expect(status).to.eq(403);
          expect(errorCodeOf(body)).to.eq("SELLER_NOT_VERIFIED");
          cy.intercept("GET", "**/api/v1/u/newbie_shop/promotions").as(
            "pendingStorePromotions",
          );
          cy.visit("/u/newbie_shop");
          cy.wait("@pendingStorePromotions")
            .its("response.body.data")
            .should("deep.eq", []);
          cy.get("#store-promotions-title").should("not.exist");
        });
    });
  });

  it("api#96: rate limits promo preview, claim-by-code, and terms after 30 requests per minute", () => {
    return apiLogin("seller@example.com")
      .then((token1) =>
        hitEndpointRepeatedly(
          token1,
          "10.251.1.1",
          "POST",
          "/checkout/promo-preview",
          { autoPick: true },
          31,
        ),
      )
      .then((response) => {
        expect(response?.status).to.eq(429);
        expect(errorCodeOf(response?.body)).to.eq("RATE_LIMITED");
        return apiLogin("mintvault@example.com");
      })
      .then((token2) =>
        hitEndpointRepeatedly(
          token2,
          "10.251.1.2",
          "POST",
          "/me/promotions/claim-by-code",
          { code: "WELCOME100" },
          31,
        ),
      )
      .then((response) => {
        expect(response?.status).to.eq(429);
        expect(errorCodeOf(response?.body)).to.eq("RATE_LIMITED");
        return apiLogin("kanto@example.com");
      })
      .then((token3) =>
        hitEndpointRepeatedly(
          token3,
          "10.251.1.3",
          "GET",
          "/promotions/WELCOME100/terms",
          undefined,
          31,
        ),
      )
      .then((response) => {
        expect(response?.status).to.eq(429);
        expect(errorCodeOf(response?.body)).to.eq("RATE_LIMITED");
      });
  });
});
