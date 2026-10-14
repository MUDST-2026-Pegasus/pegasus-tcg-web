import { format } from "date-fns";
import { th } from "date-fns/locale";

import type { AdminReview } from "./reviews.types";

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

/** "13 ต.ค. 2569" — date-fns ยังพิมพ์ ค.ศ. ต้องบวก 543 เอง */
export function formatThaiDate(value: string): string {
  const date = new Date(value);
  return `${format(date, "d MMM", { locale: th })} ${date.getFullYear() + 543}`;
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
      return "แสดงอยู่";
    case "HIDDEN":
      return withCount("ซ่อนอยู่", counts?.hidden ?? 0);
    case "UNREPLIED":
      return withCount("ยังไม่ตอบกลับ", counts?.unreplied ?? 0);
    case "LOW":
      return "1–2 ดาว";
    default:
      return withCount("ทั้งหมด", counts?.total ?? 0);
  }
}

/** "4.6" — ทศนิยมหนึ่งตำแหน่งเหมือนหน้าโปรไฟล์สาธารณะ */
export function formatAverage(average: number): string {
  return average.toFixed(1);
}
