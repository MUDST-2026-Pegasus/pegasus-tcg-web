import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Star } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getErrorMessage, hasErrorCode } from "@/lib/api";

import {
  countReviews,
  filterLabel,
  filterReviews,
  summarizeRatings,
  type ReviewFilter,
} from "../reviews.format";
import {
  useReviewSellerProfile,
  useSellerReviews,
  useSetReviewVisibility,
} from "../reviews.queries";
import { FinanceStatStrip, type FinanceStat } from "./FinanceShared";
import { ReviewModerationCard } from "./ReviewModerationCard";
import { ReviewSellerCard } from "./ReviewSellerCard";

const PAGE_SIZE = 10;
const FILTERS: ReviewFilter[] = ["ALL", "VISIBLE", "HIDDEN", "UNREPLIED", "LOW"];

/**
 * หน้า "จัดการรีวิว" — ค้นหาผู้ขายแล้วดูรีวิวทั้งหมดรวมที่ถูกซ่อน
 * ซ่อน/แสดงด้วย Switch แล้วคะแนนบนโปรไฟล์คำนวณใหม่ฝั่ง backend
 * ผู้ขายที่ค้นอยู่เก็บไว้ใน `?seller=` ให้ reload / แชร์ลิงก์แล้วยังอยู่หน้าเดิม
 * อ้างจาก Figma "V2 · Admin / จัดการรีวิว" node 1931:2926
 */
export function AdminReviewsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const username = searchParams.get("seller")?.trim() ?? "";
  const [draft, setDraft] = useState(username);
  const [filter, setFilter] = useState<ReviewFilter>("ALL");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const reviews = useSellerReviews(username);
  const profile = useReviewSellerProfile(username);
  const visibility = useSetReviewVisibility(username);

  const all = reviews.data ?? [];
  const counts = reviews.data ? countReviews(all) : null;
  const filtered = filterReviews(all, filter);
  const shown = filtered.slice(0, limit);

  const search = (event: FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    setFilter("ALL");
    setLimit(PAGE_SIZE);
    setSearchParams(next ? { seller: next } : {});
  };

  const changeFilter = (next: ReviewFilter) => {
    setFilter(next);
    setLimit(PAGE_SIZE);
  };

  const changeVisibility = (id: number, visible: boolean) =>
    visibility.mutate(
      { id, visible },
      {
        onSuccess: () =>
          toast.add({ type: "success", title: visible ? "แสดงรีวิวบนโปรไฟล์แล้ว" : "ซ่อนรีวิวแล้ว" }),
        onError: (error) =>
          toast.add({
            type: "error",
            title: "เปลี่ยนการแสดงรีวิวไม่สำเร็จ",
            description: getErrorMessage(error, "กรุณาลองอีกครั้ง"),
          }),
      },
    );

  const stats: FinanceStat[] = [
    { label: "ยังไม่ได้ตอบกลับ", value: String(counts?.unreplied ?? 0), dotClass: "bg-[#f59e0a]", emphasized: true },
    { label: "แสดงอยู่", value: String(counts?.visible ?? 0), dotClass: "bg-[#12805c]" },
    { label: "ซ่อนอยู่", value: String(counts?.hidden ?? 0), dotClass: "bg-[#d0342c]" },
    { label: "รีวิวทั้งหมด", value: String(counts?.total ?? 0), dotClass: "bg-[#9aa5ad]" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">จัดการรีวิว</h1>
          <p className="text-[13px] text-muted-foreground">
            ดูรีวิวทั้งหมดของผู้ขาย รวมรีวิวที่ถูกซ่อน · ซ่อนรีวิวที่ไม่เหมาะสมออกจากหน้าโปรไฟล์สาธารณะ
          </p>
        </div>
        {username ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            render={<Link to={`/u/${encodeURIComponent(username)}`} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            ดูหน้าโปรไฟล์สาธารณะ
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="rounded-md px-2.5" disabled>
            ดูหน้าโปรไฟล์สาธารณะ
          </Button>
        )}
      </div>

      <FinanceStatStrip
        stats={stats}
        isLoading={Boolean(username) && reviews.isPending}
        isError={reviews.isError}
      />

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={search} className="flex items-center gap-2">
          <div className="relative w-full sm:w-[260px]">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="ชื่อผู้ใช้ผู้ขาย"
              placeholder="ชื่อผู้ใช้ผู้ขาย"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-8 rounded-lg bg-background pl-8"
            />
          </div>
          <Button type="submit" size="sm" className="rounded-md px-2.5" disabled={!draft.trim()}>
            ค้นหาผู้ขาย
          </Button>
        </form>
        <div className="hidden flex-1 lg:block" />
        <div role="tablist" aria-label="กรองรีวิว" className="flex flex-wrap items-center gap-1">
          {FILTERS.map((value) => (
            <Button
              key={value}
              role="tab"
              aria-selected={filter === value}
              size="sm"
              variant={filter === value ? "secondary" : "ghost"}
              className="rounded-md px-2.5"
              disabled={!counts}
              onClick={() => changeFilter(value)}
            >
              {filterLabel(value, counts)}
            </Button>
          ))}
        </div>
      </div>

      {!username ? (
        <EmptyState
          icon={Star}
          title="ค้นหาผู้ขายเพื่อดูรีวิว"
          description="พิมพ์ชื่อผู้ใช้ของผู้ขาย แล้วกด “ค้นหาผู้ขาย”"
        />
      ) : reviews.isPending ? (
        <ReviewsSkeleton />
      ) : reviews.isError ? (
        hasErrorCode(reviews.error, "SELLER_NOT_FOUND") ? (
          <EmptyState title={`ไม่พบผู้ขาย “${username}”`} description="ตรวจสอบชื่อผู้ใช้อีกครั้ง" />
        ) : (
          <ErrorState error={reviews.error} onRetry={() => void reviews.refetch()} />
        )
      ) : (
        <div className="flex flex-col items-start gap-6 lg:flex-row">
          <ReviewSellerCard
            username={username}
            profile={profile.isPending ? undefined : (profile.data ?? null)}
            summary={summarizeRatings(all)}
          />
          <section aria-label="รายการรีวิว" className="flex w-full min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="flex-1 text-sm font-semibold text-foreground">
                รีวิวของ {username} ({filtered.length.toLocaleString("th-TH")})
              </h2>
              <p className="text-[11px] text-[#9aa5ad]">เรียงตาม: ใหม่ไปเก่า</p>
            </div>
            {shown.length === 0 ? (
              <EmptyState
                title={all.length === 0 ? "ผู้ขายรายนี้ยังไม่มีรีวิว" : "ไม่มีรีวิวในตัวกรองนี้"}
              />
            ) : (
              shown.map((review) => (
                <ReviewModerationCard
                  key={review.id}
                  review={review}
                  pending={visibility.isPending && visibility.variables?.id === review.id}
                  onVisibleChange={(visible) => changeVisibility(review.id, visible)}
                />
              ))
            )}
            {filtered.length > shown.length && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md px-2.5"
                  onClick={() => setLimit((current) => current + PAGE_SIZE)}
                >
                  โหลดเพิ่ม
                </Button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลดรีวิว" className="flex flex-col items-start gap-6 lg:flex-row">
      <Skeleton className="h-[340px] w-full rounded-xl lg:w-[340px]" />
      <div className="flex w-full flex-1 flex-col gap-3">
        <Skeleton className="h-5 w-48" />
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-[120px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
