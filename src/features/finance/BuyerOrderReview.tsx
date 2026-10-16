import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare } from 'lucide-react';
import { TextLinesSkeleton } from '@/components/common/PageSkeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api';
import { afterSalesApi } from './after-sales.api';
import { RatingInput, ReviewStars } from './ReviewStars';
import { reviewKeys } from './reviews.queries';

export function BuyerOrderReview({ orderId, status }: { orderId: number; status: string }) {
  const cache = useQueryClient();
  const key = reviewKeys.mine(orderId);
  const review = useQuery({ queryKey: key, queryFn: () => afterSalesApi.myReview(orderId), enabled: status === 'COMPLETED' });
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const save = useMutation({
    mutationFn: () => afterSalesApi.createReview(orderId, rating, title.trim(), comment.trim()),
    onSuccess: (saved) => {
      cache.setQueryData(key, saved);
      void cache.invalidateQueries({ queryKey: ['finance', 'public-reviews'] });
      void cache.invalidateQueries({ queryKey: ['seller-dashboard'] });
      toast.add({ type: 'success', title: 'ส่งรีวิวแล้ว' });
    },
    onError: (error) => { toast.add({ type: 'error', title: getErrorMessage(error, 'ส่งรีวิวไม่สำเร็จ') }); },
  });

  if (status !== 'COMPLETED') return null;

  if (review.isPending) {
    return (
      <div role="status" aria-busy="true" aria-label="กำลังโหลดรีวิว" className="p-3">
        <TextLinesSkeleton lines={2} />
      </div>
    );
  }

  if (review.isError) {
    return (
      <div role="alert" className="flex items-center justify-between p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive">
        <span>โหลดรีวิวไม่สำเร็จ</span>
        <Button variant="outline" size="sm" onClick={() => void review.refetch()}>ลองอีกครั้ง</Button>
      </div>
    );
  }

  if (review.data) {
    return (
      <div className="space-y-2.5 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <Star className="size-4 text-amber-500 fill-amber-500" />
            รีวิวที่ส่งแล้ว
          </p>
          <ReviewStars rating={review.data.rating} />
        </div>
        {review.data.title && (
          <p className="font-medium text-xs text-foreground">{review.data.title}</p>
        )}
        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
          {review.data.comment}
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-3.5 rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs"
      onSubmit={(event) => {
        event.preventDefault();
        if (comment.trim() && !save.isPending) save.mutate();
      }}
    >
      <div className="space-y-0.5">
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
          <MessageSquare className="size-4 text-primary" />
          รีวิวผู้ขาย
        </h4>
        <p className="text-xs text-muted-foreground">
          ให้คะแนนร้านค้าจากคำสั่งซื้อที่เสร็จสมบูรณ์ได้ 1 ครั้ง
        </p>
      </div>

      <div className="pt-1">
        <RatingInput value={rating} onChange={setRating} disabled={save.isPending} />
      </div>

      <div className="space-y-1.5">
        <Input
          aria-label="หัวข้อรีวิว"
          maxLength={150}
          placeholder="หัวข้อ (ไม่บังคับ)"
          value={title}
          disabled={save.isPending}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xs rounded-lg"
        />
      </div>

      <div className="space-y-1.5">
        <Textarea
          aria-label="ข้อความรีวิว"
          placeholder="ความคิดเห็นเกี่ยวกับร้านค้า เช่น ความรวดเร็วในการจัดส่ง การแพ็กสินค้า หรือการบริการ..."
          required
          value={comment}
          disabled={save.isPending}
          onChange={(e) => setComment(e.target.value)}
          className="text-xs rounded-lg min-h-20"
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" disabled={save.isPending || !comment.trim()} className="font-medium">
          {save.isPending ? 'กำลังส่งรีวิว…' : 'ส่งรีวิว'}
        </Button>
      </div>
    </form>
  );
}
