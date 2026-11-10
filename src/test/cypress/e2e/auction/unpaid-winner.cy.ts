import { apiLogin, auctionDescribe, bid, createAuction, login, poll, request, SELLER, SELECTABLE, sellerUnits, useShortAuctionSettings } from "./support";

interface Penalty {
  strikeCount: number;
}

auctionDescribe("Auction: unpaid winner", () => {
  useShortAuctionSettings();

  it("records a strike, marks the auction UNSOLD and returns the card to the seller's stock", () => {
    createAuction().then((auction) => {
      login("nattapong@example.com").then((buyer) => {
        request<Penalty>(buyer, "GET", "/me/auctions/penalty").then((before) => {
          bid(auction.id, 100);

          poll(auction.id, buyer, (item) => item.status === "AWAITING_PAYMENT");
          // Payment window is 36 seconds; the timeout job then runs every second.
          poll(auction.id, buyer, (item) => item.status === "UNSOLD", 90_000);

          request<Penalty>(buyer, "GET", "/me/auctions/penalty").then((after) => {
            expect(after.strikeCount).to.eq(before.strikeCount + 1);
          });
          cy.visit("/account/auctions");
          cy.contains(`คุณไม่ชำระเงินภายในเวลา (${before.strikeCount + 1}/3)`).should("be.visible");

          apiLogin(SELLER).then((seller) =>
            sellerUnits(seller).then((items) => {
              // Back in stock: no longer held by the auction or its cancelled order.
              expect(items.find((item) => item.unitUid === auction.unitUid)?.availability, "card is back in stock").to.be.oneOf(SELECTABLE);
            }),
          );
        });
      });
    });
  });
});
