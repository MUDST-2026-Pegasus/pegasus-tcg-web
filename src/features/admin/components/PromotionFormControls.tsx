import type { ReactNode } from "react";
import { Lock } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldTitle } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** การ์ดตัวเลือกแบบ radio (การมองเห็น / ประเภทส่วนลด) — แบบ choice card ของ `Field` */
export function ChoiceCard({
  value,
  title,
  hint,
  disabled,
}: {
  value: string;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <FieldLabel className="has-[>[data-slot=field]]:rounded-md has-data-checked:border-primary has-data-checked:bg-[#f0f7fc]">
      <Field orientation="horizontal" data-disabled={disabled || undefined} className="gap-2.5 p-3!">
        <RadioGroupItem value={value} disabled={disabled} aria-label={title} />
        <FieldContent className="gap-0.5">
          <FieldTitle className="text-[13px] font-semibold">{title}</FieldTitle>
          <FieldDescription className="text-xs">{hint}</FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  );
}

/** แถวเปิด/ปิดพร้อมคำอธิบาย */
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
    <Field
      orientation="horizontal"
      data-disabled={disabled || undefined}
      className="justify-between gap-3 rounded-md bg-[#fafbfb] p-3"
    >
      <FieldContent className="gap-0.5">
        <FieldLabel htmlFor={id} className="text-[13px] font-semibold">
          {title}
        </FieldLabel>
        <FieldDescription className="text-xs">{hint}</FieldDescription>
      </FieldContent>
      <Switch id={id} size="sm" checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </Field>
  );
}

/** checkbox พร้อม label ในกรอบเทา — `tone="danger"` ใช้กับการแจ้งร้านตอนหยุดโค้ดร้าน */
export function CheckRow({
  id,
  label,
  checked,
  onChange,
  tone = "muted",
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tone?: "muted" | "danger";
}) {
  return (
    <Field
      orientation="horizontal"
      className={cn(
        "gap-2.5 rounded-md",
        tone === "danger" ? "bg-[#fdecec] px-3 py-2.5 text-[#dc2626]" : "px-0",
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <FieldLabel htmlFor={id} className="text-xs font-normal">
        {label}
      </FieldLabel>
    </Field>
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
  className,
}: {
  field: string;
  htmlFor?: string;
  label: ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Field data-field={field} data-invalid={error ? true : undefined} className={cn("scroll-mt-24 gap-1.5", className)}>
      <FieldLabel htmlFor={htmlFor} className="gap-1 text-[13px]">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </FieldLabel>
      {children}
      {hint ? <FieldDescription className="text-xs">{hint}</FieldDescription> : null}
      {error ? <FieldError className="text-xs">{error}</FieldError> : null}
    </Field>
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
    <InputGroup data-disabled={disabled || locked || undefined}>
      {prefix ? (
        <InputGroupAddon>
          <InputGroupText>{prefix}</InputGroupText>
        </InputGroupAddon>
      ) : null}
      <InputGroupInput
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
      <LockedSuffix suffix={suffix} locked={locked} />
    </InputGroup>
  );
}

/** ท้ายช่อง: หน่วย และแม่กุญแจเมื่อแก้ไม่ได้ */
export function LockedSuffix({ suffix, locked }: { suffix?: string; locked?: boolean }) {
  if (!suffix && !locked) return null;
  return (
    <InputGroupAddon align="inline-end">
      {suffix ? <InputGroupText>{suffix}</InputGroupText> : null}
      {locked ? <Lock aria-label="ล็อก" /> : null}
    </InputGroupAddon>
  );
}
