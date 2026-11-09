import type { ReactNode } from "react";
import { Controller, useWatch, type Control, type FieldErrors } from "react-hook-form";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PromotionDateField, PromotionNumberField } from "@/features/promotions/shared/PromotionFormFields";
import {
  FormField,
  PromotionInputBox,
  ToggleRow,
} from "@/features/promotions/shared/PromotionFormControls";

import type { SellerPromotionInput } from "../promotions.types";

type NumberKey = "discountValue" | "maxDiscount" | "minSpend" | "usageLimitTotal" | "usageLimitPerUser" | "claimLimit";

export type FieldProps = { control: Control<SellerPromotionInput>; errors: FieldErrors<SellerPromotionInput> };

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">{children}</div>;
}

export function TextField({
  control,
  errors,
  name,
  label,
  required,
  hint,
  upper,
}: FieldProps & { name: "code" | "name"; label: string; required?: boolean; hint?: string; upper?: boolean }) {
  return (
    <FormField field={name} label={label} required={required} hint={hint} error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <PromotionInputBox
            appearance="compact"
            ref={field.ref}
            aria-label={label}
            aria-invalid={!!errors[name] || undefined}
            value={field.value ?? ""}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(upper ? event.target.value.toUpperCase() : event.target.value)}
          />
        )}
      />
    </FormField>
  );
}

export function LockedText({ label, value }: { label: string; value: string }) {
  return (
    <FormField field={label} label={label}>
      <PromotionInputBox appearance="compact" aria-label={label} value={value} readOnly locked />
    </FormField>
  );
}

export function NumberField({
  control,
  errors,
  name,
  label,
  unit,
  hint,
  required,
  locked,
}: FieldProps & { name: NumberKey; label: string; unit: string; hint?: string; required?: boolean; locked?: boolean }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <PromotionNumberField
          appearance="compact"
          field={name}
          label={label}
          ariaLabel={label}
          required={required}
          hint={hint}
          error={errors[name]?.message}
          id={`seller-promotion-${name}`}
          inputRef={field.ref}
          value={field.value}
          onBlur={field.onBlur}
          onChange={field.onChange}
          prefix={unit === "฿" ? unit : undefined}
          suffix={unit === "฿" ? undefined : unit}
          locked={locked}
        />
      )}
    />
  );
}

export function DateField({
  control,
  errors,
  name,
  label,
  required,
  min,
}: FieldProps & { name: "startsAt" | "endsAt"; label: string; required?: boolean; min?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <PromotionDateField
          appearance="compact"
          field={name}
          label={label}
          ariaLabel={label}
          required={required}
          error={errors[name]?.message}
          min={min}
          defaultTime={name === "endsAt" ? "23:59" : "00:00"}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}

/** ปุ่มเลือกสองทางแบบแถบเดียว (Figma PRM-S2 A: ประเภทส่วนลด / การมองเห็น) */
export function Segmented<K extends "discountType" | "visibility">({
  control,
  name,
  label,
  options,
  disabled,
  onPick,
}: {
  control: Control<SellerPromotionInput>;
  name: K;
  label: string;
  options: Array<[SellerPromotionInput[K], string]>;
  disabled?: boolean;
  onPick?: (value: SellerPromotionInput[K]) => void;
}) {
  return (
    <FormField field={name} label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <ToggleGroup
            aria-label={label}
            spacing={0}
            disabled={disabled}
            value={[field.value as string]}
            onValueChange={(next: string[]) => {
              const value = next[0] as SellerPromotionInput[K] | undefined;
              if (!value) return;
              field.onChange(value);
              onPick?.(value);
            }}
            className="grid w-full grid-cols-2 overflow-hidden rounded-lg border border-border bg-card"
          >
            {options.map(([value, text]) => (
              <ToggleGroupItem
                key={value as string}
                value={value as string}
                className="h-8.5 w-full rounded-none! text-[13px] font-medium aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
              >
                {text}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      />
    </FormField>
  );
}

export function DiscountFields({ control, errors }: FieldProps) {
  const discountType = useWatch({ control, name: "discountType" });
  const fixed = discountType === "FIXED";
  return (
    <>
      <Row>
        <NumberField control={control} errors={errors} name="discountValue" label="ลด" unit={fixed ? "฿" : "%"} required />
        <NumberField
          control={control}
          errors={errors}
          name="minSpend"
          label="ยอดขั้นต่ำ (เฉพาะสินค้าร้านนี้)"
          unit="฿"
          hint={fixed ? "ส่วนลดต้องไม่เกินยอดขั้นต่ำ · 0 = ไม่มีขั้นต่ำ" : "0 = ไม่มีขั้นต่ำ"}
        />
      </Row>
      {fixed ? null : (
        <NumberField
          control={control}
          errors={errors}
          name="maxDiscount"
          label="ลดสูงสุด"
          unit="฿"
          hint="เว้นว่าง = ไม่จำกัด"
        />
      )}
    </>
  );
}

export function ClaimFields({ control, errors, claimFixed }: FieldProps & { claimFixed: boolean }) {
  const visibility = useWatch({ control, name: "visibility" });
  const claimable = useWatch({ control, name: "claimable" });
  return (
    <>
      <Controller
        control={control}
        name="claimable"
        render={({ field }) => (
          <ToggleRow
            id="seller-promotion-claimable"
            title="ให้ลูกค้ากดเก็บที่หน้าร้าน"
            hint={
              claimFixed
                ? "มีลูกค้าเก็บโค้ดแล้ว จึงเปลี่ยนการกดเก็บไม่ได้"
                : "แสดงในแถบ “โค้ดส่วนลดของร้าน” บนหน้าร้าน (ต้องเป็นสาธารณะ)"
            }
            checked={field.value}
            disabled={visibility !== "PUBLIC" || claimFixed}
            onChange={field.onChange}
          />
        )}
      />
      {errors.claimable ? (
        <p role="alert" className="text-[11px] text-destructive">
          {errors.claimable.message}
        </p>
      ) : null}
      {claimable ? (
        <NumberField
          control={control}
          errors={errors}
          name="claimLimit"
          label="จำนวนที่แจก"
          unit="ใบ"
          hint="เว้นว่าง = ไม่จำกัด"
        />
      ) : null}
    </>
  );
}
