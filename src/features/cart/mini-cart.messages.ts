import { translate } from "@/lib/language";
export const miniCartText = {
  get added() { return translate("เพิ่มลงตะกร้าแล้ว", "Added to cart"); },
  get updated() { return translate("อัปเดตจำนวนในตะกร้าแล้ว", "Cart quantity updated"); },
  get close() { return translate("ปิดตะกร้าย่อ", "Close mini cart"); },
  get cart() { return translate("ในตะกร้า", "In cart"); },
  get justAdded() { return translate("เพิ่งเพิ่ม", "Just added"); },
  get loading() { return translate("กำลังโหลดตะกร้า", "Loading cart"); },
  get failed() { return translate("โหลดตะกร้าไม่สำเร็จ", "Could not load cart"); },
  get retry() { return translate("ลองใหม่", "Try again"); },
  get view() { return translate("ดูตะกร้า", "View cart"); },
  get checkout() { return translate("ชำระเงิน", "Checkout"); },
  get continue() { return translate("เลือกซื้อต่อ", "Continue shopping"); },
  get review() { return translate("ตรวจสอบในตะกร้า", "Review in cart"); },
  get subtotal() { return translate("ยอดรวมสินค้า", "Items subtotal"); },
  get beforeDiscount() { return translate("ราคาสินค้า (ก่อนลด)", "Items before discount"); },
  get discount() { return translate("ส่วนลดราคาสินค้า", "Item discount"); },
  get shipping() { return translate("ค่าส่งคำนวณตอนชำระเงิน", "Shipping calculated at checkout"); },
  get unavailable() { return translate("ขายหมดแล้ว · ไม่นับในยอดรวม", "Sold out · excluded from total"); },
  get saleEnded() { return translate("การลดราคาจบแล้ว", "The sale has ended"); },
  get addFailed() { return translate("เพิ่มลงตะกร้าไม่สำเร็จ", "Could not add to cart"); },
  get empty() { return translate("ไม่มีสินค้าในตะกร้า", "Your cart is empty"); },
  quantity: (n: number, previous = 0) =>
    translate(`จำนวน ${n}${previous > 0 ? ` (เดิม ${previous})` : ""}`, `Quantity ${n}${previous > 0 ? ` (previously ${previous})` : ""}`),
  count: (quantity: number, shops: number) =>
    translate(`${quantity} ชิ้น · ${shops} ร้าน`, `${quantity} items · ${shops} shops`),
  attention: (n: number) => translate(`มี ${n} รายการต้องตรวจสอบในตะกร้าก่อนชำระเงิน`, `${n} items need review in your cart before checkout`),
  changed: (before: string, after: string) =>
    translate(`ราคาเปลี่ยน ${before} → ${after}`, `Price changed ${before} → ${after}`),
  more: (name: string) => translate(`ซื้อเพิ่มจาก ${name} ส่งรวมกล่องเดียว`, `Buy more from ${name} and ship in one parcel`),
  quickAdd: (name: string) => translate(`เพิ่ม ${name} ลงตะกร้า`, `Add ${name} to cart`),
} as const;
