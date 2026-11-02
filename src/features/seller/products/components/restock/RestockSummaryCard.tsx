import { Card } from "@/components/ui/card";
import { formatBaht } from "@/features/seller/shared/seller.format";
import { cn } from "@/lib/utils";

import { formatSignedBaht } from "../../products.format";
import type { RestockCalculation } from "../../restock.calc";
import type { RestockData } from "../../restock.types";

type RestockSummaryCardProps = RestockData["summary"] & {
  product: RestockData["product"];
  result: RestockCalculation;
};

export function RestockSummaryCard({
  title,
  newStockLabel,
  averageCostLabel,
  sellingPriceLabel,
  profitPerUnitLabel,
  product,
  result,
}: RestockSummaryCardProps) {
  const rows = [
    {
      id: "stock",
      label: newStockLabel,
      value: `${result.newStock} ${product.unit}`,
      className: "text-foreground",
    },
    {
      id: "average-cost",
      label: averageCostLabel,
      value: formatBaht(result.newAverageCost),
      className: "text-foreground",
    },
    {
      id: "selling-price",
      label: sellingPriceLabel,
      value: formatBaht(product.sellingPrice),
      className: "text-foreground",
    },
    {
      id: "profit",
      label: profitPerUnitLabel,
      value: formatSignedBaht(result.newProfit),
      className: result.newProfit < 0 ? "text-destructive" : "text-emerald-700",
    },
  ];

  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-xs font-semibold text-foreground">{title}</p>

      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">{row.label}</p>
          <p className={cn("text-xs font-semibold", row.className)}>
            {row.value}
          </p>
        </div>
      ))}
    </Card>
  );
}
