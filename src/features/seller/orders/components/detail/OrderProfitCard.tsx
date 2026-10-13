import type { ProfitSummary } from "../../orders.format";

/** การ์ดพื้นดำสรุปกำไรของออเดอร์ — ยอดขายรวมค่าจัดส่งที่ผู้ซื้อจ่ายแล้ว */
export function OrderProfitCard({ rows, net }: ProfitSummary) {
  return (
    <div className="flex w-full flex-col gap-3.5 rounded-xl bg-zinc-950 p-5">
      <p className="text-xs font-semibold text-white">กำไรจากออเดอร์นี้</p>

      {rows.map((row, index) => (
        <div key={row.id} className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400">{row.label}</p>
          <p
            className={
              index === 0 ? "text-xs font-medium text-white" : "text-xs font-medium text-gray-400"
            }
          >
            {row.value}
          </p>
        </div>
      ))}

      <div className="h-px bg-gray-800" />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-white">กำไรสุทธิ</p>
        <p className="text-xl font-bold text-teal-300">{net}</p>
      </div>
    </div>
  );
}
