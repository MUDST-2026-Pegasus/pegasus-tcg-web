import { translate } from "@/lib/i18n";

// @tolgee-key {"key": "miniCart.added", "ns": "buyer", "defaultValue": "เพิ่มลงตะกร้าแล้ว"}
// @tolgee-key {"key": "miniCart.updated", "ns": "buyer", "defaultValue": "อัปเดตจำนวนในตะกร้าแล้ว"}
// @tolgee-key {"key": "miniCart.close", "ns": "buyer", "defaultValue": "ปิดตะกร้าย่อ"}
// @tolgee-key {"key": "miniCart.cart", "ns": "buyer", "defaultValue": "ในตะกร้า"}
// @tolgee-key {"key": "miniCart.justAdded", "ns": "buyer", "defaultValue": "เพิ่งเพิ่ม"}
// @tolgee-key {"key": "miniCart.loading", "ns": "buyer", "defaultValue": "กำลังโหลดตะกร้า"}
// @tolgee-key {"key": "miniCart.failed", "ns": "buyer", "defaultValue": "โหลดตะกร้าไม่สำเร็จ"}
// @tolgee-key {"key": "miniCart.retry", "ns": "buyer", "defaultValue": "ลองใหม่"}
// @tolgee-key {"key": "miniCart.view", "ns": "buyer", "defaultValue": "ดูตะกร้า"}
// @tolgee-key {"key": "miniCart.checkout", "ns": "buyer", "defaultValue": "ชำระเงิน"}
// @tolgee-key {"key": "miniCart.continue", "ns": "buyer", "defaultValue": "เลือกซื้อต่อ"}
// @tolgee-key {"key": "miniCart.review", "ns": "buyer", "defaultValue": "ตรวจสอบในตะกร้า"}
// @tolgee-key {"key": "miniCart.subtotal", "ns": "buyer", "defaultValue": "ยอดรวมสินค้า"}
// @tolgee-key {"key": "miniCart.beforeDiscount", "ns": "buyer", "defaultValue": "ราคาสินค้า (ก่อนลด)"}
// @tolgee-key {"key": "miniCart.discount", "ns": "buyer", "defaultValue": "ส่วนลดราคาสินค้า"}
// @tolgee-key {"key": "miniCart.shipping", "ns": "buyer", "defaultValue": "ค่าส่งคำนวณตอนชำระเงิน"}
// @tolgee-key {"key": "miniCart.unavailable", "ns": "buyer", "defaultValue": "ขายหมดแล้ว · ไม่นับในยอดรวม"}
// @tolgee-key {"key": "miniCart.saleEnded", "ns": "buyer", "defaultValue": "การลดราคาจบแล้ว"}
// @tolgee-key {"key": "miniCart.addFailed", "ns": "buyer", "defaultValue": "เพิ่มลงตะกร้าไม่สำเร็จ"}
// @tolgee-key {"key": "miniCart.empty", "ns": "buyer", "defaultValue": "ไม่มีสินค้าในตะกร้า"}
// @tolgee-key {"key": "miniCart.quantityWithPrevious", "ns": "buyer", "defaultValue": "จำนวน {n} (เดิม {previous})"}
// @tolgee-key {"key": "miniCart.quantity", "ns": "buyer", "defaultValue": "จำนวน {n}"}
// @tolgee-key {"key": "miniCart.count", "ns": "buyer", "defaultValue": "{quantity} ชิ้น · {shops} ร้าน"}
// @tolgee-key {"key": "miniCart.attention", "ns": "buyer", "defaultValue": "มี {n} รายการต้องตรวจสอบในตะกร้าก่อนชำระเงิน"}
// @tolgee-key {"key": "miniCart.changed", "ns": "buyer", "defaultValue": "ราคาเปลี่ยน {before} → {after}"}
// @tolgee-key {"key": "miniCart.more", "ns": "buyer", "defaultValue": "ซื้อเพิ่มจาก {name} ส่งรวมกล่องเดียว"}
// @tolgee-key {"key": "miniCart.quickAdd", "ns": "buyer", "defaultValue": "เพิ่ม {name} ลงตะกร้า"}
// getter: อ่านตอนใช้ จะได้ตามภาษาปัจจุบัน
export const miniCartText = {
  get added() { return translate("buyer", "miniCart.added", "เพิ่มลงตะกร้าแล้ว"); },
  get updated() { return translate("buyer", "miniCart.updated", "อัปเดตจำนวนในตะกร้าแล้ว"); },
  get close() { return translate("buyer", "miniCart.close", "ปิดตะกร้าย่อ"); },
  get cart() { return translate("buyer", "miniCart.cart", "ในตะกร้า"); },
  get justAdded() { return translate("buyer", "miniCart.justAdded", "เพิ่งเพิ่ม"); },
  get loading() { return translate("buyer", "miniCart.loading", "กำลังโหลดตะกร้า"); },
  get failed() { return translate("buyer", "miniCart.failed", "โหลดตะกร้าไม่สำเร็จ"); },
  get retry() { return translate("buyer", "miniCart.retry", "ลองใหม่"); },
  get view() { return translate("buyer", "miniCart.view", "ดูตะกร้า"); },
  get checkout() { return translate("buyer", "miniCart.checkout", "ชำระเงิน"); },
  get continue() { return translate("buyer", "miniCart.continue", "เลือกซื้อต่อ"); },
  get review() { return translate("buyer", "miniCart.review", "ตรวจสอบในตะกร้า"); },
  get subtotal() { return translate("buyer", "miniCart.subtotal", "ยอดรวมสินค้า"); },
  get beforeDiscount() { return translate("buyer", "miniCart.beforeDiscount", "ราคาสินค้า (ก่อนลด)"); },
  get discount() { return translate("buyer", "miniCart.discount", "ส่วนลดราคาสินค้า"); },
  get shipping() { return translate("buyer", "miniCart.shipping", "ค่าส่งคำนวณตอนชำระเงิน"); },
  get unavailable() { return translate("buyer", "miniCart.unavailable", "ขายหมดแล้ว · ไม่นับในยอดรวม"); },
  get saleEnded() { return translate("buyer", "miniCart.saleEnded", "การลดราคาจบแล้ว"); },
  get addFailed() { return translate("buyer", "miniCart.addFailed", "เพิ่มลงตะกร้าไม่สำเร็จ"); },
  get empty() { return translate("buyer", "miniCart.empty", "ไม่มีสินค้าในตะกร้า"); },
  quantity: (n: number, previous = 0) => previous > 0 ? translate("buyer", "miniCart.quantityWithPrevious", "จำนวน {n} (เดิม {previous})", { n, previous }) : translate("buyer", "miniCart.quantity", "จำนวน {n}", { n }),
  count: (quantity: number, shops: number) => translate("buyer", "miniCart.count", "{quantity} ชิ้น · {shops} ร้าน", { quantity, shops }),
  attention: (n: number) => translate("buyer", "miniCart.attention", "มี {n} รายการต้องตรวจสอบในตะกร้าก่อนชำระเงิน", { n }),
  changed: (before: string, after: string) => translate("buyer", "miniCart.changed", "ราคาเปลี่ยน {before} → {after}", { before, after }),
  more: (name: string) => translate("buyer", "miniCart.more", "ซื้อเพิ่มจาก {name} ส่งรวมกล่องเดียว", { name }),
  quickAdd: (name: string) => translate("buyer", "miniCart.quickAdd", "เพิ่ม {name} ลงตะกร้า", { name }),
};
