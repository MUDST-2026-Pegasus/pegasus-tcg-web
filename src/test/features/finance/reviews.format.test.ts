import { describe, expect, it } from "vitest";
import type { PublicReview } from "@/features/finance/after-sales.types";
import { canSendReply, filterReviews, formatReviewDate, reviewCounts, reviewerInitials, reviewRating, reviewTab } from "@/features/finance/reviews.format";

const reviews: PublicReview[] = [
  { id: 1, rating: 5, title: null, comment: "A", replyComment: null, createdAt: "2026-10-15T02:12:00Z", reviewerUsername: "buyer01" },
  { id: 2, rating: 5, title: null, comment: "B", replyComment: "Thanks", createdAt: "2026-10-14T02:12:00Z", reviewerUsername: "buyer02" },
  { id: 3, rating: 1, title: null, comment: "C", replyComment: null, createdAt: "2026-10-13T02:12:00Z", reviewerUsername: "buyer03" },
];

describe("seller review formatting and filters", () => {
  it("counts tabs within the selected rating and combines filters", () => {
    expect(reviewCounts(reviews, 5)).toEqual({ all: 2, unreplied: 1, replied: 1 });
    expect(filterReviews(reviews, "unreplied", 5).map((review) => review.id)).toEqual([1]);
    expect(filterReviews(reviews, "replied", null).map((review) => review.id)).toEqual([2]);
  });
  it("validates URL filters and trims reply text", () => {
    expect(reviewTab("unreplied")).toBe("unreplied");
    expect(reviewTab("invalid")).toBe("all");
    expect(reviewRating("5")).toBe(5);
    expect(reviewRating("6")).toBeNull();
    expect(canSendReply("  \n  ")).toBe(false);
    expect(canSendReply(" ขอบคุณ ")).toBe(true);
  });
  it("formats initials and a Bangkok Buddhist calendar timestamp", () => {
    expect(reviewerInitials("buyer01")).toBe("BU");
    expect(reviewerInitials("rare_gems")).toBe("RG");
    expect(formatReviewDate("2026-10-15T02:12:00Z")).toContain("2569");
    expect(formatReviewDate("2026-10-15T02:12:00Z")).toContain("09:12");
  });
});
