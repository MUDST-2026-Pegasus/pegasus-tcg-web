import { Card } from "@/components/ui/card";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { CONDITION_OPTIONS } from "../../listing-form.format";
import type { CardCondition } from "../../products.types";

type ConditionCardProps = {
  value: CardCondition | null;
  onValueChange: (value: CardCondition) => void;
  /** หน้าแก้ไข — สภาพเป็นส่วนหนึ่งของตลาดที่ประกาศอยู่ เปลี่ยนไม่ได้หลังสร้าง */
  disabled?: boolean;
  error?: string;
};

/** สภาพการ์ดตาม `CardCondition` ของ backend — ราคากลางคิดแยกตามสภาพ */
export function ConditionCard({
  value,
  onValueChange,
  disabled = false,
  error,
}: ConditionCardProps) {
  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-base font-semibold text-foreground">สภาพการ์ด</h2>
        <p className="text-xs text-gray-500">
          {disabled
            ? "สภาพเปลี่ยนไม่ได้หลังลงประกาศ ถ้าเลือกผิดให้ลงประกาศใหม่ แล้วปิดประกาศนี้"
            : "ระบุตามจริง — การระบุสภาพไม่ตรงเป็นสาเหตุข้อพิพาทอันดับ 1"}
        </p>
      </div>

      <RadioGroup
        aria-label="สภาพการ์ด"
        aria-invalid={Boolean(error) || undefined}
        value={value}
        disabled={disabled}
        onValueChange={(next) => onValueChange(next as CardCondition)}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {CONDITION_OPTIONS.map((option) => {
          const isSelected = option.value === value;

          return (
            // ใช้ ring แบบ inset แทน border — ขอบหนาขึ้นตอนเลือกแล้วการ์ดไม่ขยับ
            <FieldLabel
              key={option.value}
              className={cn(
                "w-full items-start gap-2.5 rounded-[10px] p-3.5 ring-inset",
                disabled ? "cursor-default" : "cursor-pointer",
                isSelected
                  ? "bg-emerald-50 ring-2 ring-teal-600"
                  : "bg-card ring-1 ring-border",
                !isSelected && !disabled && "hover:bg-gray-50",
                !isSelected && disabled && "opacity-50",
              )}
            >
              <RadioGroupItem
                value={option.value}
                className="border-input bg-background data-checked:border-primary"
              />
              <span className="flex flex-1 flex-col gap-[3px]">
                <span className="text-xs font-semibold text-foreground">
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

      <FieldError>{error}</FieldError>
    </Card>
  );
}
