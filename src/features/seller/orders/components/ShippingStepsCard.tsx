import { CheckIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { OrdersData } from "../orders.types";

type ShippingStepsCardProps = OrdersData["steps"];

/** ขั้นที่ทำแล้วเป็นวงกลมสีหลักมีเครื่องหมายถูก และตัวหนังสือจางลง ขั้นที่เหลือโชว์ลำดับ */
export function ShippingStepsCard({ title, items }: ShippingStepsCardProps) {
  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-xs font-semibold text-zinc-950">{title}</p>

      <ol className="flex flex-col gap-3.5">
        {items.map((step, index) => (
          <li key={step.id} className="flex items-center gap-2.5">
            {step.done ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckIcon aria-hidden="true" className="size-3" strokeWidth={3} />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="flex size-5 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-[10px] font-bold text-gray-400"
              >
                {index + 1}
              </span>
            )}
            <p
              className={cn(
                "flex-1 text-xs",
                step.done ? "text-gray-400" : "text-gray-700",
              )}
            >
              {step.label}
              {step.done ? <span className="sr-only"> (เสร็จแล้ว)</span> : null}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
