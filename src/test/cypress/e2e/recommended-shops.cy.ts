describe("Recommended shops on mobile", () => {
  it("shows a draggable 280px card without widening the page", () => {
    cy.viewport(375, 812);
    cy.intercept("GET", "**/api/v1/**", { statusCode: 503, body: { success: false } });
    cy.intercept("GET", "**/api/v1/home/recommended-shops*", {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            username: "siamcardhouse",
            displayName: "Siam Card House",
            avatarUrl: null,
            ratingAvg: 4.9,
            ratingCount: 128,
            activeListingCount: 342,
            previews: [
              { listingId: 1, imageUrl: "/src/assets/home/mega-evolution-pitch-black.jpg" },
              { listingId: 2, imageUrl: "/src/assets/home/galactic-guardians-box.jpg" },
              { listingId: 3, imageUrl: "/src/assets/home/pegasus-collector-box.jpg" },
            ],
          },
          {
            username: "newshop",
            displayName: "New Shop",
            avatarUrl: null,
            ratingAvg: 0,
            ratingCount: 0,
            activeListingCount: 1,
            previews: [],
          },
        ],
      },
    }).as("recommendedShops");

    cy.visit("/");
    cy.wait("@recommendedShops");
    cy.get('section[aria-label="ร้านค้าแนะนำ"]').scrollIntoView().within(() => {
      cy.contains("Siam Card House").should("be.visible");
      cy.get('a[href="/u/siamcardhouse"]').should("have.css", "width", "280px");
    });
    cy.document().then((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(375);
    });
  });
});
