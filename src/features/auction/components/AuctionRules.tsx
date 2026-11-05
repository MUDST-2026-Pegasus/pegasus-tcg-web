// กติกาในหน้ารายละเอียดประมูล (B2) [TCG-629] — ข้อ 5 ตาม Figma ฉบับไม่มีผู้บิดอันดับ 2

const RULES: [string, string][] = [
  ["บิดแล้วถอนไม่ได้", "ตรวจราคาก่อนกดยืนยันทุกครั้ง"],
  ["ต่อเวลาอัตโนมัติ", "มีคนบิดใน 2 นาทีสุดท้าย เวลาจะกลับเป็น 2 นาที"],
  ["ซื้อทันที (ถ้าผู้ขายเปิด)", "ใช้ได้จนกว่าจะมีบิดแรก จากนั้นเป็นประมูลปกติ"],
  ["ชนะแล้วชำระใน 24 ชม.", "ไม่ชำระ = ถูกบันทึก 1 ครั้ง ครบ 3 ครั้งห้ามบิด 30 วัน"],
  ["ถ้าผู้ชนะไม่ชำระ", "คำสั่งซื้อถูกยกเลิก ผู้ชนะถูกบันทึก 1 ครั้ง ประมูลจบแบบไม่มีผู้ซื้อ และการ์ดกลับเข้าสต็อกของผู้ขาย"],
];

/** "กติกาการประมูล" 5 ข้อ + กล่อง "ใครบิดได้" */
export function AuctionRules() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-bold">กติกาการประมูล</h2>
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
        <h2 className="text-sm font-bold">ใครบิดได้</h2>
        <p className="mt-1 text-xs leading-5">
          ล็อกอินและยืนยันอีเมลแล้ว · มีที่อยู่จัดส่งอย่างน้อย 1 ที่ · ไม่ติดโทษห้ามบิด · ผู้ขายบิดของตัวเองไม่ได้
        </p>
      </section>
    </div>
  );
}
