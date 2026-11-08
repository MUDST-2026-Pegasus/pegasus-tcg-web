import { useState } from "react";

import { carrierMatch, defaultCarrier } from "./orders.format";
import type { ShippingChoice } from "./orders.types";

/**
 * ช่องบริษัทขนส่งของฟอร์มยืนยันจัดส่ง
 *
 * เก็บแค่ค่าที่ผู้ขายเลือกเอง ส่วนค่าเริ่มต้นคำนวณจากออเดอร์ทุกครั้ง
 * ข้อมูลมาทีหลังจึงไม่ค้างเป็นค่าเก่า และไม่ทับค่าที่ผู้ขายเปลี่ยนแล้ว
 */
export function useCarrierPicker(choice: ShippingChoice | null) {
  const [picked, setPicked] = useState<string | null>(null);
  const carrier = picked ?? defaultCarrier(choice);
  return { carrier, setCarrier: setPicked, match: carrierMatch(choice, carrier) };
}
