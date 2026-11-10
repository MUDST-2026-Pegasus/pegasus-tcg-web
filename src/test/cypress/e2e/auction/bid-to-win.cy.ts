import { auctionDescribe, bid, createAuction, EXTENSION_SECONDS, login, pay, poll, secondsLeft, useShortAuctionSettings } from "./support";

auctionDescribe("Auction: bid to win", () => {
  useShortAuctionSettings();

  it("two buyers bid, a late bid extends the deadline, the auction closes and the winner pays", () => {
    createAuction().then((auction) => {
      login("buyer@example.com");
      bid(auction.id, 100);

      login("mai@example.com").then((winner) => {
        // Wait until we are inside the extension window, leaving room for the UI bid to land.
        poll(auction.id, winner, (item) => item.bidCount === 1 && secondsLeft(item) < EXTENSION_SECONDS - 5).then((before) => {
          bid(auction.id, 110);
          poll(auction.id, winner, (item) => item.bidCount === 2, 10_000).then((after) => {
            expect(after.extensionCount, "late bid extended the auction").to.be.greaterThan(before.extensionCount);
            expect(new Date(after.endsAt).getTime()).to.be.greaterThan(new Date(before.endsAt).getTime());
            expect(after.currentPrice).to.eq(110);
          });

          poll(auction.id, winner, (item) => item.status === "AWAITING_PAYMENT", (EXTENSION_SECONDS + 15) * 1000).then((closed) => {
            expect(closed.currentPrice).to.eq(110);
            expect(closed.winnerAlias, "auction ended with a winner").to.be.a("string");
          });

          cy.visit(`/auctions/${auction.id}`);
          cy.contains("คุณชนะประมูล!").should("be.visible");
          pay(auction.id, winner);
        });
      });
    });
  });
});
