import { TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    <aside className="grid min-w-0 gap-4 lg:sticky lg:top-4">
      <Card className="gap-3 rounded-[12px] border border-border p-5 shadow-none ring-0">
        <h2 className="text-[13px] font-semibold">ผู้ซื้อจะเห็นแบบนี้</h2>
        <ClaimTicketPreview promotion={form} />
      </Card>
      {/* การ์ดคำนวณใน Figma เป็นพื้นกลับสีจากธีม */}
      <Card className="gap-0 rounded-[12px] bg-foreground p-5 text-background shadow-none ring-0">
        <h2 className="text-[13px] font-semibold">ตัวอย่างการคำนวณ (ตะกร้า {formatBaht(sample.subtotal)})</h2>
        <dl className="mt-2.5 grid gap-2.5 border-b border-background/20 pb-2.5 text-xs [&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&_dt]:opacity-70 [&_dd]:font-medium">
          <div>
            <dt>ยอดสินค้า</dt>
            <dd>{formatBaht(sample.subtotal)}</dd>
          </div>
          <div>
            <dt>{discountRow}</dt>
            <dd className="text-[#41c987]">− {formatBaht(sample.discount)}</dd>
          </div>
          <div>
            <dt>ผู้ซื้อจ่าย (ไม่รวมค่าส่ง)</dt>
            <dd>{formatBaht(sample.buyerPays)}</dd>
          </div>
          <div>
            <dt>ร้านค้าได้รับ (ก่อนคอมมิชชั่น)</dt>
            <dd>{formatBaht(sample.sellerReceives)}</dd>
          </div>
        </dl>
        <p className="mt-2.5 flex items-center justify-between gap-3 text-[13px] font-semibold">
          <span>Pegasus ออกส่วนลด</span>
          <strong className="text-[22px] leading-7 font-black">{formatBaht(sample.discount)}</strong>
        </p>
      </Card>
      <Card className="gap-2 rounded-[12px] border border-border p-5 shadow-none ring-0">
        <h2 className="text-[13px] font-semibold">งบสูงสุดของแคมเปญ</h2>
        <strong className="text-[22px] leading-7 font-black">{budgetLabel(form)}</strong>
        <p className="text-xs text-muted-foreground">{budgetFormula(form, true)} — ใช้ประเมินต้นทุนก่อนเปิดใช้</p>
      </Card>
      <Alert className="rounded-[12px] border-[#fde4bd] bg-[#fff1db] p-4 text-[#a7610b]">
        <TriangleAlert />
        <AlertTitle className="text-[13px] font-semibold">หลังมีคนใช้โค้ดแล้ว</AlertTitle>
        <AlertDescription className="text-xs text-[#a7610b]">
          แก้ได้เฉพาะชื่อแคมเปญ, ยืดวันสิ้นสุด, เพิ่มจำนวนสิทธิ์ และหยุดชั่วคราว — ประเภท/มูลค่า/เงื่อนไขล็อก
          เพื่อให้ทุกออเดอร์คิดส่วนลดแบบเดียวกัน
        </AlertDescription>
      </Alert>
    </aside>
  );
}
