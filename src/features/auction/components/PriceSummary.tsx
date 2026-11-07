import { useLanguage } from "@/lib/language";
import { formatBaht } from "../auction.format";

type PriceSummaryProps = {
  /** [ป้าย, จำนวนเงิน] */
  rows: [string, number][];
  totalLabel: string;
  total: number;
};

/** กล่องสรุปราคาสีเทาอ่อนใน dialog / กล่องชนะประมูล — บรรทัดสุดท้ายตัวหนาสี primary [TCG-630] */
export function PriceSummary({ rows, totalLabel, total }: PriceSummaryProps) {
  useLanguage();
  return (
    <dl className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 text-sm">
      {rows.map(([label, amount]) => (
        <div key={label} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-semibold tabular-nums">{formatBaht(amount)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-3">
        <dt className="font-semibold">{totalLabel}</dt>
        <dd className="text-lg font-bold text-primary tabular-nums">{formatBaht(total)}</dd>
      </div>
    </dl>
  );
}
