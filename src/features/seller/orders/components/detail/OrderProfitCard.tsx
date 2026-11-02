import type { ProfitSummary } from "../../orders.format";
import { PromotionDiscountLines } from "@/features/promotions/components/PromotionDiscountLines";
import { formatBaht } from "@/features/seller/shared/seller.format";

/** การ์ดพื้นดำสรุปกำไรของออเดอร์ — ยอดขายรวมค่าจัดส่งที่ผู้ซื้อจ่ายแล้ว */
export function OrderProfitCard({ rows, net, promotionBreakdown }: ProfitSummary) {
  return (
    <div className="flex w-full flex-col gap-3.5 rounded-xl bg-foreground p-5">
      <p className="text-xs font-semibold text-white">กำไรจากออเดอร์นี้</p>

      {rows.map((row, index) => (
        <div key={row.id} className="contents">
          {row.id === "buyer-paid" && promotionBreakdown && (
            <PromotionDiscountLines
              sellerDiscount={promotionBreakdown.sellerDiscount}
              platformDiscount={promotionBreakdown.platformDiscount}
              promotions={promotionBreakdown.promotions}
              formatAmount={formatBaht}
              appearance="dark"
              labelStyle="funding"
              className="flex flex-col gap-3"
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-400">{row.label}</p>
            <p className={index === 0 ? "text-xs font-medium text-white" : "text-xs font-medium text-gray-400"}>
              {row.value}
            </p>
          </div>
        </div>
      ))}

      <div className="h-px bg-gray-800" />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-white">กำไรสุทธิ</p>
        <p className="text-xl font-bold text-teal-300">{net}</p>
      </div>

      {!!promotionBreakdown?.platformDiscount && (
        <p className="rounded-lg bg-sky-950 px-3 py-2 text-xs leading-relaxed text-sky-200">
          โค้ด Pegasus ไม่ลดรายได้ร้าน — เงินส่วนนี้โอนเข้ากระเป๋าร้านพร้อมกันตอนปล่อยเงิน
        </p>
      )}
    </div>
  );
}
