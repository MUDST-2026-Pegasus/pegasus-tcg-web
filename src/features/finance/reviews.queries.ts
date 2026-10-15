/** Shared by the review form and the order card, so a review sent hides the card's Write a Review button. */
export const reviewKeys = {
  mine: (sellerOrderId: number) => ["finance", "my-review", sellerOrderId] as const,
};
