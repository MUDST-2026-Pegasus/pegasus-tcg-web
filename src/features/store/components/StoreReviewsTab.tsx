import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Check, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListRowsSkeleton } from "@/components/common/PageSkeletons";
import { ReviewStars } from "@/features/finance/ReviewStars";
import type { PublicReview, PublicReviews } from "@/features/finance/after-sales.types";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatReviewDate, getInitials } from "../store.format";

export type StoreReviewsTabProps = {
  summary: PublicReviews["summary"];
  reviews: PublicReview[];
  positivePercent: number | null;
  isPending?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
};

type FilterChip = "ALL" | 5 | 4 | 3 | 2 | 1 | "REPLIED";

export function StoreReviewsTab({
  summary,
  reviews,
  positivePercent,
  isPending = false,
  isError = false,
  error,
  onRetry,
}: StoreReviewsTabProps) {
  const [filter, setFilter] = useState<FilterChip>("ALL");
  const [displayLimit, setDisplayLimit] = useState(4);

  const ratingCount = summary?.ratingCount ?? 0;
  const ratingAvg = summary?.ratingAvg ?? 0;
  const count5 = summary?.count5 ?? 0;
  const count4 = summary?.count4 ?? 0;
  const count3 = summary?.count3 ?? 0;
  const count2 = summary?.count2 ?? 0;
  const count1 = summary?.count1 ?? 0;

  const replyCount = useMemo(
    () => reviews.filter((r) => Boolean(r.replyComment?.trim())).length,
    [reviews],
  );

  const filteredReviews = useMemo(() => {
    switch (filter) {
      case "REPLIED":
        return reviews.filter((r) => Boolean(r.replyComment?.trim()));
      case 5:
      case 4:
      case 3:
      case 2:
      case 1:
        return reviews.filter((r) => r.rating === filter);
      case "ALL":
      default:
        return reviews;
    }
  }, [reviews, filter]);

  const visibleReviews = filteredReviews.slice(0, displayLimit);
  const remainingCount = filteredReviews.length - displayLimit;

  const distribution = [
    { star: 5, count: count5 },
    { star: 4, count: count4 },
    { star: 3, count: count3 },
    { star: 2, count: count2 },
    { star: 1, count: count1 },
  ];

  const filterOptions: Array<{ key: FilterChip; label: string; count: number }> = [
    { key: "ALL", label: "ทั้งหมด", count: ratingCount },
    { key: 5, label: "5 ดาว", count: count5 },
    { key: 4, label: "4 ดาว", count: count4 },
    { key: 3, label: "3 ดาว", count: count3 },
    { key: 2, label: "2 ดาว", count: count2 },
    { key: 1, label: "1 ดาว", count: count1 },
    { key: "REPLIED", label: "มีการตอบกลับ", count: replyCount },
  ];

  if (isPending) {
    return (
      <div role="status" aria-busy="true" aria-label="กำลังโหลดรีวิว" className="space-y-4">
        <ListRowsSkeleton rows={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-border/80 bg-card p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          {getErrorMessage(error, "โหลดรีวิวไม่สำเร็จ")}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            ลองอีกครั้ง
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Left Column: Score Summary Card */}
      <div className="w-full lg:w-[340px] shrink-0 space-y-3">
        <h2 className="text-lg font-bold text-foreground">คะแนนร้านค้า</h2>

        <div className="space-y-5 rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
          {/* Top Score Box */}
          <div className="space-y-2 rounded-xl bg-primary/5 p-6 text-center">
            <p className="text-3xl font-extrabold text-foreground">
              {ratingCount > 0 ? ratingAvg.toFixed(1) : "—"}{" "}
              <span className="text-xl font-normal text-muted-foreground">/ 5</span>
            </p>
            <div className="flex justify-center">
              <ReviewStars rating={ratingAvg} starClassName="size-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              {ratingCount > 0 ? `จาก ${ratingCount} รีวิวของผู้ซื้อ` : "ยังไม่มีรีวิว"}
            </p>
          </div>

          {/* Star Breakdown Bars */}
          <div className="space-y-2">
            {distribution.map(({ star, count }) => {
              const pct = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center text-xs">
                  <span className="w-10 shrink-0 text-muted-foreground">{star} ดาว</span>
                  <div className="mx-2 h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-7 text-right tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border" />

          {/* Positive Rating Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
              {positivePercent !== null ? `${positivePercent}%` : "—"}
            </span>
            <span className="text-xs font-medium text-foreground">
              ของผู้ซื้อให้ 4–5 ดาวกับร้านนี้
            </span>
          </div>

          {/* Escrow Notice */}
          <div className="flex items-start gap-2.5 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>รีวิวทุกรายการมาจากผู้ซื้อที่คำสั่งซื้อเสร็จสมบูรณ์แล้ว</span>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl text-sm font-medium"
            nativeButton={false}
            render={<Link to="/account/orders" role="link" />}
          >
            รีวิวจากคำสั่งซื้อของฉัน
          </Button>
        </div>
      </div>

      {/* Right Column: Reviews Feed & Filters */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-foreground">รีวิวจากผู้ซื้อ</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">เรียงจากรีวิวล่าสุด</p>
        </div>

        {/* Filter Chips Row */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(({ key, label, count }) => {
            const isActive = filter === key;
            return (
              <button
                key={String(key)}
                type="button"
                onClick={() => {
                  setFilter(key);
                  setDisplayLimit(4);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-pressed={isActive}
              >
                <span>{label}</span>
                <span className="tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-card p-12 text-center text-sm text-muted-foreground">
            ยังไม่มีรีวิว
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-card p-12 text-center text-sm text-muted-foreground">
            ไม่พบรีวิวที่ตรงกับเงื่อนไข
          </div>
        ) : (
          <div className="space-y-4">
            {visibleReviews.map((review) => {
              const initials = getInitials(review.reviewerUsername);
              return (
                <article
                  key={review.id}
                  className="space-y-3.5 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            @{review.reviewerUsername}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="h-4.5 gap-1 border-emerald-200/60 bg-emerald-50/50 px-1.5 py-0 text-[11px] font-normal text-emerald-600 dark:bg-emerald-950/20"
                        >
                          <Check className="size-2.5" /> ผู้ซื้อยืนยันแล้ว
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <ReviewStars rating={review.rating} />
                      <span className="mt-1 text-xs text-muted-foreground">
                        {formatReviewDate(review.createdAt)}
                      </span>
                    </div>
                  </div>

                  {review.title && (
                    <h3 className="text-sm font-bold text-foreground">{review.title}</h3>
                  )}

                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                    {review.comment}
                  </p>

                  {/* Seller Reply Callout */}
                  {review.replyComment && (
                    <div className="space-y-1.5 rounded-xl border-l-2 border-primary bg-muted/60 p-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-primary">ร้านค้าตอบกลับ</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {formatReviewDate(review.repliedAt || review.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                        {review.replyComment}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}

            {/* Incremental Load More */}
            {remainingCount > 0 && (
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl text-sm font-medium hover:bg-muted"
                onClick={() => setDisplayLimit((prev) => prev + 4)}
              >
                แสดงรีวิวเพิ่มเติม ({remainingCount})
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
