import { Controller, type Control, type FieldErrors } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ProductFormValues } from "../catalog.schema";
import type { GameAttribute } from "../catalog.types";

/** ค่าที่ Select ใช้แทน "ไม่ระบุ" — Base UI Select ไม่รับ `""` เป็นตัวเลือก */
const UNSET = "__unset__";

type GameAttributeFieldsProps = {
  registry: GameAttribute[];
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  disabled?: boolean;
};

/**
 * ช่องกรอก `attributes` ที่วาดตาม registry ของเกม (`GET /admin/games/{id}/attributes`)
 * เกม Pokémon ได้ HP / ประเภทพลังงาน เกมอื่นได้ช่องของเกมนั้น — ไม่มีช่องไหนเขียนตายตัว
 *
 * ชนิดช่องตาม `dataType`: STRING/NUMBER เป็นช่องพิมพ์, DATE เป็นตัวเลือกวันที่,
 * ENUM กับ BOOLEAN เป็น dropdown (ช่องไม่บังคับมี "ไม่ระบุ" ให้ล้างค่าได้)
 */
export function GameAttributeFields({
  registry,
  control,
  errors,
  disabled,
}: GameAttributeFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {registry.map((attribute) => {
        const id = `attribute-${attribute.attrKey}`;
        const error = errors.attributes?.[attribute.attrKey];

        return (
          <Field key={attribute.id} data-invalid={Boolean(error) || undefined}>
            <FieldLabel htmlFor={id}>
              {attribute.label}
              {attribute.required ? (
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              ) : null}
            </FieldLabel>

            <Controller
              control={control}
              name={`attributes.${attribute.attrKey}`}
              render={({ field }) => {
                const value = field.value ?? "";
                const options = choicesOf(attribute);

                if (options) {
                  const items = attribute.required
                    ? options
                    : [{ value: UNSET, label: "ไม่ระบุ" }, ...options];
                  return (
                    <Select
                      items={items}
                      value={value === "" ? (attribute.required ? null : UNSET) : value}
                      onValueChange={(next) =>
                        field.onChange(
                          next === null || next === UNSET ? "" : String(next),
                        )
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        id={id}
                        aria-invalid={Boolean(error)}
                        onBlur={field.onBlur}
                        className="w-full"
                      >
                        <SelectValue placeholder={`เลือก${attribute.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {items.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }

                return (
                  <Input
                    id={id}
                    type={attribute.dataType === "DATE" ? "date" : "text"}
                    inputMode={
                      attribute.dataType === "NUMBER" ? "decimal" : undefined
                    }
                    aria-invalid={Boolean(error)}
                    disabled={disabled}
                    name={field.name}
                    ref={field.ref}
                    value={value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                );
              }}
            />

            <FieldDescription className="text-xs">
              <code>{attribute.attrKey}</code>
            </FieldDescription>
            <FieldError errors={[error]} />
          </Field>
        );
      })}
    </div>
  );
}

/** ช่องที่เป็นตัวเลือก — `null` = ช่องพิมพ์ */
function choicesOf(
  attribute: GameAttribute,
): { value: string; label: string }[] | null {
  if (attribute.dataType === "ENUM") {
    return attribute.options.map((option) => ({ value: option, label: option }));
  }
  if (attribute.dataType === "BOOLEAN") {
    return [
      { value: "true", label: "ใช่" },
      { value: "false", label: "ไม่ใช่" },
    ];
  }
  return null;
}
