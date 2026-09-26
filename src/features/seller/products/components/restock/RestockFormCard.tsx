import { useId, useState } from "react";

import { th } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { formatThaiDate, parseIsoDate, toIsoDate } from "../../restock.calc";
import type { RestockData, RestockDraft } from "../../restock.types";
import { AmountInput } from "../AmountInput";

const FIELD_CLASS = "h-8 rounded-lg border-input bg-background px-2.5 text-sm";
const LABEL_CLASS = "text-xs font-medium text-gray-700";
const HELPER_CLASS = "text-[10px] leading-normal text-gray-400";

const thaiMonthYear = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  year: "numeric",
});

type RestockFormCardProps = RestockData["form"] & {
  draft: RestockDraft;
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
  onFieldChange,
}: RestockFormCardProps) {
  const quantityId = useId();
  const totalCostId = useId();
  const receivedAtId = useId();
  const sourceId = useId();
  const referenceId = useId();
  const noteId = useId();

  const [isDateOpen, setIsDateOpen] = useState(false);
  // รับของล่วงหน้าไม่ได้ — ห้ามเลือกวันที่หลังวันนี้
  const [today] = useState(() => new Date());
  const receivedAt = parseIsoDate(draft.receivedAt);

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
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
            maxLength={6}
            allowDecimal={false}
            value={draft.quantity}
            onValueChange={(value) => onFieldChange("quantity", value)}
            className={FIELD_CLASS}
          />
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
          <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
            <PopoverTrigger
              id={receivedAtId}
              render={
                <Button
                  variant="outline"
                  className="h-8 w-full justify-start rounded-lg border-input bg-background px-2.5 text-sm font-normal text-zinc-950 hover:bg-background"
                />
              }
            >
              {receivedAt ? (
                formatThaiDate(draft.receivedAt)
              ) : (
                <span className="text-muted-foreground">
                  {receivedAtPlaceholder}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto rounded-xl p-0">
              <Calendar
                mode="single"
                locale={th}
                selected={receivedAt}
                defaultMonth={receivedAt}
                disabled={{ after: today }}
                formatters={{
                  formatCaption: (month) => thaiMonthYear.format(month),
                }}
                onSelect={(date) => {
                  if (!date) return;
                  onFieldChange("receivedAt", toIsoDate(date));
                  setIsDateOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
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
          value={draft.note}
          onChange={(event) => onFieldChange("note", event.target.value)}
          className="min-h-16 rounded-lg border-input bg-background px-2.5 py-2 text-sm placeholder:text-gray-400"
        />
      </Field>
    </Card>
  );
}
