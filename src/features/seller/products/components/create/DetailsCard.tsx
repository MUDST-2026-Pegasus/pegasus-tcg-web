import { useId } from "react";

import { useFormState, type UseFormReturn } from "react-hook-form";

import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { ListingFormValues } from "../../listing-form.schema";

const INPUT_CLASS = "h-8 rounded-lg border-input bg-background px-2.5 text-sm";
const LABEL_CLASS = "text-xs font-medium text-gray-700";
const HELPER_CLASS = "text-[10px] leading-normal text-gray-400";

type DetailsCardProps = {
  form: UseFormReturn<ListingFormValues>;
};

/**
 * รายละเอียดที่ไม่ใช่ราคา — เกรด ป้ายล็อต และคำอธิบายถึงผู้ซื้อ (`ListingRequest`)
 * ป้ายล็อตเป็นของผู้ขายเอง ผู้ซื้อไม่เห็น (`PublicListingResponse` ไม่มีฟิลด์นี้)
 */
export function DetailsCard({ form }: DetailsCardProps) {
  const ids = {
    company: useId(),
    grade: useId(),
    lot: useId(),
    note: useId(),
  };
  const { register, control } = form;
  const { errors } = useFormState({ control });

  return (
    <Card className="w-full gap-4 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-[3px]">
        <h2 className="text-base font-semibold text-zinc-950">
          รายละเอียดเพิ่มเติม
        </h2>
        <p className="text-xs text-gray-500">ไม่บังคับ — ช่วยให้ผู้ซื้อตัดสินใจง่ายขึ้น</p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        <Field
          className="gap-1.5"
          data-invalid={Boolean(errors.gradingCompany) || undefined}
        >
          <FieldLabel htmlFor={ids.company} className={LABEL_CLASS}>
            บริษัทเกรด
          </FieldLabel>
          <Input
            id={ids.company}
            maxLength={20}
            placeholder="เช่น PSA, BGS, CGC"
            aria-invalid={Boolean(errors.gradingCompany) || undefined}
            className={INPUT_CLASS}
            {...register("gradingCompany")}
          />
          <FieldError errors={[errors.gradingCompany]} />
        </Field>

        <Field
          className="gap-1.5"
          data-invalid={Boolean(errors.gradeValue) || undefined}
        >
          <FieldLabel htmlFor={ids.grade} className={LABEL_CLASS}>
            เกรด
          </FieldLabel>
          <Input
            id={ids.grade}
            inputMode="decimal"
            maxLength={4}
            placeholder="เช่น 10 หรือ 9.5"
            aria-invalid={Boolean(errors.gradeValue) || undefined}
            className={INPUT_CLASS}
            {...register("gradeValue")}
          />
          <FieldDescription className={HELPER_CLASS}>
            0.5–10 เว้นว่างถ้าไม่ได้ส่งเกรด
          </FieldDescription>
          <FieldError errors={[errors.gradeValue]} />
        </Field>

        <Field
          className="gap-1.5"
          data-invalid={Boolean(errors.lotLabel) || undefined}
        >
          <FieldLabel htmlFor={ids.lot} className={LABEL_CLASS}>
            ป้ายล็อต
          </FieldLabel>
          <Input
            id={ids.lot}
            maxLength={60}
            placeholder="เช่น BOX-01"
            aria-invalid={Boolean(errors.lotLabel) || undefined}
            className={INPUT_CLASS}
            {...register("lotLabel")}
          />
          <FieldDescription className={HELPER_CLASS}>
            ไว้หาของในคลังของคุณเอง ผู้ซื้อไม่เห็น
          </FieldDescription>
          <FieldError errors={[errors.lotLabel]} />
        </Field>
      </div>

      <Field
        className="gap-1.5"
        data-invalid={Boolean(errors.publicNote) || undefined}
      >
        <FieldLabel htmlFor={ids.note} className={LABEL_CLASS}>
          คำอธิบายถึงผู้ซื้อ
        </FieldLabel>
        <Textarea
          id={ids.note}
          maxLength={500}
          placeholder="เช่น เก็บใน Top Loader ตั้งแต่แกะซอง ไม่เคยเล่น มีรูปมุมทั้ง 4 ให้ดูก่อนซื้อ..."
          aria-invalid={Boolean(errors.publicNote) || undefined}
          className="min-h-20 rounded-lg border-input bg-background px-2.5 py-2 text-sm placeholder:text-gray-400"
          {...register("publicNote")}
        />
        <FieldDescription className={HELPER_CLASS}>
          ไม่เกิน 500 ตัวอักษร
        </FieldDescription>
        <FieldError errors={[errors.publicNote]} />
      </Field>
    </Card>
  );
}
