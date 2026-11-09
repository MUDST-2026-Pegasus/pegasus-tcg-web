import type { ComponentProps, ReactNode } from "react";
import { Lock } from "lucide-react";

import { DateTimePicker } from "@/components/common";

import { FormField, NumberInput, type PromotionFieldAppearance } from "./PromotionFormControls";
import { fromLocalInput, toLocalInput } from "./promotionForm.dates";

/**
 * ช่องกรอกที่ฟอร์มโค้ด Pegasus (แอดมิน) และโค้ดร้าน (ผู้ขาย) ใช้ร่วมกัน
 * รับค่าแบบ controlled จึงไม่ผูกกับตัวจัดการ state ของฟอร์มฝั่งไหน
 */
type SharedFieldProps = {
  appearance?: PromotionFieldAppearance;
  field: string;
  label: ReactNode;
  /** ชื่อที่ screen reader อ่าน */
  ariaLabel: string;
  required?: boolean;
  hint?: string;
  error?: string;
};

/** ฟอร์มเต็มหน้าผูก label กับช่องด้วย `htmlFor` ส่วน dialog ของร้านอ้างอิงจาก `aria-label` */
const labelTarget = (appearance: PromotionFieldAppearance, id?: string) => (appearance === "page" ? id : undefined);

export function PromotionNumberField({
  appearance = "page",
  field,
  label,
  ariaLabel,
  required,
  hint,
  error,
  id,
  ...input
}: SharedFieldProps & Omit<ComponentProps<typeof NumberInput>, "label" | "invalid" | "appearance">) {
  return (
    <FormField
      field={field}
      htmlFor={labelTarget(appearance, id)}
      label={label}
      required={required}
      hint={hint}
      error={error}
    >
      <NumberInput {...input} id={id} label={ariaLabel} appearance={appearance} invalid={!!error} />
    </FormField>
  );
}

const COMPACT_DATE_CLASS = "rounded-lg border-border bg-card text-[13px] hover:bg-card disabled:bg-muted";

/** ช่องวันเวลา — ค่าเข้าออกเป็น ISO ส่วน `min` เป็นค่าแบบ `datetime-local` */
export function PromotionDateField({
  appearance = "page",
  field,
  label,
  ariaLabel,
  required,
  hint,
  error,
  id,
  value,
  onChange,
  onBlur,
  min,
  defaultTime,
  locked,
}: SharedFieldProps & {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  min?: string;
  defaultTime?: string;
  locked?: boolean;
}) {
  return (
    <FormField
      field={field}
      htmlFor={labelTarget(appearance, id)}
      label={label}
      required={required}
      hint={hint}
      error={error}
    >
      <DateTimePicker
        id={id}
        aria-label={ariaLabel}
        invalid={!!error}
        min={min}
        defaultTime={defaultTime}
        disabled={locked}
        className={appearance === "compact" ? COMPACT_DATE_CLASS : undefined}
        suffix={locked ? <Lock aria-label="ล็อก" className="text-muted-foreground" /> : null}
        value={toLocalInput(value)}
        onChange={(next) => {
          onChange(fromLocalInput(next));
          onBlur?.();
        }}
      />
    </FormField>
  );
}
