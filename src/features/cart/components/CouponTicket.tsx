import notch from "@/assets/promotions/notch.svg";
import scallop from "@/assets/promotions/scallop.svg";
import radio from "@/assets/promotions/radio.svg";
import check from "@/assets/promotions/check.svg";
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
    className={`relative flex min-h-[90px] w-full overflow-hidden rounded-xl border text-left shadow-sm transition-colors ${selected ? "border-[#0069a8] bg-[#f0f7fc]" : "border-[#e3e7e8] bg-white"} ${disabled ? "opacity-65" : "hover:border-[#0069a8]"}`}
    aria-pressed={selected}>
    <span className={`relative flex w-[88px] shrink-0 flex-col items-center justify-center text-white ${disabled ? "bg-[#9ca8ad]" : platform ? "bg-gradient-to-br from-[#00398a] via-[#0058bc] to-[#1a8fe0]" : "bg-gradient-to-br from-[#065f58] via-[#0d9488] to-[#2bb5a3]"}`}>
      <span className="text-[11px] text-white/80">ลด</span>
      <strong className="text-[22px] font-black leading-none">{promotionValue(promotion)}</strong>
      <small className="mt-1 text-[9px] uppercase tracking-wider">{platform ? "PEGASUS" : "SHOP"}</small>
    </span>
    <span className="flex min-w-0 flex-1 items-center gap-2 border-l border-dashed border-[#d3dce1] px-3 py-2">
      <span className="min-w-0 flex-1"><strong className="block truncate text-[13px]">{promotion.code}</strong>
        <span className="block truncate text-[11px] text-muted-foreground">{promotion.name}</span>
        <span className="block text-[10px] text-muted-foreground">ขั้นต่ำ {checkoutMoney(promotion.minSpend)}{promotion.maxDiscount ? ` · สูงสุด ${checkoutMoney(promotion.maxDiscount)}` : ""}</span>
        {!disabled && <span className="block truncate text-[10px] text-[#9aa5ad]">ใช้ได้ถึง {new Date(promotion.endsAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}{promotion.remainingClaims != null ? ` · เหลือ ${promotion.remainingClaims} สิทธิ์` : ""}</span>}
        {disabled && <span className="block text-[10px] text-amber-700">{promotion.reason === "PROMO_MIN_SPEND_NOT_MET" && promotion.shortfall ? `ซื้อเพิ่มอีก ${checkoutMoney(promotion.shortfall)}` : promotion.reason || "ยังใช้ไม่ได้"}</span>}
      </span>
      <img alt="" src={selected ? check : radio} className="size-[18px] shrink-0" />
    </span>
    <img alt="" src={notch} className="pointer-events-none absolute left-[79px] -top-[9px] size-[18px]" />
    <img alt="" src={notch} className="pointer-events-none absolute -bottom-[9px] left-[79px] size-[18px]" />
    {[-29, -11, 7, 25].map((offset) => <img key={offset} alt="" src={scallop} className="pointer-events-none absolute -left-1 size-2" style={{ top: `calc(50% + ${offset}px)` }} />)}
  </button>;
}
