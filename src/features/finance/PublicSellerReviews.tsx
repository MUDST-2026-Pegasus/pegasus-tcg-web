import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { afterSalesApi } from "./after-sales.api";

export function PublicSellerReviews({ username }: { username: string }) {
  const reviews = useQuery({ queryKey: ["finance", "public-reviews", username], queryFn: () => afterSalesApi.publicReviews(username), enabled: !!username, retry: false });
  return <section className="space-y-3 rounded-xl border bg-white p-6">
    <h2 className="text-xl font-semibold">รีวิวผู้ขาย</h2>
    {reviews.isPending && <p>กำลังโหลดรีวิว...</p>}
    {reviews.isError && <p role="alert">ไม่พบรีวิวผู้ขายสำหรับบัญชีนี้ <Button variant="outline" size="sm" onClick={() => void reviews.refetch()}>ลองอีกครั้ง</Button></p>}
    {reviews.data && <><p>คะแนนเฉลี่ย {reviews.data.summary?.ratingAvg ?? 0} / 5 จาก {reviews.data.summary?.ratingCount ?? 0} รีวิว</p>
      {reviews.data.reviews.length === 0 && <p>ยังไม่มีรีวิว</p>}
      {reviews.data.reviews.map((review) => <article key={review.id} className="space-y-1 border-t pt-3"><p className="font-medium">{review.rating} ดาว · {review.title || "รีวิว"}</p><p>{review.comment}</p><p className="text-sm text-muted-foreground">@{review.reviewerUsername}</p>{review.replyComment && <p className="rounded bg-muted p-2">ผู้ขายตอบ: {review.replyComment}</p>}</article>)}
    </>}
  </section>;
}
