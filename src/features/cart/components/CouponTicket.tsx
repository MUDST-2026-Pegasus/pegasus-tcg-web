import { Check, TicketPercent } from "lucide-react";
import { checkoutMoney } from "../checkout.format";
import type { AvailablePromotion } from "../promotions.types";

function promotionValue(promotion: AvailablePromotion) {
  if (promotion.discountType === "FREE_SHIPPING") return "ส่งฟรี";
  return promotion.discountType === "PERCENT" ? `${promotion.discountValue}%` : checkoutMoney(promotion.discountValue);
}

export function CouponTicket({ promotion, selected = false, onSelect }: {
  promotion: AvailablePromotion;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const disabled = !promotion.applicable;
  const platform = promotion.ownerType === "PLATFORM";
  return <button type="button" disabled={disabled || !onSelect} onClick={onSelect}
    className={`flex w-full min-h-[90px] overflow-hidden rounded-xl border text-left shadow-sm transition-colors ${selected ? "border-[#0069a8] bg-[#f0f7fc]" : "border-[#e3e7e8] bg-white"} ${disabled ? "opacity-65" : "hover:border-[#0069a8]"}`}
    aria-pressed={selected}>
    <span className={`relative flex w-[90px] shrink-0 flex-col items-center justify-center text-white ${disabled ? "bg-[#9ca8ad]" : platform ? "bg-gradient-to-br from-[#2354a5] to-[#0089d0]" : "bg-gradient-to-br from-[#257e73] to-[#08a69a]"}`}>
      <TicketPercent className="mb-1 size-4" aria-hidden="true" />
      <strong className="text-xl leading-none">{promotionValue(promotion)}</strong>
      <small className="mt-1 text-[9px] uppercase tracking-wider">{platform ? "PEGASUS" : "SHOP"}</small>
      <span className="absolute -right-2 -top-2 size-4 rounded-full bg-white" /><span className="absolute -bottom-2 -right-2 size-4 rounded-full bg-white" />
    </span>
    <span className="flex min-w-0 flex-1 items-center gap-2 border-l border-dashed border-[#d3dce1] px-3 py-2">
      <span className="min-w-0 flex-1"><strong className="block truncate text-[13px]">{promotion.code}</strong>
        <span className="block truncate text-[11px] text-muted-foreground">{promotion.name}</span>
        <span className="block text-[10px] text-muted-foreground">ขั้นต่ำ {checkoutMoney(promotion.minSpend)}{promotion.maxDiscount ? ` · สูงสุด ${checkoutMoney(promotion.maxDiscount)}` : ""}</span>
        {disabled && <span className="block text-[10px] text-amber-700">{promotion.reason === "PROMO_MIN_SPEND_NOT_MET" && promotion.shortfall ? `ซื้อเพิ่มอีก ${checkoutMoney(promotion.shortfall)}` : promotion.reason || "ยังใช้ไม่ได้"}</span>}
      </span>
      <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#0069a8] bg-[#0069a8] text-white" : "border-[#a9b6bd]"}`}>{selected && <Check className="size-3" />}</span>
    </span>
  </button>;
}
