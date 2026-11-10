import { CHECKOUT_CARD_CLASS } from "@/features/cart/checkout.styles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Address } from "@/features/account/address.types";
import { formatAddressLines } from "@/features/account/address.format";
import { useTranslate } from "@/lib/i18n";

interface CheckoutAddressSummaryProps {
  address: Address | null;
  loading: boolean;
  error: boolean;
  disabled: boolean;
  onChange(): void;
  onRetry(): void;
}

export function CheckoutAddressSummary({
  address, loading, error, disabled, onChange, onRetry,
}: CheckoutAddressSummaryProps) {
  const { t } = useTranslate("buyer");
  return (
    <Card className={CHECKOUT_CARD_CLASS}>
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <h2 className="font-semibold">{t("checkout.address.title", "ที่อยู่จัดส่ง")}</h2>
        <Button type="button" variant="link" className="h-auto p-0 text-[13px]"
          disabled={disabled || error || loading} onClick={onChange}>
          {address ? t("cart.code.change", "เปลี่ยน") : t("checkout.address.addShort", "เพิ่มที่อยู่")}
        </Button>
      </div>
      {loading ? (
        <div role="status" aria-label={t("checkout.address.loading", "กำลังโหลดที่อยู่จัดส่ง")} className="grid gap-2">
          <div className="checkout-shipping-skeleton" />
          <div className="checkout-shipping-skeleton" />
        </div>
      ) : error ? (
        <div role="alert" className="text-xs text-destructive">
          {t("checkout.address.failed", "โหลดที่อยู่ไม่สำเร็จ")}{" "}
          <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={onRetry}>
            {t("cart.common.tryAgain", "ลองอีกครั้ง")}
          </Button>
        </div>
      ) : address ? (
        <div className="text-xs leading-[18px] text-muted-foreground">
          <p className="font-medium text-foreground">{address.recipientName} · {address.phone}</p>
          <p>{formatAddressLines(address).join(" ")}</p>
        </div>
      ) : (
        <p role="alert" className="text-xs text-destructive">{t("checkout.address.required", "เพิ่มที่อยู่จัดส่งเพื่อดำเนินการต่อ")}</p>
      )}
    </Card>
  );
}
