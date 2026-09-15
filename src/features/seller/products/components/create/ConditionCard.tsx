import { Card } from "@/components/ui/card";
import { FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import type {
  CardCondition,
  ProductCreateData,
} from "../../product-create.types";

type ConditionCardProps = ProductCreateData["condition"] & {
  value: CardCondition | null;
  onValueChange: (value: CardCondition) => void;
};

export function ConditionCard({
  title,
  description,
  options,
  value,
  onValueChange,
}: ConditionCardProps) {
  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      <RadioGroup
        aria-label={title}
        value={value}
        onValueChange={(next) => onValueChange(next as CardCondition)}
        className="flex flex-wrap gap-3"
      >
        {options.map((option) => {
          const isSelected = option.id === value;

          return (
            // ใช้ ring แบบ inset แทน border — ขอบหนาขึ้นตอนเลือกแล้วการ์ดไม่ขยับ
            <FieldLabel
              key={option.id}
              className={cn(
                "w-full cursor-pointer items-start gap-2.5 rounded-[10px] p-3.5 ring-inset sm:w-72",
                isSelected
                  ? "bg-emerald-50 ring-2 ring-teal-600"
                  : "bg-white ring-1 ring-zinc-200 hover:bg-gray-50",
              )}
            >
              <RadioGroupItem
                value={option.id}
                className="border-input bg-background data-checked:border-primary"
              />
              <span className="flex flex-1 flex-col gap-[3px]">
                <span className="text-xs font-semibold text-zinc-950">
                  {option.label}
                </span>
                <span className="text-[10px] leading-4 font-normal text-gray-500">
                  {option.description}
                </span>
              </span>
            </FieldLabel>
          );
        })}
      </RadioGroup>
    </Card>
  );
}
