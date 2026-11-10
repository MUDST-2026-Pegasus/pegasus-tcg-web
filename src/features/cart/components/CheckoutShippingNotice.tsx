import { useTranslate } from "@/lib/i18n";
/** Shown after checkout swapped a delivery option that stopped being available. */
export function CheckoutShippingNotice({ sellerNames }: { sellerNames: string }) {
  const { t } = useTranslate("buyer");
  return (
    <div role="alert" className="checkout-alert checkout-alert-warning">
      <p className="font-semibold">
        {t("checkout.shipping.changed", "ตัวเลือกการจัดส่งของ {names} มีการเปลี่ยนแปลง", { names: sellerNames })}
      </p>
      <p>{t("checkout.shipping.changedHint", "เราเลือกวิธีจัดส่งให้ใหม่แล้ว โปรดตรวจสอบค่าส่งและยอดรวมอีกครั้ง")}</p>
    </div>
  );
}
