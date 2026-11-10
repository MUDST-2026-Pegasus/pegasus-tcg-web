import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { carrierLabel } from "@/features/seller/shared/carriers";
import { cn } from "@/lib/utils";
import { checkoutMoney } from "../checkout.format";
import type { ShippingQuote, ShippingQuoteOption } from "../checkout.types";
import { useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("buyer");
  const activeOption = selected ?? quote?.options.find((option) => option.id === quote.defaultOptionId);
  return (
    <section className="flex flex-col gap-2" aria-label={t("checkout.shipping.sectionAria", "การจัดส่งของ {name}", { name: sellerName })} aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h3 className="text-[13px] font-semibold">{t("checkout.shipping.title", "การจัดส่ง")}</h3>
        {!loading && quote?.options.length === 1 && <span className="text-[11px] text-muted-foreground">{t("checkout.shipping.single", "ร้านนี้มีวิธีจัดส่งเดียว · เลือกให้อัตโนมัติ")}</span>}
      </div>
      {loading ? (
        <div role="status" aria-label={t("checkout.shipping.loading", "กำลังโหลดตัวเลือกจัดส่ง")} className="grid gap-2">
          <div className="checkout-shipping-skeleton" /><div className="checkout-shipping-skeleton" />
        </div>
      ) : failed ? (
        <p className="text-xs text-destructive">{t("checkout.shipping.failed", "โหลดตัวเลือกจัดส่งไม่สำเร็จ กรุณาลองอีกครั้ง")}</p>
      ) : !quote?.options.length ? (
        <div role="alert" className="checkout-alert checkout-alert-error">
          <p className="font-semibold">{t("checkout.shipping.notSet", "ร้านนี้ยังไม่ได้ตั้งค่าการจัดส่ง")}</p>
          <p>{t("checkout.shipping.notSetHint", "ยังสั่งซื้อสินค้าจากร้านนี้ไม่ได้ — นำออกจากรายการที่เลือก หรือทักร้านค้า")}</p>
        </div>
      ) : (
        <RadioGroup
          aria-label={t("checkout.shipping.pickAria", "เลือกการจัดส่งของ {name}", { name: sellerName })}
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
                    {t("checkout.shipping.fee", "{base} + {perItem} ต่อใบถัดไป", { base: checkoutMoney(option.baseFee), perItem: checkoutMoney(option.perItemFee) })}
                    {option.estDaysMin != null && option.estDaysMax != null && t("checkout.shipping.eta", " · ได้รับใน {min}–{max} วัน", { min: option.estDaysMin, max: option.estDaysMax })}
                  </span>
                  {option.free && option.freeThreshold != null && <span className="checkout-free mt-0.5 block text-[11px]">{t("checkout.shipping.freeReached", "ยอดถึง {amount} แล้ว — ส่งฟรี", { amount: checkoutMoney(option.freeThreshold) })}</span>}
                  {option.amountToFree != null && <span className="mt-0.5 block text-[11px] text-amber-700">{t("checkout.shipping.toFree", "ซื้อเพิ่มอีก {amount} จากร้านนี้ ส่งฟรี", { amount: checkoutMoney(option.amountToFree) })}</span>}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className={cn("text-sm font-bold", option.free && "checkout-free")}>{option.free ? t("cart.common.freeShipping", "ส่งฟรี") : checkoutMoney(option.fee)}</span>
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
