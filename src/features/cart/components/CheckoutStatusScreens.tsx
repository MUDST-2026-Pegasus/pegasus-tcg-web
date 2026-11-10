import { FormPageSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/lib/i18n";

/** Whole-page states shown before the checkout form: loading, cart error, nothing selected. */
export function CheckoutLoading() {
  const { t } = useTranslate("buyer");
  return (
    <div className="checkout-page">
      <FormPageSkeleton label={t("checkout.status.loading", "กำลังเตรียมคำสั่งซื้อ")} />
    </div>
  );
}

export function CheckoutCartError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslate("buyer");
  return (
    <div className="checkout-page">
      <div role="alert" className="checkout-container checkout-alert checkout-alert-error">
        <p>{t("cart.page.loadFailed", "โหลดตะกร้าไม่สำเร็จ")}</p>
        <Button variant="outline" onClick={onRetry}>
          {t("cart.common.tryAgain", "ลองอีกครั้ง")}
        </Button>
      </div>
    </div>
  );
}

export function CheckoutEmpty({ onBackToCart }: { onBackToCart: () => void }) {
  const { t } = useTranslate("buyer");
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="text-xl font-bold">{t("checkout.status.empty", "ไม่พบสินค้าที่เลือกสั่งซื้อ")}</h1>
        <Button onClick={onBackToCart} className="mt-4">
          {t("checkout.status.backToCart", "กลับไปยังตะกร้า")}
        </Button>
      </div>
    </div>
  );
}
