import { Controller, useFormState, type UseFormReturn } from "react-hook-form";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { AmountInput } from "@/features/seller/products/components/AmountInput";

import type { AuctionFormValues } from "../auction-form.types";
import { AuctionFieldError } from "./AuctionFieldError";

type MoneyFieldName = "startingPrice" | "bidIncrement" | "buyNowPrice";

type BahtFieldProps = {
  form: UseFormReturn<AuctionFormValues>;
  name: MoneyFieldName;
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
};

/** ช่องเงินบาทมี "฿" นำหน้า + ข้อความใต้ช่อง (ใช้ในการ์ดราคาและซื้อทันที) */
export function BahtField({ form, name, id, label, hint, required }: BahtFieldProps) {
  const { errors } = useFormState({ control: form.control, name });
  const error = errors[name]?.message;
  return (
    <Field className="gap-1.5" data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id} className="text-xs font-medium text-gray-700">
        {label}
        {required ? " *" : null}
      </FieldLabel>
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
          ฿
        </span>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <AmountInput
              id={id}
              maxLength={16}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              aria-invalid={Boolean(error) || undefined}
              className="h-9 rounded-lg border-input bg-background pl-7 text-sm"
            />
          )}
        />
      </div>
      {hint ? <FieldDescription className="text-[11px] leading-normal text-gray-400">{hint}</FieldDescription> : null}
      <AuctionFieldError message={error} />
    </Field>
  );
}
