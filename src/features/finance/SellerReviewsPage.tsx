import { ReviewStars } from './ReviewStars';
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth.queries";
import { getErrorMessage } from "@/lib/api";
import { afterSalesApi } from "./after-sales.api";

export function SellerReviewsPage() {
  const { user } = useAuth();
  const username = user?.username ?? "";
  const cache = useQueryClient();
  const reviews = useQuery({ queryKey: ["finance", "public-reviews", username], queryFn: () => afterSalesApi.publicReviews(username), enabled: !!username });
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  async function reply(id: number) {
    setBusy(id);
    try { await afterSalesApi.replyReview(id, replies[id].trim()); await cache.invalidateQueries({ queryKey: ["finance", "public-reviews", username] }); toast.add({ type: "success", title: "ตอบรีวิวแล้ว" }); }
    catch (error) { toast.add({ type: "error", title: "ตอบรีวิวไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") }); }
    finally { setBusy(null); }
  }
  return <div className="space-y-4 p-6"><h1 className="text-2xl font-bold">รีวิวร้านค้า</h1>
    {reviews.isPending && <p>กำลังโหลด...</p>}{reviews.isError && <p role="alert">โหลดรีวิวไม่สำเร็จ <Button variant="outline" onClick={() => void reviews.refetch()}>ลองอีกครั้ง</Button></p>}
    {reviews.data && <div className="flex flex-wrap items-center gap-3">
      <ReviewStars rating={reviews.data.summary?.ratingAvg ?? 0}/>
      <p>คะแนนเฉลี่ย {reviews.data.summary?.ratingAvg ?? '—'} / 5 · {reviews.data.summary?.ratingCount ?? 0} รีวิว</p>
    </div>}
    {reviews.data?.reviews.length === 0 && <p>ยังไม่มีรีวิว</p>}
    {reviews.data?.reviews.map((review) => <article key={review.id} className="space-y-2 rounded border bg-white p-4"><ReviewStars rating={review.rating}/>{review.title?.trim() && <h2 className="font-semibold">{review.title}</h2>}<p>{review.comment}</p><p className="text-sm text-muted-foreground">@{review.reviewerUsername}</p>
      {review.replyComment ? <p>คำตอบของคุณ: {review.replyComment}</p> : <div className="flex gap-2"><Input aria-label={`ตอบรีวิว ${review.id}`} placeholder="ตอบรีวิว" value={replies[review.id] ?? ""} onChange={(e) => setReplies((old) => ({ ...old, [review.id]: e.target.value }))} /><Button disabled={busy === review.id || !replies[review.id]?.trim()} onClick={() => void reply(review.id)}>ตอบ</Button></div>}
    </article>)}
  </div>;
}
