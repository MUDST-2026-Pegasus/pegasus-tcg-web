import type { AdminReview } from "./reviews.types";
import { formatDate, translate } from "@/lib/i18n";

export type ReviewFilter = "ALL" | "VISIBLE" | "HIDDEN" | "UNREPLIED" | "LOW";

export type ReviewCounts = {
  total: number;
  visible: number;
  hidden: number;
  unreplied: number;
  low: number;
};

/** สรุปคะแนนแบบเดียวกับ `ReviewRepository.refreshSummary` — นับเฉพาะรีวิวที่แสดงอยู่ */
export type RatingSummary = {
  count: number;
  average: number;
  /** index 0 = 1 ดาว ... index 4 = 5 ดาว */
  distribution: [number, number, number, number, number];
};

/** "13 ต.ค. 2569" / "13 Oct 2026" */
export function formatThaiDate(value: string): string {
  return formatDate(value);
}

export function isLowRating(review: AdminReview): boolean {
  return review.rating <= 2;
}

export function countReviews(reviews: AdminReview[]): ReviewCounts {
  const visible = reviews.filter((review) => review.visible).length;
  return {
    total: reviews.length,
    visible,
    hidden: reviews.length - visible,
    unreplied: reviews.filter((review) => review.replyComment == null).length,
    low: reviews.filter(isLowRating).length,
  };
}

export function summarizeRatings(reviews: AdminReview[]): RatingSummary {
  const distribution: RatingSummary["distribution"] = [0, 0, 0, 0, 0];
  let sum = 0;
  let count = 0;
  for (const review of reviews) {
    if (!review.visible || review.rating < 1 || review.rating > 5) {
      continue;
    }
    distribution[review.rating - 1] += 1;
    sum += review.rating;
    count += 1;
  }
  return { count, average: count ? Math.round((sum / count) * 100) / 100 : 0, distribution };
}

export function filterReviews(reviews: AdminReview[], filter: ReviewFilter): AdminReview[] {
  switch (filter) {
    case "VISIBLE":
      return reviews.filter((review) => review.visible);
    case "HIDDEN":
      return reviews.filter((review) => !review.visible);
    case "UNREPLIED":
      return reviews.filter((review) => review.replyComment == null);
    case "LOW":
      return reviews.filter(isLowRating);
    default:
      return reviews;
  }
}

/** ป้ายแท็บตามดีไซน์ — แท็บ "แสดงอยู่" กับ "1–2 ดาว" ไม่มีตัวเลขต่อท้าย */
export function filterLabel(filter: ReviewFilter, counts: ReviewCounts | null): string {
  const withCount = (label: string, value: number) => (counts ? `${label} (${value})` : label);
  switch (filter) {
    case "VISIBLE":
      return translate("admin", "reviews.filter.visible", "แสดงอยู่");
    case "HIDDEN":
      return withCount(translate("admin", "reviews.filter.hidden", "ซ่อนอยู่"), counts?.hidden ?? 0);
    case "UNREPLIED":
      return withCount(translate("admin", "reviews.filter.unreplied", "ยังไม่ตอบกลับ"), counts?.unreplied ?? 0);
    case "LOW":
      return translate("admin", "reviews.filter.low", "1–2 ดาว");
    default:
      return withCount(translate("admin", "reviews.filter.all", "ทั้งหมด"), counts?.total ?? 0);
  }
}

/** "4.6" — ทศนิยมหนึ่งตำแหน่งเหมือนหน้าโปรไฟล์สาธารณะ */
export function formatAverage(average: number): string {
  return average.toFixed(1);
}

// @tolgee-key {"key": "reviews.filter.visible", "ns": "admin", "defaultValue": "แสดงอยู่"}
// @tolgee-key {"key": "reviews.filter.hidden", "ns": "admin", "defaultValue": "ซ่อนอยู่"}
// @tolgee-key {"key": "reviews.filter.unreplied", "ns": "admin", "defaultValue": "ยังไม่ตอบกลับ"}
// @tolgee-key {"key": "reviews.filter.low", "ns": "admin", "defaultValue": "1–2 ดาว"}
// @tolgee-key {"key": "reviews.filter.all", "ns": "admin", "defaultValue": "ทั้งหมด"}
