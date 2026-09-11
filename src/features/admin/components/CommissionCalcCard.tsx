import type { AdminCommissionData } from "@/features/admin/admin.types";

type CommissionCalcCardProps = AdminCommissionData["calculation"];

/**
 * การ์ด "ตัวอย่างการคำนวณ" — พื้นดำ ตัวอักษรขาว
 * ไม่ใช้ ui/card เพราะดีไซน์เป็นสีเข้มที่ไม่ตรงกับ token card ของแอป
 */
export function CommissionCalcCard({
  title,
  rows,
  totalLabel,
  totalValue,
}: CommissionCalcCardProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-[#090b0c] px-5 py-5 text-white">
      <p className="text-sm font-semibold">{title}</p>

      <dl className="flex flex-col gap-[11px] text-[13px] text-white/85">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-4">
            <dt>{row.label}</dt>
            <dd className="font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="h-px bg-white/15" />

      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-white/85">{totalLabel}</span>
        <span className="text-2xl font-bold tabular-nums">{totalValue}</span>
      </div>
    </section>
  );
}
