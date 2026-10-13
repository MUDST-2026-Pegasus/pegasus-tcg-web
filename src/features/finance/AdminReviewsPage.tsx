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
  const [busy, setBusy] = useState(false);
  const reviews = useQuery({ queryKey: ["finance", "admin-reviews", username], queryFn: () => afterSalesApi.adminReviews(username), enabled: !!username, retry: false });
  async function setVisible(id: number, visible: boolean) {
    if (!window.confirm(`${visible ? "แสดง" : "ซ่อน"}รีวิว #${id}?`)) return;
    setBusy(true);
    try {
      await afterSalesApi.setReviewVisibility(id, visible);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["finance", "admin-reviews", username] }),
        cache.invalidateQueries({ queryKey: ["finance", "public-reviews", username] }),
      ]);
      toast.add({ type: "success", title: "เปลี่ยนการแสดงรีวิวแล้ว" });
    }
    catch (error) { toast.add({ type: "error", title: "เปลี่ยนสถานะไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") }); }
    finally { setBusy(false); }
  }
  return <div className="space-y-5 p-6"><h1 className="text-2xl font-bold">จัดการรีวิวผู้ขาย</h1>
    <div className="flex max-w-lg gap-2"><Input aria-label="ชื่อผู้ใช้ผู้ขาย" placeholder="ชื่อผู้ใช้ผู้ขาย" value={search} onChange={(e) => setSearch(e.target.value)} /><Button disabled={!search.trim()} onClick={() => setUsername(search.trim())}>ค้นหา</Button></div>
    {reviews.isPending && username && <p>กำลังโหลด...</p>}{reviews.isError && <p role="alert">โหลดรีวิวไม่สำเร็จ <Button variant="outline" onClick={() => void reviews.refetch()}>ลองอีกครั้ง</Button></p>}
    {reviews.data?.length === 0 && <p>ไม่มีรีวิวสำหรับผู้ขายรายนี้</p>}
    {reviews.data?.map((review) => <article key={review.id} className="space-y-2 rounded border bg-white p-4">
      <p>#{review.id} · {review.rating} ดาว · @{review.reviewerUsername} · {review.visible ? "แสดงอยู่" : "ซ่อนอยู่"}</p>
      {review.title && <h2 className="font-semibold">{review.title}</h2>}
      <p>{review.comment}</p>
      <Button variant={review.visible ? "destructive" : "outline"} disabled={busy}
        onClick={() => void setVisible(review.id, !review.visible)}>{review.visible ? "ซ่อนรีวิว" : "แสดงรีวิว"}</Button>
    </article>)}
  </div>;
}
