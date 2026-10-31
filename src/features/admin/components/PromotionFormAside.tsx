import { Card } from "@/components/ui/card";

import { budgetFormula, budgetLabel, formatBaht, sampleCalculation } from "../promotions.format";
import type { AdminPromotionInput } from "../promotions.types";
import { ClaimTicketPreview } from "./ClaimTicketPreview";

/** คอลัมน์ขวาของ Figma PRM-A2 — ตั๋วตัวอย่าง การคำนวณ และงบสูงสุด อัปเดตตามฟอร์มทันที */
export function PromotionFormAside({ form }: { form: AdminPromotionInput }) {
  const sample = sampleCalculation(form);
  const discountRow =
    form.discountType === "PERCENT"
      ? `ส่วนลด ${form.discountValue ?? 0}% (สูงสุด ${form.maxDiscount == null ? "ไม่จำกัด" : formatBaht(form.maxDiscount)})`
      : form.discountType === "FIXED"
        ? `ส่วนลด ${formatBaht(form.discountValue)}`
        : "ส่วนลดค่าจัดส่ง";

  return (
    <aside className="promotion-form-aside">
      <Card className="promotion-aside-card">
        <h2>ผู้ซื้อจะเห็นแบบนี้</h2>
        <ClaimTicketPreview promotion={form} />
      </Card>
      <Card className="promotion-calculation">
        <h2>ตัวอย่างการคำนวณ (ตะกร้า {formatBaht(sample.subtotal)})</h2>
        <div className="promotion-calculation-rows">
          <p>
            <span>ยอดสินค้า</span>
            <strong>{formatBaht(sample.subtotal)}</strong>
          </p>
          <p className="promotion-discount-line">
            <span>{discountRow}</span>
            <strong>− {formatBaht(sample.discount)}</strong>
          </p>
          <p>
            <span>ผู้ซื้อจ่าย (ไม่รวมค่าส่ง)</span>
            <strong>{formatBaht(sample.buyerPays)}</strong>
          </p>
          <p>
            <span>ร้านค้าได้รับ (ก่อนคอมมิชชั่น)</span>
            <strong>{formatBaht(sample.sellerReceives)}</strong>
          </p>
        </div>
        <p className="promotion-calculation-total">
          <span>Pegasus ออกส่วนลด</span>
          <strong>{formatBaht(sample.discount)}</strong>
        </p>
      </Card>
      <Card className="promotion-aside-card promotion-budget">
        <h2>งบสูงสุดของแคมเปญ</h2>
        <strong>{budgetLabel(form)}</strong>
        <p>{budgetFormula(form, true)} — ใช้ประเมินต้นทุนก่อนเปิดใช้</p>
      </Card>
      <div className="promotion-warning">
        <strong>⚠ หลังมีคนใช้โค้ดแล้ว</strong>
        <p>
          แก้ได้เฉพาะชื่อแคมเปญ, ยืดวันสิ้นสุด, เพิ่มจำนวนสิทธิ์ และหยุดชั่วคราว — ประเภท/มูลค่า/เงื่อนไขล็อก
          เพื่อให้ทุกออเดอร์คิดส่วนลดแบบเดียวกัน
        </p>
      </div>
    </aside>
  );
}
