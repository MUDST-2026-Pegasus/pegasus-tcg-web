import { PromotionTicketFrame } from "@/features/promotions/PromotionTicketFrame";
import {
  discountCapLabel, minSpendLabel, money, thaiDate,
} from "../promotions.format";
import type { SellerPromotion, SellerPromotionInput } from "../promotions.types";

export function CouponTicket({
  promotion, preview = false,
}: {
  promotion: SellerPromotion | SellerPromotionInput;
  preview?: boolean;
}) {
  const value = promotion.discountType === "PERCENT"
    ? `${promotion.discountValue || 0}%` : money(promotion.discountValue || 0);
  const isScheduled = "status" in promotion && promotion.status === "SCHEDULED";
  const isAdminPaused = "pausedBy" in promotion && promotion.pausedBy === "ADMIN";
  const visibility = promotion.visibility === "PUBLIC" ? "สาธารณะ" : "ส่วนตัว";
  const details = promotion.discountType === "PERCENT"
    ? `${discountCapLabel(promotion)} · ${minSpendLabel(promotion.minSpend)}`
    : `${minSpendLabel(promotion.minSpend)} · ${promotion.usageLimitPerUser} สิทธิ์/คน`;
  const period = isAdminPaused ? "หยุดโดยทีมงาน Pegasus"
    : `${isScheduled ? "เริ่ม" : "ใช้ได้ถึง"} ${promotion.endsAt
      ? thaiDate(isScheduled ? promotion.startsAt : promotion.endsAt) : "—"} · ${visibility}`;

  return (
    <PromotionTicketFrame variant="shop"
      scallopOffsets={[-29, -11, 7, 25]}
      stub={<>
        <span className="text-[10px] opacity-80">ลด</span>
        <strong className="text-[22px] leading-7 font-black">{value}</strong>
        <small className="text-[9px] font-semibold tracking-widest opacity-80">SHOP</small>
      </>}
      body={<>
        <div className="flex min-w-0 items-center justify-between gap-1">
          <strong className="truncate text-sm tracking-wide">{promotion.code || "YOURCODE"}</strong>
          {preview && <span aria-hidden className="size-[18px] shrink-0 rounded-full border border-muted-foreground/60" />}
        </div>
        <span className="truncate text-[11px] text-foreground/75">{details}</span>
        <span className="truncate text-[10px] text-muted-foreground">{period}</span>
      </>} />
  );
}
