import { translate, useLanguage } from "@/lib/language";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { carrierLabel } from "@/features/seller/shared/carriers";
import { cn } from "@/lib/utils";
import { checkoutMoney } from "../checkout.format";
import type { ShippingQuote, ShippingQuoteOption } from "../checkout.types";

interface Props {
  sellerName: string;
  itemCount: number;
  quote?: ShippingQuote;
  selected?: ShippingQuoteOption;
  loading: boolean;
  failed: boolean;
  disabled: boolean;
  onSelect: (optionId: number) => void;
}

export function ShippingOptionPicker({ sellerName, itemCount, quote, selected, loading, failed, disabled, onSelect }: Props) {
  useLanguage();
  const activeOption = selected ?? quote?.options.find((option) => option.id === quote.defaultOptionId);
  return (
    <section className="flex flex-col gap-2" aria-label={translate(`การจัดส่งของ ${sellerName}`, `Shipping from ${sellerName}`)} aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h3 className="text-[13px] font-semibold">{translate("การจัดส่ง", "Shipping")}</h3>
        {!loading && quote?.options.length === 1 && <span className="text-[11px] text-muted-foreground">{translate("ร้านนี้มีวิธีจัดส่งเดียว · เลือกให้อัตโนมัติ", "This shop has one shipping method, selected automatically")}</span>}
      </div>
      {loading ? (
        <div role="status" aria-label={translate("กำลังโหลดตัวเลือกจัดส่ง", "Loading shipping options")} className="grid gap-2">
          <div className="checkout-shipping-skeleton" /><div className="checkout-shipping-skeleton" />
        </div>
      ) : failed ? (
        <p className="text-xs text-destructive">{translate("โหลดตัวเลือกจัดส่งไม่สำเร็จ กรุณาลองอีกครั้ง", "Could not load shipping options. Please try again")}</p>
      ) : !quote?.options.length ? (
        <div role="alert" className="checkout-alert checkout-alert-error">
          <p className="font-semibold">{translate("ร้านนี้ยังไม่ได้ตั้งค่าการจัดส่ง", "This shop has not configured shipping")}</p>
          <p>{translate("ยังสั่งซื้อสินค้าจากร้านนี้ไม่ได้ — นำออกจากรายการที่เลือก หรือทักร้านค้า", "Items from this shop cannot be ordered yet. Deselect them or contact the shop")}</p>
        </div>
      ) : (
        <RadioGroup
          aria-label={translate(`เลือกการจัดส่งของ ${sellerName}`, `Select shipping for ${sellerName}`)}
          value={activeOption ? String(activeOption.id) : ""}
          onValueChange={(value) => onSelect(Number(value))}
          disabled={disabled}
          className="gap-2"
        >
          {quote.options.map((option) => {
            // Display the undiscounted tariff only; the payable fee always comes from BE.
            const originalFee = option.baseFee + option.perItemFee * Math.max(0, itemCount - 1);
            return (
              <label key={option.id} className={cn("checkout-shipping-option", activeOption?.id === option.id && "is-selected", disabled && "opacity-60")}>
                <RadioGroupItem className="checkout-radio" value={String(option.id)} aria-label={`${option.name} ${sellerName}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold">{option.name}</span>
                    {option.carrierCode && <span className="checkout-chip">{carrierLabel(option.carrierCode)}</span>}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                    {checkoutMoney(option.baseFee)} + {checkoutMoney(option.perItemFee)} {translate("ต่อใบถัดไป", "per additional card")}{option.estDaysMin != null && option.estDaysMax != null && translate(` · ได้รับใน ${option.estDaysMin}–${option.estDaysMax} วัน`, ` · Arrives in ${option.estDaysMin}–${option.estDaysMax} days`)}
                  </span>
                  {option.free && option.freeThreshold != null && <span className="checkout-free mt-0.5 block text-[11px]">{translate("ยอดถึง", "Spend")} {checkoutMoney(option.freeThreshold)}  {translate("แล้ว — ส่งฟรี", "reached — free shipping")}</span>}
                  {option.amountToFree != null && <span className="mt-0.5 block text-[11px] text-amber-700">{translate("ซื้อเพิ่มอีก", "Spend another")} {checkoutMoney(option.amountToFree)}  {translate("จากร้านนี้ ส่งฟรี", "at this shop for free shipping")}</span>}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className={cn("text-sm font-bold", option.free && "checkout-free")}>{option.free ? translate("ส่งฟรี", "Free shipping") : checkoutMoney(option.fee)}</span>
                  {option.free && originalFee > 0 && <span className="text-[11px] text-muted-foreground line-through">{checkoutMoney(originalFee)}</span>}
                </span>
              </label>
            );
          })}
        </RadioGroup>
      )}
    </section>
  );
}
