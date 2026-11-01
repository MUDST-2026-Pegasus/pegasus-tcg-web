import { Info } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { initialsOf } from "../finance.format";
import { formatAverage, type RatingSummary } from "../reviews.format";
import type { ReviewSellerProfile } from "../reviews.types";
import { ReviewStars } from "./ReviewStars";
import { SellerAvatar } from "./SellerAvatar";

/**
 * การ์ดคะแนนผู้ขายทางซ้าย — ชื่อร้าน ค่าเฉลี่ย และการกระจาย 1–5 ดาว
 * อ้างจาก Figma node 1932:2998
 */
export function ReviewSellerCard({
  username,
  profile,
  summary,
}: {
  username: string;
  profile: ReviewSellerProfile | null | undefined;
  summary: RatingSummary;
}) {
  const displayName = profile?.displayName?.trim();
  return (
    <section
      aria-label="คะแนนผู้ขาย"
      className="flex w-full shrink-0 flex-col gap-4 rounded-xl border border-border bg-background p-5 lg:w-[340px]"
    >
      <div className="flex items-center gap-3">
        <SellerAvatar
          initials={initialsOf(username)}
          accent="teal"
          src={profile?.avatarUrl}
          className="size-[38px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <p className="truncate text-[15px] font-bold text-foreground">{username}</p>
          {profile === undefined ? (
            <Skeleton className="h-3 w-32" />
          ) : (
            <p className="truncate text-[11px] text-muted-foreground">
              {displayName && displayName !== username ? displayName : `@${username}`}
            </p>
          )}
        </div>
      </div>

      <Separator className="bg-muted" />

      <div className="flex items-center gap-3">
        <p className="text-[36px] leading-none font-bold text-foreground">
          {summary.count ? formatAverage(summary.average) : "—"}
        </p>
        <div className="flex flex-col gap-1">
          <ReviewStars rating={summary.average} starClassName="size-[15px]" />
          <p className="text-[11px] text-muted-foreground">
            จาก {summary.count.toLocaleString("th-TH")} รีวิวที่แสดงอยู่
          </p>
        </div>
      </div>

      <dl className="flex flex-col gap-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = summary.distribution[star - 1];
          const percent = summary.count ? (count / summary.count) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <dt className="w-6 shrink-0 text-[11px] font-medium text-muted-foreground">{star} ★</dt>
              <dd className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-secondary">
                <span
                  className="block h-full rounded-[3px] bg-[#f59e0a]"
                  style={{ width: `${percent}%` }}
                />
              </dd>
              <dd className="w-6 shrink-0 text-right text-[11px] text-[#9aa5ad]">{count}</dd>
            </div>
          );
        })}
      </dl>

      <div className="flex items-start gap-2 rounded-lg bg-[#e8f1fc] px-3 py-2.5">
        <Info aria-hidden="true" className="mt-px size-3.5 shrink-0 text-[#0058bc]" />
        <p className="text-[11px] text-[#0058bc]">
          คะแนนนับเฉพาะรีวิวที่แสดงอยู่ · ซ่อน/แสดงรีวิวแล้วระบบคำนวณใหม่ทันที (เฉพาะเมื่อค่าเปลี่ยนจริง)
        </p>
      </div>
    </section>
  );
}
