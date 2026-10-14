import { EyeOff, MessageSquareReply } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { initialsOf } from "../finance.format";
import { formatThaiDate } from "../reviews.format";
import type { AdminReview } from "../reviews.types";
import { ReviewStars } from "./ReviewStars";
import { SellerAvatar } from "./SellerAvatar";

/**
 * รีวิวหนึ่งรายการ + Switch "แสดงบนโปรไฟล์"
 * ที่ซ่อนอยู่เป็นกรอบเส้นประ ตัวหนังสือจาง ตามดีไซน์ node 1932:3173
 */
export function ReviewModerationCard({
  review,
  pending,
  onVisibleChange,
}: {
  review: AdminReview;
  pending: boolean;
  onVisibleChange: (visible: boolean) => void;
}) {
  const hidden = !review.visible;
  const switchId = `review-visible-${review.id}`;
  return (
    <article
      aria-label={`รีวิวจาก ${review.reviewerUsername}`}
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-xl border px-[18px] py-4",
        hidden ? "border-dashed border-border bg-[#fbfbfc]" : "border-border bg-background",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <SellerAvatar
          initials={initialsOf(review.reviewerUsername)}
          accent="teal"
          className={cn("size-[38px]", hidden && "opacity-50")}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <div className="flex items-center gap-2">
            <p className={cn("truncate text-[13px] font-semibold", hidden ? "text-[#9aa5ad]" : "text-foreground")}>
              {review.reviewerUsername}
            </p>
            <ReviewStars rating={review.rating} />
          </div>
          <p className="text-[11px] text-[#9aa5ad]">
            {formatThaiDate(review.createdAt)} · คำสั่งซื้อย่อย #{review.sellerOrderId}
          </p>
        </div>
        {hidden ? (
          <Badge className="rounded-[5px] bg-[#fbe9e8] text-[10px] text-[#d0342c]">ซ่อนอยู่</Badge>
        ) : (
          review.replyComment == null && (
            <Badge className="bg-[#fdf0dd] text-[11px] text-[#b45309]">ยังไม่ตอบกลับ</Badge>
          )
        )}
        <div className="flex items-center gap-2">
          <label htmlFor={switchId} className="text-xs text-muted-foreground">
            แสดงบนโปรไฟล์
          </label>
          <Switch
            id={switchId}
            size="sm"
            checked={review.visible}
            disabled={pending}
            onCheckedChange={(checked) => onVisibleChange(checked)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 pl-12">
        {review.title && (
          <p className={cn("text-[13px] font-semibold", hidden ? "text-[#9aa5ad]" : "text-foreground")}>
            {review.title}
          </p>
        )}
        <p className={cn("text-[13px] whitespace-pre-line", hidden ? "text-[#9aa5ad]" : "text-[#414755]")}>
          {review.comment}
        </p>
        {review.replyComment && !hidden && (
          <div className="mt-1 flex flex-col gap-1 rounded-lg bg-[#f2f5f6] px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <MessageSquareReply aria-hidden="true" className="size-3" />
              ผู้ขายตอบกลับ
            </p>
            <p className="text-xs whitespace-pre-line text-[#414755]">{review.replyComment}</p>
          </div>
        )}
        {hidden && (
          <p className="flex items-center gap-1.5 text-[11px] text-[#c71a1f]">
            <EyeOff aria-hidden="true" className="size-[13px]" />
            ไม่แสดงบนหน้าโปรไฟล์และไม่นับในคะแนน
          </p>
        )}
      </div>
    </article>
  );
}
