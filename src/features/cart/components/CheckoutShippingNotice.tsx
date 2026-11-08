/** Shown after checkout swapped a delivery option that stopped being available. */
export function CheckoutShippingNotice({ sellerNames }: { sellerNames: string }) {
  return (
    <div role="alert" className="checkout-alert checkout-alert-warning">
      <p className="font-semibold">
        ตัวเลือกการจัดส่งของ {sellerNames} มีการเปลี่ยนแปลง
      </p>
      <p>เราเลือกวิธีจัดส่งให้ใหม่แล้ว โปรดตรวจสอบค่าส่งและยอดรวมอีกครั้ง</p>
    </div>
  );
}
