import { FormPageSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";

/** Whole-page states shown before the checkout form: loading, cart error, nothing selected. */
export function CheckoutLoading() {
  return (
    <div className="checkout-page">
      <FormPageSkeleton label="กำลังเตรียมคำสั่งซื้อ" />
    </div>
  );
}

export function CheckoutCartError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="checkout-page">
      <div role="alert" className="checkout-container checkout-alert checkout-alert-error">
        <p>โหลดตะกร้าไม่สำเร็จ</p>
        <Button variant="outline" onClick={onRetry}>
          ลองอีกครั้ง
        </Button>
      </div>
    </div>
  );
}

export function CheckoutEmpty({ onBackToCart }: { onBackToCart: () => void }) {
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="text-xl font-bold">ไม่พบสินค้าที่เลือกสั่งซื้อ</h1>
        <Button onClick={onBackToCart} className="mt-4">
          กลับไปยังตะกร้า
        </Button>
      </div>
    </div>
  );
}
