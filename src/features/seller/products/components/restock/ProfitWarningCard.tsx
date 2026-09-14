import { TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { formatBaht } from "@/features/seller/shared/seller.format";

import { formatSignedBaht } from "../../products.format";
import type { RestockCalculation } from "../../restock.calc";
import type { RestockData } from "../../restock.types";

type ProfitWarningCardProps = RestockData["profitWarning"] & {
  productId: string;
  averageCost: number;
  result: RestockCalculation;
};

/** โผล่เมื่อล็อตใหม่ทำให้ต้นทุนเฉลี่ยขึ้นจนกำไรต่อใบลดลง พร้อมราคาที่แนะนำ */
export function ProfitWarningCard({
  title,
  adjustPriceLabel,
  productId,
  averageCost,
  result,
}: ProfitWarningCardProps) {
  return (
    <div role="status" className="flex w-full flex-col gap-2 rounded-xl bg-orange-100 p-4">
      <div className="flex items-center gap-2">
        <TriangleAlert aria-hidden="true" className="size-4 text-amber-700" />
        <p className="text-xs font-semibold text-amber-700">{title}</p>
      </div>

      <p className="text-xs leading-4 text-amber-700">
        ต้นทุนเฉลี่ยขึ้นจาก {formatBaht(averageCost)} เป็น{" "}
        {formatBaht(result.newAverageCost)} ทำให้กำไรต่อใบลดจาก{" "}
        {formatSignedBaht(result.previousProfit)} เหลือ{" "}
        {formatSignedBaht(result.newProfit)} พิจารณาปรับราคาขายเป็น{" "}
        {formatBaht(result.suggestedPrice)}
      </p>

      {/* ไปหน้าแก้ไขสินค้าแล้วโฟกัสช่องราคา — ค่าที่กรอกในหน้าเติมสต็อกยังไม่ถูกบันทึก */}
      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-md px-2.5"
        render={<Link to={`/seller/products/${productId}/edit?focus=price`} />}
        nativeButton={false}
      >
        {adjustPriceLabel}
      </Button>
    </div>
  );
}
