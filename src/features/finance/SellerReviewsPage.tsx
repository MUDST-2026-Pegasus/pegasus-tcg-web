import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth.queries";
import { dashboardKeys, useSellerDashboard } from "@/features/seller/dashboard/dashboard.queries";
import { getErrorMessage, hasErrorCode, isApiError } from "@/lib/api";
import { afterSalesApi } from "./after-sales.api";
import type { PublicReview } from "./after-sales.types";
import { EmptyReviews, ReviewAside, ReviewCard, Stat } from "./SellerReviewComponents";
import { canSendReply, filterReviews, reviewCounts, reviewRating, reviewTab, type ReviewTab } from "./reviews.format";

const panel = "rounded-xl border border-[#e3e7e8] bg-white";
const reviewKey = (username: string) => ["finance", "public-reviews", username] as const;

export function SellerReviewsPage() {
  const { user } = useAuth();
  const username = user?.username ?? "";
  const cache = useQueryClient();
  const dashboard = useSellerDashboard();
  const reviews = useQuery({ queryKey: reviewKey(username), queryFn: () => afterSalesApi.publicReviews(username), enabled: !!username });
  const [params, setParams] = useSearchParams();
  const tab = reviewTab(params.get("tab"));
  const rating = reviewRating(params.get("rating"));
  const [openId, setOpenId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [replyError, setReplyError] = useState<number | null>(null);
  const all = reviews.data?.reviews ?? [];
  const counts = reviewCounts(all, rating);
  const shown = filterReviews(all, tab, rating).slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const selected = all.find((review) => review.id === confirmId);

  function changeFilter(nextTab: ReviewTab, nextRating: number | null) {
    const next = new URLSearchParams(params);
    if (nextTab === "all") next.delete("tab"); else next.set("tab", nextTab);
    if (nextRating === null) next.delete("rating"); else next.set("rating", String(nextRating));
    setParams(next);
  }

  async function sendReply(review: PublicReview) {
    const comment = (drafts[review.id] ?? "").trim();
    if (!canSendReply(comment)) { setReplyError(review.id); setConfirmId(null); return; }
    setBusy(true);
    try {
      await afterSalesApi.replyReview(review.id, comment);
      await Promise.all([cache.invalidateQueries({ queryKey: reviewKey(username) }), cache.invalidateQueries({ queryKey: dashboardKeys.all })]);
      setDrafts((old) => { const next = { ...old }; delete next[review.id]; return next; });
      setOpenId(null); setConfirmId(null); setReplyError(null);
      toast.add({ type: "success", title: "ตอบรีวิวแล้ว" });
    } catch (error) {
      setConfirmId(null);
      if (hasErrorCode(error, "REVIEW_ALREADY_REPLIED") || (isApiError(error) && error.status === 409)) {
        toast.add({ type: "info", title: "รีวิวนี้ถูกตอบไปแล้ว", description: "โหลดคำตอบล่าสุดมาแสดงให้แล้ว" });
        void reviews.refetch();
      } else if (hasErrorCode(error, "REVIEW_NOT_FOUND") || (isApiError(error) && error.status === 404)) {
        toast.add({ type: "info", title: "ไม่พบรีวิวนี้", description: "รีวิวอาจถูกซ่อนหรือไม่ใช่ของร้านคุณ รายการจะรีเฟรชใหม่" });
        void reviews.refetch();
      } else if (isApiError(error) && error.status === 400) setReplyError(review.id);
      else toast.add({ type: "error", title: "ตอบรีวิวไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") });
    } finally { setBusy(false); }
  }

  return <div className="space-y-6 bg-[#f6f8f9] p-5 text-[#090b0c] md:p-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-[26px] font-bold tracking-tight">รีวิวร้านค้า</h1><p className="text-[13px] text-[#67787c]">ดูและตอบกลับรีวิวจากผู้ซื้อ · คำตอบของร้านแสดงต่อสาธารณะ และตอบได้ครั้งเดียว</p></div>{username && <Button variant="outline" size="sm" className="rounded-md bg-white" nativeButton={false} render={<Link to={`/u/${encodeURIComponent(username)}`} target="_blank" rel="noreferrer" />}>ดูหน้าร้านสาธารณะ</Button>}</header>
    <section aria-label="สรุปรีวิว" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{dashboard.isPending ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[109px] rounded-xl" />) : dashboard.isError ? <div className={`${panel} col-span-full p-5`} role="alert">โหลดสรุปรีวิวไม่สำเร็จ <Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}>ลองอีกครั้ง</Button></div> : <><Stat label="คะแนนเฉลี่ย" value={dashboard.data?.reviews.average == null ? "—" : dashboard.data.reviews.average.toFixed(1)} hint={dashboard.data?.reviews.average == null ? "ยังไม่มีรีวิว" : "จาก 5 ดาว"} stars={dashboard.data?.reviews.average ?? undefined} /><Stat label="รีวิวทั้งหมด" value={String(dashboard.data?.reviews.count ?? 0)} hint="นับเฉพาะรีวิวที่แสดงอยู่" /><Stat label="รีวิวเดือนนี้" value={String(dashboard.data?.reviews.thisMonth ?? 0)} hint={new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { month: "short", year: "numeric" }).format(new Date())} /><Stat label="ยังไม่ตอบ" value={String(dashboard.data?.reviews.unreplied ?? 0)} hint="รอร้านตอบกลับ" emphasized={Boolean(dashboard.data?.reviews.unreplied)} /></>}</section>
    {reviews.isPending ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div><Skeleton className="h-72 rounded-xl" /></div> : reviews.isError ? <div role="alert" className={`${panel} p-6`}>โหลดรีวิวไม่สำเร็จ <Button variant="outline" size="sm" onClick={() => void reviews.refetch()}>ลองอีกครั้ง</Button></div> : all.length === 0 ? <EmptyReviews username={username} /> : <><div className="flex flex-wrap items-center justify-between gap-3"><div role="tablist" aria-label="กรองรีวิว" className="flex flex-wrap gap-1.5">{(["all", "unreplied", "replied"] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => changeFilter(value, rating)} className={`rounded-full border px-3 py-1.5 text-xs ${tab === value ? "border-[#090b0c] bg-[#090b0c] text-white" : "border-[#e3e7e8] bg-white hover:bg-slate-50"}`}>{({ all: "ทั้งหมด", unreplied: "ยังไม่ตอบ", replied: "ตอบแล้ว" })[value]} {counts[value]}</button>)}</div><NativeSelect aria-label="กรองตามระดับดาว" size="sm" className="rounded-md border bg-white" value={rating ?? ""} onChange={(event) => changeFilter(tab, reviewRating(event.target.value))}><NativeSelectOption value="">ทุกระดับดาว</NativeSelectOption>{[5, 4, 3, 2, 1].map((score) => <NativeSelectOption key={score} value={score}>{score} ★</NativeSelectOption>)}</NativeSelect></div><div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px]"><main className="min-w-0 space-y-3">{shown.length ? shown.map((review) => <ReviewCard key={review.id} review={review} open={openId === review.id} draft={drafts[review.id] ?? ""} error={replyError === review.id} onToggle={() => { setOpenId(openId === review.id ? null : review.id); setReplyError(null); }} onDraft={(value) => { setDrafts((old) => ({ ...old, [review.id]: value })); setReplyError(null); }} onConfirm={() => setConfirmId(review.id)} />) : <div className={`${panel} p-10 text-center text-sm text-[#67787c]`}>ไม่พบรีวิวตามตัวกรองนี้</div>}<p className="pt-1 text-center text-xs text-[#9aa5ad]">แสดงครบทั้ง {shown.length} รีวิว · เรียงจากใหม่สุด</p></main><ReviewAside data={reviews.data!} rating={rating} onRating={(value) => changeFilter(tab, value)} /></div></>}
    <Dialog open={selected !== undefined} onOpenChange={(open) => { if (!open && !busy) setConfirmId(null); }}><DialogContent className="gap-4 rounded-xl" showCloseButton={false}><DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><AlertTriangle className="size-4 text-orange-600" />ส่งคำตอบแล้วแก้ไขไม่ได้</DialogTitle><DialogDescription className="text-xs text-[#414755]">คำตอบจะแสดงใต้รีวิวของ {selected?.reviewerUsername} บนหน้าร้านให้ทุกคนเห็น และแก้ไขหรือลบภายหลังไม่ได้</DialogDescription></DialogHeader><div className="rounded-lg bg-[#fafbfb] p-3 text-xs"><p className="mb-1 font-semibold text-[#67787c]">คำตอบของคุณ</p><p className="whitespace-pre-wrap">{selected ? drafts[selected.id]?.trim() : ""}</p></div><DialogFooter><Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmId(null)}>กลับไปแก้ไข</Button><Button size="sm" disabled={busy || !selected || !canSendReply(drafts[selected.id] ?? "")} onClick={() => selected && void sendReply(selected)}>ยืนยันส่งคำตอบ</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
