import { translate, useLanguage } from "@/lib/language";
// กติกาในหน้ารายละเอียดประมูล (B2) [TCG-629] — ข้อ 5 ตาม Figma ฉบับไม่มีผู้บิดอันดับ 2

const RULES: [string, string][] = [
  [translate("บิดแล้วถอนไม่ได้", "Bids cannot be withdrawn"), translate("ตรวจราคาก่อนกดยืนยันทุกครั้ง", "Check the price before confirming each bid")],
  [translate("ต่อเวลาอัตโนมัติ", "Automatic extension"), translate("มีคนบิดใน 2 นาทีสุดท้าย เวลาจะกลับเป็น 2 นาที", "A bid in the last 2 minutes resets the timer to 2 minutes")],
  [translate("ซื้อทันที (ถ้าผู้ขายเปิด)", "Buy now (if enabled by seller)"), translate("ใช้ได้จนกว่าจะมีบิดแรก จากนั้นเป็นประมูลปกติ", "Available until the first bid, then regular bidding continues")],
  [translate("ชนะแล้วชำระใน 24 ชม.", "Pay within 24 hours after winning"), translate("ไม่ชำระ = ถูกบันทึก 1 ครั้ง ครบ 3 ครั้งห้ามบิด 30 วัน", "Non-payment = one strike; three strikes suspend bidding for 30 days")],
  [translate("ถ้าผู้ชนะไม่ชำระ", "If the winner does not pay"), translate("คำสั่งซื้อถูกยกเลิก ผู้ชนะถูกบันทึก 1 ครั้ง ประมูลจบแบบไม่มีผู้ซื้อ และการ์ดกลับเข้าสต็อกของผู้ขาย", "The order is cancelled, the winner receives one strike, the auction ends without a buyer, and the card returns to the seller's stock")],
];

/** "กติกาการประมูล" 5 ข้อ + กล่อง "ใครบิดได้" */
export function AuctionRules() {
  useLanguage();
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-bold">{translate("กติกาการประมูล", "Auction rules")}</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {RULES.map(([title, detail]) => (
            <li key={title}>
              <p className="text-sm font-semibold">• {title}</p>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl bg-sky-50 p-4 text-sky-800">
        <h2 className="text-sm font-bold">{translate("ใครบิดได้", "Who can bid")}</h2>
        <p className="mt-1 text-xs leading-5">{translate("ล็อกอินและยืนยันอีเมลแล้ว · มีที่อยู่จัดส่งอย่างน้อย 1 ที่ · ไม่ติดโทษห้ามบิด · ผู้ขายบิดของตัวเองไม่ได้", "Sign in and verify your email · Add at least one shipping address · No bidding suspension · Sellers cannot bid on their own auctions")}</p>
      </section>
    </div>
  );
}
