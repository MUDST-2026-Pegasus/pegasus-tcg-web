import { Card } from "@/components/ui/card";

type ShippingStepsCardProps = {
  title: string;
  items: { id: string; label: string }[];
};

/** ลำดับงานแพ็คที่ร้านควรทำ — เป็นคำแนะนำ ไม่ได้ติดตามว่าทำข้อไหนไปแล้ว */
export function ShippingStepsCard({ title, items }: ShippingStepsCardProps) {
  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-xs font-semibold text-zinc-950">{title}</p>

      <ol className="flex flex-col gap-3.5">
        {items.map((step, index) => (
          <li key={step.id} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-[10px] font-bold text-gray-400"
            >
              {index + 1}
            </span>
            <p className="flex-1 text-xs text-gray-700">{step.label}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
