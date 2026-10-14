import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api';
import { afterSalesApi } from './after-sales.api';
import { RatingInput, ReviewStars } from './ReviewStars';

export function BuyerOrderReview({ orderId, status }: { orderId: number; status: string }) {
  const cache = useQueryClient();
  const key = ['finance', 'my-review', orderId] as const;
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
  if (review.isPending) return <p role="status">กำลังโหลดรีวิว...</p>;
  if (review.isError) return <p role="alert">โหลดรีวิวไม่สำเร็จ <Button variant="outline" size="sm" onClick={() => void review.refetch()}>ลองอีกครั้ง</Button></p>;
  if (review.data) return <div className="space-y-2 rounded-lg border p-4">
    <p className="font-medium">รีวิวที่ส่งแล้ว</p><ReviewStars rating={review.data.rating}/>
    {review.data.title && <p>{review.data.title}</p>}<p className="whitespace-pre-wrap break-words">{review.data.comment}</p>
  </div>;
  return <form className="space-y-4 rounded-lg border p-4" onSubmit={(event) => { event.preventDefault(); if (comment.trim() && !save.isPending) save.mutate(); }}>
    <h4 className="font-semibold">รีวิวผู้ขาย</h4><p className="text-xs text-muted-foreground">ให้คะแนนร้านค้าจากคำสั่งซื้อที่เสร็จสมบูรณ์ได้ 1 ครั้ง</p>
    <RatingInput value={rating} onChange={setRating} disabled={save.isPending}/>
    <Input aria-label="หัวข้อรีวิว" maxLength={150} placeholder="หัวข้อ (ไม่บังคับ)" value={title} disabled={save.isPending} onChange={(e) => setTitle(e.target.value)}/>
    <Textarea aria-label="ข้อความรีวิว" placeholder="ความคิดเห็นเกี่ยวกับร้านค้า" required value={comment} disabled={save.isPending} onChange={(e) => setComment(e.target.value)}/>
    <Button type="submit" disabled={save.isPending || !comment.trim()}>{save.isPending ? 'กำลังส่งรีวิว…' : 'ส่งรีวิว'}</Button>
  </form>;
}
