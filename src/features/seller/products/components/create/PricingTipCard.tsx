import { Star } from "lucide-react";

/** เคล็ดลับข้างฟอร์ม — คำแนะนำทั่วไป ไม่อ้างตัวเลขสถิติที่ระบบไม่ได้วัดจริง */
export function PricingTipCard() {
  return (
    <div className="flex w-full flex-col gap-2 rounded-xl bg-emerald-50 p-4">
      <div className="flex items-center gap-2">
        <Star aria-hidden="true" className="size-4 text-teal-600" />
        <p className="text-xs font-semibold text-teal-600">เคล็ดลับตั้งราคา</p>
      </div>
      <p className="text-xs leading-4 text-teal-600">
        ตั้งราคาใกล้ค่ากลางของประกาศที่ขายอยู่ช่วยให้ขายได้เร็วขึ้น ถ้าการ์ดสภาพดีกว่าคนอื่น
        ค่อยตั้งสูงกว่าและใส่รูปมุมให้ครบ
      </p>
    </div>
  );
}
