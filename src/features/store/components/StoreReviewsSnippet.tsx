import { ArrowRight, Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ReviewStars } from "@/features/finance/ReviewStars";
import type { PublicReview, PublicReviews } from "@/features/finance/after-sales.types";
import { formatReviewDate, getInitials } from "../store.format";

export type StoreReviewsSnippetProps = {
  summary: PublicReviews["summary"];
  reviews: PublicReview[];
  onViewAll: () => void;
};

export function StoreReviewsSnippet({
  summary,
  reviews,
  onViewAll,
}: StoreReviewsSnippetProps) {
  if (!summary || summary.ratingCount === 0) {
    return null;
  }

  const { ratingCount, ratingAvg, count5, count4, count3, count2, count1 } = summary;
  const distribution = [
    { star: 5, count: count5 },
    { star: 4, count: count4 },
    { star: 3, count: count3 },
    { star: 2, count: count2 },
    { star: 1, count: count1 },
  ];

  const latestReviews = reviews.slice(0, 2);

  return (
    <section
      aria-label="ผู้ซื้อพูดถึงร้านนี้"
      className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">ผู้ซื้อพูดถึงร้านนี้</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            รีวิวจากคำสั่งซื้อที่เสร็จสมบูรณ์แล้วเท่านั้น
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary gap-1 font-medium"
          onClick={onViewAll}
        >
          ดูรีวิวทั้งหมด ({ratingCount}) <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* Content Grid */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Left: Summary score & breakdown */}
        <div className="flex w-full flex-col justify-between rounded-xl bg-muted/40 p-4 lg:w-[260px] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold text-foreground">
              {ratingAvg.toFixed(1)}
            </span>
            <div className="flex flex-col">
              <ReviewStars rating={ratingAvg} />
              <span className="text-xs text-muted-foreground mt-0.5">
                จาก {ratingCount} รีวิว
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {distribution.map(({ star, count }) => {
              const pct = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 text-muted-foreground">{star}</span>
                  <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Up to 2 snippet cards */}
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          {latestReviews.map((review) => {
            const initials = getInitials(review.reviewerUsername);
            return (
              <div
                key={review.id}
                className="flex flex-col justify-between rounded-xl border border-border/80 bg-background p-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          @{review.reviewerUsername}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatReviewDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <ReviewStars rating={review.rating} />
                  </div>

                  {review.title && (
                    <h4 className="mt-2 text-xs font-bold text-foreground line-clamp-1">
                      {review.title}
                    </h4>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
