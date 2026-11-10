import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ListRowsSkeleton } from '@/components/common/PageSkeletons';
import { Button } from '@/components/ui/button';
import { hasErrorCode } from '@/lib/api';
import { afterSalesApi } from './after-sales.api';
import { ReviewStars } from './ReviewStars';
import { translateError, useTranslate } from "@/lib/i18n";

export function PublicSellerReviews({ username }: { username: string }) {
  const { t } = useTranslate("common");
  const reviews = useQuery({ queryKey: ['finance', 'public-reviews', username], queryFn: () => afterSalesApi.publicReviews(username), enabled: !!username, retry: false });
  const notSeller = reviews.isError && hasErrorCode(reviews.error, 'SELLER_NOT_FOUND');
  return <section className="space-y-4 rounded-xl border bg-card p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">{t("publicSellerReviews.title", "รีวิวร้านค้า")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("publicSellerReviews.subtitle", "ผู้ซื้อให้คะแนนได้หลังคำสั่งซื้อเสร็จสมบูรณ์")}</p>
      </div>
      <Button nativeButton={false} variant="outline" size="sm" render={<Link to="/account/orders" role="link"/>}>
        {t("publicSellerReviews.reviewFromMyOrders", "รีวิวจากคำสั่งซื้อของฉัน")}
      </Button>
    </div>
    {reviews.isPending && <div role="status" aria-busy="true" aria-label={t("publicSellerReviews.loadingAria", "กำลังโหลดรีวิว")}><ListRowsSkeleton rows={3} /></div>}
    {reviews.isError && !notSeller && (
      <p role="alert">
        {translateError(reviews.error, t("publicSellerReviews.loadFailed", "โหลดรีวิวไม่สำเร็จ"))}{" "}
        <Button variant="outline" size="sm" onClick={() => void reviews.refetch()}>{t("actions.retry", "ลองอีกครั้ง")}</Button>
      </p>
    )}
    {notSeller && <p className="text-muted-foreground">{t("publicSellerReviews.noSellerReviews", "บัญชีนี้ยังไม่มีรีวิวร้านค้า")}</p>}
    {reviews.data && <>
      <div className="flex flex-wrap items-center gap-3">
        <ReviewStars rating={reviews.data.summary?.ratingAvg ?? 0}/>
        <p>{t("publicSellerReviews.ratingSummary", "คะแนนเฉลี่ย {average} / 5 จาก {count} รีวิว", { average: reviews.data.summary?.ratingAvg ?? '—', count: reviews.data.summary?.ratingCount ?? 0 })}</p>
      </div>
      {reviews.data.reviews.length === 0 && <p className="text-muted-foreground">{t("publicSellerReviews.empty", "ยังไม่มีรีวิว")}</p>}
      {reviews.data.reviews.map((review) => (
        <article key={review.id} className="space-y-2 border-t pt-4">
          <ReviewStars rating={review.rating}/>
          {review.title && <h3 className="font-semibold">{review.title}</h3>}
          <p className="whitespace-pre-wrap break-words">{review.comment}</p>
          <p className="text-xs text-muted-foreground">@{review.reviewerUsername}</p>
          {review.replyComment && (
            <p className="rounded bg-muted p-3">
              {t("publicSellerReviews.sellerReply", "ผู้ขายตอบ: {reply}", { reply: review.replyComment })}
            </p>
          )}
        </article>
      ))}
    </>}
  </section>;
}
