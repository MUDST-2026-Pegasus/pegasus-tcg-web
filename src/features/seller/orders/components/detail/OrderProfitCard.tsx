import type { ProfitSummary } from "../../orders.format";
import { useTranslate } from "@/lib/i18n";

/** การ์ดพื้นดำสรุปกำไรหลังหักต้นทุนสินค้า */
export function OrderProfitCard({ rows, net }: ProfitSummary) {
  const { t } = useTranslate("seller");
  return (
    <div className="flex w-full flex-col gap-3.5 rounded-xl bg-foreground p-5">
      <p className="text-xs font-semibold text-white">{t("orderDetail.profit.title", "กำไรจากออเดอร์นี้")}</p>

      {rows.map((row, index) => (
        <div key={row.id} className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400">{row.label}</p>
          <p className={index === 0 ? "text-xs font-medium text-white" : "text-xs font-medium text-gray-400"}>
            {row.value}
          </p>
        </div>
      ))}

      <div className="h-px bg-gray-800" />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-white">{t("orders.money.net", "กำไรสุทธิ")}</p>
        <p className="text-xl font-bold text-teal-300">{net}</p>
      </div>
    </div>
  );
}
