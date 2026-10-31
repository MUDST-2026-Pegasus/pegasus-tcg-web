import type { ReactNode } from "react";
import { Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** การ์ดตัวเลือกแบบ radio (การมองเห็น / ประเภทส่วนลด) */
export function ChoiceCard({
  value,
  title,
  hint,
  selected,
  disabled,
}: {
  value: string;
  title: string;
  hint: string;
  selected: boolean;
  disabled?: boolean;
}) {
  return (
    <label className={cn("promotion-choice", selected && "is-selected", disabled && "is-disabled")}>
      <RadioGroupItem value={value} disabled={disabled} aria-label={title} />
      <span>
        <strong>{title}</strong>
        <small>{hint}</small>
      </span>
    </label>
  );
}

export function ToggleRow({
  id,
  title,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  title: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={cn("promotion-toggle-row", disabled && "is-disabled")}>
      <div>
        <label htmlFor={id}>{title}</label>
        <p>{hint}</p>
      </div>
      <Switch id={id} size="sm" checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

/**
 * ช่องกรอกหนึ่งช่อง: label, ช่อง, คำแนะนำ, error — `data-field` ให้หน้าเลื่อนไปหา error แรกได้
 * `label` เป็นข้อความที่เห็น ส่วนชื่อที่ screen reader อ่านมาจาก `aria-label` ของช่องเอง
 */
export function FormField({
  field,
  htmlFor,
  label,
  required,
  hint,
  error,
  children,
}: {
  field: string;
  htmlFor?: string;
  label: ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="promotion-field" data-field={field}>
      {htmlFor ? (
        <label htmlFor={htmlFor}>
          {label}
          {required ? <em> *</em> : null}
        </label>
      ) : (
        <span className="promotion-field-label">
          {label}
          {required ? <em> *</em> : null}
        </span>
      )}
      {children}
      {hint ? <p className="promotion-field-hint">{hint}</p> : null}
      {error ? (
        <span role="alert" className="promotion-field-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** ช่องตัวเลข เว้นว่าง = `null` · ล็อกแล้วมีแม่กุญแจท้ายช่อง (Figma PRM-A3 E) */
export function NumberInput({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  disabled,
  locked,
  invalid,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  locked?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className={cn("promotion-input-wrap", prefix && "has-prefix")}>
      {prefix ? <span className="promotion-input-affix">{prefix}</span> : null}
      <Input
        id={id}
        aria-label={label}
        aria-invalid={invalid || undefined}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        value={value ?? ""}
        disabled={disabled || locked}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
      />
      <InputSuffix suffix={suffix} locked={locked} />
    </div>
  );
}

export function InputSuffix({ suffix, locked }: { suffix?: string; locked?: boolean }) {
  if (!suffix && !locked) return null;
  return (
    <span className="promotion-input-affix promotion-input-suffix">
      {suffix}
      {locked ? <Lock className="size-3.5" aria-label="ล็อก" /> : null}
    </span>
  );
}
