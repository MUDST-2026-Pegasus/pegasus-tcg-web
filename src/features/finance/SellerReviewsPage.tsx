import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth.queries";
import { dashboardKeys, useSellerDashboard } from "@/features/seller/dashboard/dashboard.queries";
import { hasErrorCode, isApiError } from "@/lib/api";
import { afterSalesApi } from "./after-sales.api";
import type { PublicReview } from "./after-sales.types";
import { EmptyReviews, ReviewAside, ReviewCard, Stat } from "./SellerReviewComponents";
import { canSendReply, filterReviews, reviewCounts, reviewRating, reviewTab, type ReviewTab } from "./reviews.format";
import { intlLocale, translateError, useTranslate } from "@/lib/i18n";

const panel = "rounded-xl border border-border bg-card";
const reviewKey = (username: string) => ["finance", "public-reviews", username] as const;

export function SellerReviewsPage() {
  const { t } = useTranslate("seller");
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
      toast.add({ type: "success", title: t("sellerReviews.toast.repliedSuccess", "ตอบรีวิวแล้ว") });
    } catch (error) {
      setConfirmId(null);
      if (hasErrorCode(error, "REVIEW_ALREADY_REPLIED") || (isApiError(error) && error.status === 409)) {
        toast.add({
          type: "info",
          title: t("sellerReviews.toast.alreadyRepliedTitle", "รีวิวนี้ถูกตอบไปแล้ว"),
          description: t("sellerReviews.toast.alreadyRepliedDesc", "โหลดคำตอบล่าสุดมาแสดงให้แล้ว"),
        });
        void reviews.refetch();
      } else if (hasErrorCode(error, "REVIEW_NOT_FOUND") || (isApiError(error) && error.status === 404)) {
        toast.add({
          type: "info",
          title: t("sellerReviews.toast.notFoundTitle", "ไม่พบรีวิวนี้"),
          description: t("sellerReviews.toast.notFoundDesc", "รีวิวอาจถูกซ่อนหรือไม่ใช่ของร้านคุณ รายการจะรีเฟรชใหม่"),
        });
        void reviews.refetch();
      } else if (isApiError(error) && error.status === 400) setReplyError(review.id);
      else toast.add({
        type: "error",
        title: t("sellerReviews.toast.replyFailed", "ตอบรีวิวไม่สำเร็จ"),
        description: translateError(error, t("sellerReviews.toast.tryAgainHint", "กรุณาลองอีกครั้ง")),
      });
    } finally { setBusy(false); }
  }

  const tabLabelsMap: Record<ReviewTab, string> = {
    all: t("sellerReviews.tabs.all", "ทั้งหมด"),
    unreplied: t("sellerReviews.tabs.unreplied", "ยังไม่ตอบ"),
    replied: t("sellerReviews.tabs.replied", "ตอบแล้ว"),
  };

  return (
    <div className="space-y-6 p-5 text-foreground md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">{t("sellerReviews.title", "รีวิวร้านค้า")}</h1>
          <p className="text-[13px] text-muted-foreground">{t("sellerReviews.subtitle", "ดูและตอบกลับรีวิวจากผู้ซื้อ · คำตอบของร้านแสดงต่อสาธารณะ และตอบได้ครั้งเดียว")}</p>
        </div>
        {username && (
          <Button variant="outline" size="sm" className="rounded-md bg-card" nativeButton={false} render={<Link to={`/u/${encodeURIComponent(username)}`} target="_blank" rel="noreferrer" />}>
            {t("sellerReviews.viewPublicStore", "ดูหน้าร้านสาธารณะ")}
          </Button>
        )}
      </header>
      <section aria-label={t("sellerReviews.stats.summaryAria", "สรุปรีวิว")} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.isPending ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[109px] rounded-xl" />) : dashboard.isError ? (
          <div className={`${panel} col-span-full p-5`} role="alert">
            {t("sellerReviews.stats.loadFailed", "โหลดสรุปรีวิวไม่สำเร็จ")}{" "}
            <Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}>
              {t("actions.retry", "ลองอีกครั้ง", { ns: "common" })}
            </Button>
          </div>
        ) : (
          <>
            <Stat
              label={t("sellerReviews.stats.averageRating", "คะแนนเฉลี่ย")}
              value={dashboard.data?.reviews.average == null ? "—" : dashboard.data.reviews.average.toFixed(1)}
              hint={dashboard.data?.reviews.average == null ? t("sellerReviews.stats.noReviewsYet", "ยังไม่มีรีวิว") : t("sellerReviews.stats.outOfFiveStars", "จาก 5 ดาว")}
              stars={dashboard.data?.reviews.average ?? undefined}
            />
            <Stat
              label={t("sellerReviews.stats.totalReviews", "รีวิวทั้งหมด")}
              value={String(dashboard.data?.reviews.count ?? 0)}
              hint={t("sellerReviews.stats.onlyVisibleCounted", "นับเฉพาะรีวิวที่แสดงอยู่")}
            />
            <Stat
              label={t("sellerReviews.stats.thisMonth", "รีวิวเดือนนี้")}
              value={String(dashboard.data?.reviews.thisMonth ?? 0)}
              hint={new Intl.DateTimeFormat(intlLocale(), { month: "short", year: "numeric" }).format(new Date())}
            />
            <Stat
              label={t("sellerReviews.stats.unreplied", "ยังไม่ตอบ")}
              value={String(dashboard.data?.reviews.unreplied ?? 0)}
              hint={t("sellerReviews.stats.waitingForReply", "รอร้านตอบกลับ")}
              emphasized={Boolean(dashboard.data?.reviews.unreplied)}
            />
          </>
        )}
      </section>
      {reviews.isPending ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : reviews.isError ? (
        <div role="alert" className={`${panel} p-6`}>
          {t("sellerReviews.loadReviewsFailed", "โหลดรีวิวไม่สำเร็จ")}{" "}
          <Button variant="outline" size="sm" onClick={() => void reviews.refetch()}>
            {t("actions.retry", "ลองอีกครั้ง", { ns: "common" })}
          </Button>
        </div>
      ) : all.length === 0 ? (
        <EmptyReviews username={username} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label={t("sellerReviews.tabs.filterAria", "กรองรีวิว")} className="flex flex-wrap gap-1.5">
              {(["all", "unreplied", "replied"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => changeFilter(value, rating)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${tab === value ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-slate-50"}`}
                >
                  {tabLabelsMap[value]} {counts[value]}
                </button>
              ))}
            </div>
            <Select
              items={[{ value: "all", label: t("sellerReviews.ratingFilterAll", "ทุกระดับดาว") }, ...[5, 4, 3, 2, 1].map((score) => ({ value: String(score), label: `${score} ★` }))]}
              value={rating === null ? "all" : String(rating)}
              onValueChange={(value) => changeFilter(tab, reviewRating(value))}
            >
              <SelectTrigger aria-label={t("sellerReviews.ratingFilterAria", "กรองตามระดับดาว")} size="sm" className="min-w-32 rounded-md border border-border bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">{t("sellerReviews.ratingFilterAll", "ทุกระดับดาว")}</SelectItem>
                  {[5, 4, 3, 2, 1].map((score) => (
                    <SelectItem key={score} value={String(score)}>{score} ★</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <main className="min-w-0 space-y-3">
              {shown.length ? (
                shown.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    open={openId === review.id}
                    draft={drafts[review.id] ?? ""}
                    error={replyError === review.id}
                    onToggle={() => {
                      setOpenId(openId === review.id ? null : review.id);
                      setReplyError(null);
                    }}
                    onDraft={(value) => {
                      setDrafts((old) => ({ ...old, [review.id]: value }));
                      setReplyError(null);
                    }}
                    onConfirm={() => setConfirmId(review.id)}
                  />
                ))
              ) : (
                <div className={`${panel} p-10 text-center text-sm text-muted-foreground`}>
                  {t("sellerReviews.noReviewsFiltered", "ไม่พบรีวิวตามตัวกรองนี้")}
                </div>
              )}
              <p className="pt-1 text-center text-xs text-[#9aa5ad]">
                {t("sellerReviews.showingAllCount", "แสดงครบทั้ง {count} รีวิว · เรียงจากใหม่สุด", { count: shown.length })}
              </p>
            </main>
            <ReviewAside data={reviews.data!} rating={rating} onRating={(value) => changeFilter(tab, value)} />
          </div>
        </>
      )}
      <Dialog open={selected !== undefined} onOpenChange={(open) => { if (!open && !busy) setConfirmId(null); }}>
        <DialogContent className="gap-4 rounded-xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-orange-600" />
              {t("sellerReviews.dialog.title", "ส่งคำตอบแล้วแก้ไขไม่ได้")}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#414755]">
              {t("sellerReviews.dialog.desc", "คำตอบจะแสดงใต้รีวิวของ {username} บนหน้าร้านให้ทุกคนเห็น และแก้ไขหรือลบภายหลังไม่ได้", {
                username: selected?.reviewerUsername,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-[#fafbfb] p-3 text-xs">
            <p className="mb-1 font-semibold text-muted-foreground">{t("sellerReviews.dialog.yourReply", "คำตอบของคุณ")}</p>
            <p className="whitespace-pre-wrap">{selected ? drafts[selected.id]?.trim() : ""}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmId(null)}>
              {t("sellerReviews.dialog.backToEdit", "กลับไปแก้ไข")}
            </Button>
            <Button size="sm" disabled={busy || !selected || !canSendReply(drafts[selected.id] ?? "")} onClick={() => selected && void sendReply(selected)}>
              {t("sellerReviews.dialog.confirmSend", "ยืนยันส่งคำตอบ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
