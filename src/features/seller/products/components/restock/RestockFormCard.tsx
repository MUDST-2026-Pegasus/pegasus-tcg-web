import { useId, useState } from "react";


import { DateTimePicker } from "@/components/common";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
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
import { Textarea } from "@/components/ui/textarea";

import { toIsoDate } from "../../restock.calc";
import type { RestockData, RestockDraft } from "../../restock.types";
import { AmountInput } from "../AmountInput";

const FIELD_CLASS = "h-8 rounded-lg border-input bg-background px-2.5 text-sm";
const LABEL_CLASS = "text-xs font-medium text-gray-700";
const HELPER_CLASS = "text-[10px] leading-normal text-gray-400";


/** ไม่ให้ `unitNote` (แหล่งที่มา · อ้างอิง · บันทึก) เกิน 255 ตัวอักษรของ backend */
const NOTE_MAX_LENGTH = 150;

type RestockFormCardProps = RestockData["form"] & {
  draft: RestockDraft;
  quantityError: string | null;
  onFieldChange: (field: keyof RestockDraft, value: string) => void;
};

export function RestockFormCard({
  title,
  description,
  quantityLabel,
  totalCostLabel,
  totalCostHelper,
  receivedAtLabel,
  receivedAtPlaceholder,
  sourceLabel,
  sourceOptions,
  referenceLabel,
  referenceHelper,
  noteLabel,
  notePlaceholder,
  draft,
  quantityError,
  onFieldChange,
}: RestockFormCardProps) {
  const quantityId = useId();
  const totalCostId = useId();
  const receivedAtId = useId();
  const sourceId = useId();
  const referenceId = useId();
  const noteId = useId();

  // รับของล่วงหน้าไม่ได้ — ห้ามเลือกวันที่หลังวันนี้
  const [today] = useState(() => new Date());

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      <FieldGroup className="gap-3.5 sm:flex-row">
        <Field className="flex-1 gap-1.5">
          <FieldLabel htmlFor={quantityId} className={LABEL_CLASS}>
            {quantityLabel} *
          </FieldLabel>
          <AmountInput
            id={quantityId}
            required
            maxLength={3}
            allowDecimal={false}
            value={draft.quantity}
            onValueChange={(value) => onFieldChange("quantity", value)}
            aria-invalid={Boolean(quantityError) || undefined}
            className={FIELD_CLASS}
          />
          <FieldError className="text-[10px] leading-normal">
            {quantityError}
          </FieldError>
        </Field>

        <Field className="flex-1 gap-1.5">
          <FieldLabel htmlFor={totalCostId} className={LABEL_CLASS}>
            {totalCostLabel} *
          </FieldLabel>
          <AmountInput
            id={totalCostId}
            required
            maxLength={10}
            value={draft.totalCost}
            onValueChange={(value) => onFieldChange("totalCost", value)}
            className={FIELD_CLASS}
          />
          <FieldDescription className={HELPER_CLASS}>
            {totalCostHelper}
          </FieldDescription>
        </Field>

        <Field className="flex-1 gap-1.5">
          <FieldLabel htmlFor={receivedAtId} className={LABEL_CLASS}>
            {receivedAtLabel} *
          </FieldLabel>
          <DateTimePicker
            id={receivedAtId}
            mode="date"
            value={draft.receivedAt}
            max={toIsoDate(today)}
            placeholder={receivedAtPlaceholder}
            className="h-8 rounded-lg px-2.5"
            onChange={(value) => onFieldChange("receivedAt", value)}
          />
        </Field>
      </FieldGroup>

      <FieldGroup className="gap-3.5 sm:flex-row">
        <Field className="flex-1 gap-1.5">
          <FieldLabel htmlFor={sourceId} className={LABEL_CLASS}>
            {sourceLabel}
          </FieldLabel>
          <Select
            items={Object.fromEntries(
              sourceOptions.map((option) => [option.value, option.label]),
            )}
            value={draft.source}
            onValueChange={(value) => onFieldChange("source", value ?? "")}
          >
            <SelectTrigger
              id={sourceId}
              className="h-8 w-full rounded-lg border-input bg-background pr-2 pl-2.5 text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field className="flex-1 gap-1.5">
          <FieldLabel htmlFor={referenceId} className={LABEL_CLASS}>
            {referenceLabel}
          </FieldLabel>
          <Input
            id={referenceId}
            maxLength={50}
            value={draft.reference}
            onChange={(event) => onFieldChange("reference", event.target.value)}
            className={FIELD_CLASS}
          />
          <FieldDescription className={HELPER_CLASS}>
            {referenceHelper}
          </FieldDescription>
        </Field>
      </FieldGroup>

      <Field className="gap-1.5">
        <FieldLabel htmlFor={noteId} className={LABEL_CLASS}>
          {noteLabel}
        </FieldLabel>
        <Textarea
          id={noteId}
          placeholder={notePlaceholder}
          maxLength={NOTE_MAX_LENGTH}
          value={draft.note}
          onChange={(event) => onFieldChange("note", event.target.value)}
          className="min-h-16 rounded-lg border-input bg-background px-2.5 py-2 text-sm placeholder:text-gray-400"
        />
      </Field>
    </Card>
  );
}
