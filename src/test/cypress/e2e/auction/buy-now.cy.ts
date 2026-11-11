import { auctionDescribe, createAuction, getAuction, login, pay, useShortAuctionSettings } from "./support";

auctionDescribe("Auction: buy now", () => {
  useShortAuctionSettings();

  it("buys immediately at the buy-now price and pays", () => {
    createAuction({ buyNow: true }).then((auction) => {
      login("buyer@example.com").then((buyer) => {
        cy.intercept("POST", `**/api/v1/auctions/${auction.id}/buy-now`).as("buyNow");
        cy.visit(`/auctions/${auction.id}`);
        cy.contains("button", /^ซื้อทันที THB/).click();
        cy.get('[role="alertdialog"], [role="dialog"]').within(() => cy.contains("button", /^ซื้อทันที$/).click());
        cy.wait("@buyNow").its("response.statusCode").should("eq", 200);

        cy.location("pathname").should("eq", "/checkout");
        cy.location("search").should("include", `auction=${auction.id}`);

        getAuction(auction.id, buyer).then((won) => {
          expect(won.status).to.eq("AWAITING_PAYMENT");
          expect(won.currentPrice).to.eq(300);
          expect(won.bidCount, "buy-now is not a bid").to.eq(0);
        });
        pay(auction.id, buyer);
      });
    });
  });
});
