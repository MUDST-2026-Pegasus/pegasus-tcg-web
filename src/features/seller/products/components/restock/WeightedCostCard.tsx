import { ArrowRight, TrendingUp } from "lucide-react";

import { formatBaht } from "@/features/seller/shared/seller.format";

import { formatBahtWithSatang } from "../../products.format";
import type { RestockCalculation } from "../../restock.calc";
import type { RestockData } from "../../restock.types";

type WeightedCostCardProps = RestockData["calculation"] & {
  product: RestockData["product"];
  result: RestockCalculation;
};

/** การ์ดพื้นดำแสดงที่มาของต้นทุนเฉลี่ยใหม่: ล็อตเดิม + ล็อตใหม่ = รวม */
export function WeightedCostCard({
  title,
  previousLotLabel,
  newLotLabel,
  totalLabel,
  newAverageLabel,
  beforeLabel,
  afterLabel,
  product,
  result,
}: WeightedCostCardProps) {
  const { unit } = product;

  const columns = [
    {
      id: "previous",
      label: previousLotLabel,
      detail: `${product.stock} ${unit} × ${formatBaht(product.averageCost)}`,
      value: formatBaht(result.previousValue),
    },
    {
      id: "new",
      label: newLotLabel,
      detail: `${result.quantity} ${unit} × ${formatBaht(result.unitCost)}`,
      value: formatBaht(result.totalCost),
    },
    {
      id: "total",
      label: totalLabel,
      detail: `${result.newStock} ${unit}`,
      value: formatBaht(result.combinedValue),
    },
  ];
  const operators = ["+", "="];

  return (
    <section className="flex w-full flex-col gap-4 rounded-xl bg-zinc-950 p-5">
      <div className="flex items-center gap-2">
        <TrendingUp aria-hidden="true" className="size-4 shrink-0 text-slate-50" />
        <h2 className="text-xs font-semibold text-white">{title}</h2>
      </div>

      <div className="flex items-center">
        {columns.map((column, index) => (
          <div key={column.id} className="contents">
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="flex w-6 shrink-0 justify-center text-base text-gray-500"
              >
                {operators[index - 1]}
              </span>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="text-xs text-gray-400">{column.label}</p>
              <p className="text-xs font-medium text-white">{column.detail}</p>
              <p className="text-base font-semibold text-white">{column.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-800" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-white">{newAverageLabel}</p>
          <p className="text-xs text-gray-400">
            {formatBaht(result.combinedValue)} ÷ {result.newStock} {unit}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-[3px]">
            <p className="text-[10px] text-gray-500">{beforeLabel}</p>
            <p className="text-sm text-gray-400">
              {formatBahtWithSatang(product.averageCost)}
            </p>
          </div>
          <ArrowRight aria-hidden="true" className="size-4 text-slate-500" />
          <div className="flex flex-col items-end gap-[3px]">
            <p className="text-[10px] text-gray-400">{afterLabel}</p>
            <p className="text-xl font-bold text-white">
              {formatBahtWithSatang(result.newAverageCost)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
