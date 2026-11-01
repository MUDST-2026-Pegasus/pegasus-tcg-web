import { PromotionTicketFrame } from "@/features/promotions/PromotionTicketFrame";

import { formatBaht, formatPromoDate } from "../promotions.format";
import type { AdminPromotionInput } from "../promotions.types";

const SCALLOP_OFFSETS = [-38, -20, -2, 16, 34];

/** Figma PRM / Claim Ticket — ตั๋วที่ผู้ซื้อจะเห็น วาดจากค่าในฟอร์มตอนนี้ */
export function ClaimTicketPreview({ promotion }: { promotion: AdminPromotionInput }) {
  const value =
    promotion.discountType === "FREE_SHIPPING"
      ? "ส่งฟรี"
      : promotion.discountType === "PERCENT"
        ? `${promotion.discountValue || 0}%`
        : formatBaht(promotion.discountValue);
  const endsAt = Number.isFinite(Date.parse(promotion.endsAt)) ? formatPromoDate(promotion.endsAt) : "—";
  const cap =
    promotion.discountType === "PERCENT" && promotion.maxDiscount
      ? `ลด ${promotion.discountValue}% สูงสุด ${formatBaht(promotion.maxDiscount)} · `
      : "";

  return (
    <PromotionTicketFrame variant="platform" scallopOffsets={SCALLOP_OFFSETS}
      stub={<>
        {promotion.discountType === "FREE_SHIPPING" ? null : <span className="text-[10px] opacity-80">ลด</span>}
        <strong className="text-[22px] leading-7 font-black">{value}</strong>
        <span className="text-[9px] font-semibold tracking-widest opacity-80">PEGASUS</span>
      </>} body={<>
        <div className="flex items-center justify-between gap-1">
          <strong className="truncate text-sm tracking-wide">{promotion.code || "PEGASUS10"}</strong>
          <span aria-hidden className="size-[18px] shrink-0 rounded-full border border-muted-foreground/60" />
        </div>
        <span className="truncate text-[11px] text-foreground/75">
          {cap}
          {promotion.minSpend > 0 ? `ขั้นต่ำ ${formatBaht(promotion.minSpend)}` : "ไม่มีขั้นต่ำ"}
        </span>
        <span className="truncate text-[10px] text-muted-foreground">
          ใช้ได้ถึง {endsAt} ·{" "}
          {promotion.claimLimit == null ? "เก็บได้ไม่จำกัด" : `เหลือ ${promotion.claimLimit} สิทธิ์`}
        </span>
      </>} />
  );
}
