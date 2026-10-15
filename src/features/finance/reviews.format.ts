import type { PublicReview } from "./after-sales.types";

export type ReviewTab = "all" | "unreplied" | "replied";

export function reviewTab(value: string | null): ReviewTab {
  return value === "unreplied" || value === "replied" ? value : "all";
}

export function reviewRating(value: string | null): number | null {
  const rating = Number(value);
  return value !== null && Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

export function filterReviews(reviews: PublicReview[], tab: ReviewTab, rating: number | null) {
  return reviews.filter((review) => (rating === null || review.rating === rating) &&
    (tab === "all" || (tab === "unreplied" ? review.replyComment === null : review.replyComment !== null)));
}

export function reviewCounts(reviews: PublicReview[], rating: number | null) {
  const matching = reviews.filter((review) => rating === null || review.rating === rating);
  return {
    all: matching.length,
    unreplied: matching.filter((review) => review.replyComment === null).length,
    replied: matching.filter((review) => review.replyComment !== null).length,
  };
}

export function reviewerInitials(username: string) {
  const parts = username.trim().split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "?").slice(0, 2)).toUpperCase();
}

export function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Bangkok", hour12: false,
  }).format(date).replace(/,?\s+(\d{2}:\d{2})$/, " · $1");
}

export function canSendReply(value: string) {
  return value.trim().length > 0;
}
