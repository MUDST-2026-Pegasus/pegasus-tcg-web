import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api";
import { afterSalesApi } from "./after-sales.api";

export function AdminReviewsPage() {
  const cache = useQueryClient();
  const [search, setSearch] = useState("");
  const [username, setUsername] = useState("");
  const [reviewId, setReviewId] = useState("");
  const [busy, setBusy] = useState(false);
  const reviews = useQuery({ queryKey: ["finance", "public-reviews", username], queryFn: () => afterSalesApi.publicReviews(username), enabled: !!username, retry: false });
  async function setVisible(id: number, visible: boolean) {
    if (!window.confirm(`${visible ? "แสดง" : "ซ่อน"}รีวิว #${id}?`)) return;
    setBusy(true);
    try { await afterSalesApi.setReviewVisibility(id, visible); await cache.invalidateQueries({ queryKey: ["finance", "public-reviews", username] }); toast.add({ type: "success", title: "เปลี่ยนการแสดงรีวิวแล้ว" }); }
    catch (error) { toast.add({ type: "error", title: "เปลี่ยนสถานะไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") }); }
    finally { setBusy(false); }
  }
  return <div className="space-y-5 p-6"><h1 className="text-2xl font-bold">จัดการรีวิวผู้ขาย</h1>
    <div className="flex max-w-lg gap-2"><Input aria-label="ชื่อผู้ใช้ผู้ขาย" placeholder="ชื่อผู้ใช้ผู้ขาย" value={search} onChange={(e) => setSearch(e.target.value)} /><Button disabled={!search.trim()} onClick={() => setUsername(search.trim())}>ค้นหา</Button></div>
    {reviews.isPending && username && <p>กำลังโหลด...</p>}{reviews.isError && <p role="alert">โหลดรีวิวไม่สำเร็จ</p>}
    {reviews.data?.reviews.map((review) => <article key={review.id} className="rounded border bg-white p-4"><p>#{review.id} · {review.rating} ดาว · @{review.reviewerUsername}</p><p>{review.comment}</p><Button variant="destructive" disabled={busy} onClick={() => void setVisible(review.id, false)}>ซ่อนรีวิว</Button></article>)}
    <div className="space-y-2 rounded border bg-white p-4"><h2 className="font-semibold">แสดงรีวิวที่เคยซ่อน</h2><p className="text-sm text-muted-foreground">API รายการสาธารณะแสดงเฉพาะรีวิวที่มองเห็นได้ กรุณาใส่ Review ID ที่ต้องการแสดงกลับ</p><div className="flex max-w-lg gap-2"><Input aria-label="Review ID" type="number" min="1" value={reviewId} onChange={(e) => setReviewId(e.target.value)} /><Button disabled={busy || !(Number(reviewId) > 0)} onClick={() => void setVisible(Number(reviewId), true)}>แสดงรีวิว</Button></div></div>
  </div>;
}
