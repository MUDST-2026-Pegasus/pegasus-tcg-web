import notch from "@/assets/promotions/notch.svg";
import scallop from "@/assets/promotions/scallop.svg";

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
    <div className="promotion-ticket relative flex h-[92px] w-full overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border">
      <div className="flex w-[88px] shrink-0 flex-col items-center justify-center bg-gradient-to-br from-[#00398a] via-[#0058bc] to-[#1a8fe0] px-1 text-center text-white">
        {promotion.discountType === "FREE_SHIPPING" ? null : <span className="text-[10px] opacity-80">ลด</span>}
        <strong className="text-[22px] leading-7 font-black">{value}</strong>
        <span className="text-[9px] font-semibold tracking-widest opacity-80">PEGASUS</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 border-l border-dashed border-border px-3 py-2">
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
      </div>
      <img src={notch} alt="" className="pointer-events-none absolute -top-[9px] left-[79px] size-[18px]" />
      <img src={notch} alt="" className="pointer-events-none absolute -bottom-[9px] left-[79px] size-[18px]" />
      {SCALLOP_OFFSETS.map((offset) => (
        <img
          key={offset}
          src={scallop}
          alt=""
          className="pointer-events-none absolute -left-1 size-2"
          style={{ top: `calc(50% + ${offset}px)` }}
        />
      ))}
    </div>
  );
}
