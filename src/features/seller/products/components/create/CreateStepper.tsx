import { Check } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { CreateStep } from "../../product-create.types";

type CreateStepperProps = {
  steps: CreateStep[];
  currentStepIndex: number;
};

/** แถบขั้นตอนการลงขาย: ขั้นที่ผ่านแล้วขึ้นเครื่องหมายถูก ขั้นปัจจุบันตัวหนา ขั้นถัดไปเป็นสีเทา */
export function CreateStepper({ steps, currentStepIndex }: CreateStepperProps) {
  return (
    <Card className="w-full gap-0 rounded-xl border border-border px-5 py-4 shadow-none ring-0">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isDone = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className={cn("flex items-center", index > 0 && "flex-1")}
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    index <= currentStepIndex ? "bg-teal-600" : "bg-gray-100",
                  )}
                />
              ) : null}

              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isDone || isCurrent
                      ? "bg-teal-600 text-white"
                      : "bg-white text-gray-400 ring-1 ring-zinc-200 ring-inset",
                  )}
                >
                  {isDone ? (
                    <Check aria-hidden="true" className="size-3.5 stroke-3" />
                  ) : (
                    index + 1
                  )}
                </span>
                {/* จอแคบซ่อนชื่อขั้นไว้ให้ screen reader อ่านอย่างเดียว ไม่งั้นล้นแถว */}
                <span
                  className={cn(
                    "text-xs max-sm:sr-only",
                    isCurrent && "font-semibold text-zinc-950",
                    isDone && "text-zinc-950",
                    !isDone && !isCurrent && "text-gray-400",
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
