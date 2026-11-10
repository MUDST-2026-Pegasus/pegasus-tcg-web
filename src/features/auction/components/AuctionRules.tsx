import { useTranslate, translate } from "@/lib/i18n";
// กติกาในหน้ารายละเอียดประมูล (B2) [TCG-629] — ข้อ 5 ตาม Figma ฉบับไม่มีผู้บิดอันดับ 2

const rules = (): [string, string][] => [
  [translate("auction", "buyer.auctionRules.text", "บิดแล้วถอนไม่ได้"), translate("auction", "buyer.auctionRules.text2", "ตรวจราคาก่อนกดยืนยันทุกครั้ง")],
  [translate("auction", "buyer.auctionRules.text3", "ต่อเวลาอัตโนมัติ"), translate("auction", "buyer.auctionRules.text4", "มีคนบิดใน 2 นาทีสุดท้าย เวลาจะกลับเป็น 2 นาที")],
  [translate("auction", "buyer.auctionRules.text5", "ซื้อทันที (ถ้าผู้ขายเปิด)"), translate("auction", "buyer.auctionRules.text6", "ใช้ได้จนกว่าจะมีบิดแรก จากนั้นเป็นประมูลปกติ")],
  [translate("auction", "buyer.auctionRules.text7", "ชนะแล้วชำระใน 24 ชม."), translate("auction", "buyer.auctionRules.text8", "ไม่ชำระ = ถูกบันทึก 1 ครั้ง ครบ 3 ครั้งห้ามบิด 30 วัน")],
  [translate("auction", "buyer.auctionRules.text9", "ถ้าผู้ชนะไม่ชำระ"), translate("auction", "buyer.auctionRules.text10", "คำสั่งซื้อถูกยกเลิก ผู้ชนะถูกบันทึก 1 ครั้ง ประมูลจบแบบไม่มีผู้ซื้อ และการ์ดกลับเข้าสต็อกของผู้ขาย")],
];

/** "กติกาการประมูล" 5 ข้อ + กล่อง "ใครบิดได้" */
export function AuctionRules() {
  const { t } = useTranslate("auction");
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-bold">{t("buyer.auctionRules.text11", "กติกาการประมูล")}</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {rules().map(([title, detail]) => (
            <li key={title}>
              <p className="text-sm font-semibold">• {title}</p>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl bg-sky-50 p-4 text-sky-800">
        <h2 className="text-sm font-bold">{t("buyer.auctionRules.text12", "ใครบิดได้")}</h2>
        <p className="mt-1 text-xs leading-5">
          {t("buyer.auctionRules.text13", "ล็อกอินและยืนยันอีเมลแล้ว · มีที่อยู่จัดส่งอย่างน้อย 1 ที่ · ไม่ติดโทษห้ามบิด · ผู้ขายบิดของตัวเองไม่ได้")}
        </p>
      </section>
    </div>
  );
}

// @tolgee-key {"key": "buyer.auctionRules.text", "ns": "auction", "defaultValue": "บิดแล้วถอนไม่ได้"}
// @tolgee-key {"key": "buyer.auctionRules.text2", "ns": "auction", "defaultValue": "ตรวจราคาก่อนกดยืนยันทุกครั้ง"}
// @tolgee-key {"key": "buyer.auctionRules.text3", "ns": "auction", "defaultValue": "ต่อเวลาอัตโนมัติ"}
// @tolgee-key {"key": "buyer.auctionRules.text4", "ns": "auction", "defaultValue": "มีคนบิดใน 2 นาทีสุดท้าย เวลาจะกลับเป็น 2 นาที"}
// @tolgee-key {"key": "buyer.auctionRules.text5", "ns": "auction", "defaultValue": "ซื้อทันที (ถ้าผู้ขายเปิด)"}
// @tolgee-key {"key": "buyer.auctionRules.text6", "ns": "auction", "defaultValue": "ใช้ได้จนกว่าจะมีบิดแรก จากนั้นเป็นประมูลปกติ"}
// @tolgee-key {"key": "buyer.auctionRules.text7", "ns": "auction", "defaultValue": "ชนะแล้วชำระใน 24 ชม."}
// @tolgee-key {"key": "buyer.auctionRules.text8", "ns": "auction", "defaultValue": "ไม่ชำระ = ถูกบันทึก 1 ครั้ง ครบ 3 ครั้งห้ามบิด 30 วัน"}
// @tolgee-key {"key": "buyer.auctionRules.text9", "ns": "auction", "defaultValue": "ถ้าผู้ชนะไม่ชำระ"}
// @tolgee-key {"key": "buyer.auctionRules.text10", "ns": "auction", "defaultValue": "คำสั่งซื้อถูกยกเลิก ผู้ชนะถูกบันทึก 1 ครั้ง ประมูลจบแบบไม่มีผู้ซื้อ และการ์ดกลับเข้าสต็อกของผู้ขาย"}
