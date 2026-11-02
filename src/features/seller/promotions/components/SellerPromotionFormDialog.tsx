import { useState, type ComponentProps, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type Control, type FieldErrors } from "react-hook-form";
import { Lock, LogOut, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/components/ui/toast";
import { FormField, ToggleRow } from "@/features/admin/components/PromotionFormControls";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { getErrorMessage, hasErrorCode } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

import { useCreateSellerPromotion, useUpdateSellerPromotion } from "../promotions.queries";
import { discountLabel, money } from "../promotions.format";
import { schemaForSellerPromotion } from "../promotions.schema";
import type { SellerPromotion, SellerPromotionInput } from "../promotions.types";
import { CouponTicket } from "./CouponTicket";

type NumberKey = "discountValue" | "maxDiscount" | "minSpend" | "usageLimitTotal" | "usageLimitPerUser" | "claimLimit";

const newInput = (): SellerPromotionInput => ({
  code: "",
  name: "",
  description: null,
  discountType: "FIXED",
  discountValue: 100,
  maxDiscount: null,
  minSpend: 1000,
  visibility: "PUBLIC",
  newBuyerOnly: false,
  usageLimitTotal: 50,
  usageLimitPerUser: 1,
  claimable: true,
  claimLimit: 100,
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
});

function fromExisting(source: SellerPromotion): SellerPromotionInput {
  return {
    code: source.code,
    name: source.name,
    description: source.description,
    discountType: source.discountType,
    discountValue: source.discountValue,
    maxDiscount: source.maxDiscount,
    minSpend: source.minSpend,
    visibility: source.visibility,
    newBuyerOnly: source.newBuyerOnly,
    usageLimitTotal: source.usageLimitTotal,
    usageLimitPerUser: source.usageLimitPerUser,
    claimable: source.claimable,
    claimLimit: source.claimLimit,
    startsAt: source.startsAt,
    endsAt: source.endsAt,
  };
}

/** ISO → ค่าใน `<input type="datetime-local">` ตามเวลาเครื่อง */
function toLocal(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    : "";
}

/** ยอดตัวอย่างใน preview ตาม Figma PRM-S2 A (ลูกค้าซื้อ ฿1,200) */
const SAMPLE_SUBTOTAL = 1200;
/** อัตราคอมมิชชั่นสมมติ 5% ใช้อธิบายการคำนวณเท่านั้น (อัตราจริงอยู่ที่ backend ตอนปล่อยเงิน) */
const SAMPLE_COMMISSION_RATE = 0.05;

/**
 * ฟอร์มโค้ดร้าน — สร้าง/แก้โค้ดที่ยังไม่มีคนใช้เป็น dialog สองคอลัมน์พร้อมตัวอย่าง (Figma PRM-S2 A)
 * ส่วนโค้ดที่มีคนใช้แล้วเป็น modal แก้ไขแบบล็อกช่อง (PRM-M2 FORM) แก้ได้เฉพาะช่องที่ backend ยอม
 */
export function SellerPromotionForm({
  existing,
  open,
  verified,
  onClose,
}: {
  existing?: SellerPromotion;
  open: boolean;
  verified: boolean;
  onClose: () => void;
}) {
  const [confirmClose, setConfirmClose] = useState(false);
  const create = useCreateSellerPromotion();
  const update = useUpdateSellerPromotion();
  const { control, setValue, setError, handleSubmit, formState } = useForm<SellerPromotionInput>({
    defaultValues: existing ? fromExisting(existing) : newInput(),
    resolver: zodResolver(schemaForSellerPromotion(existing)),
  });
  const { errors, isDirty } = formState;
  const locked = !!existing && existing.usedCount > 0;
  const requestClose = () => (isDirty ? setConfirmClose(true) : onClose());
  const busy = create.isPending || update.isPending;

  const save = handleSubmit(async (input) => {
    const payload = { ...input, code: input.code.trim().toUpperCase() };
    try {
      if (existing) await update.mutateAsync({ id: existing.id, input: payload });
      else await create.mutateAsync(payload);
      onClose();
      toast.add({
        title: existing ? "บันทึกการแก้ไขแล้ว" : `สร้างโค้ด ${payload.code} แล้ว`,
        type: "success",
        actionProps: existing
          ? undefined
          : {
              children: "คัดลอกโค้ด",
              onClick: () => void navigator.clipboard?.writeText(payload.code),
            },
      });
    } catch (error) {
      if (hasErrorCode(error, "PROMO_CODE_TAKEN")) {
        setError("code", { message: "โค้ดนี้ถูกใช้แล้วในระบบ (PROMO_CODE_TAKEN)" }, { shouldFocus: true });
        return;
      }
      if (applyApiErrors(error, setError)) return;
      toast.add({
        title: "บันทึกไม่สำเร็จ",
        description: hasErrorCode(error, "SELLER_NOT_VERIFIED")
          ? "กรุณายืนยันตัวตนผู้ขายก่อนสร้างโค้ด"
          : hasErrorCode(error, "PROMO_IN_USE")
            ? "โค้ดนี้มีลูกค้าใช้หรือเก็บแล้ว แก้ได้เฉพาะชื่อ วันสิ้นสุดที่ยาวขึ้น และจำนวนสิทธิ์ที่เพิ่มขึ้น"
            : getErrorMessage(error, "กรุณาลองอีกครั้ง"),
        type: "error",
      });
    }
  });

  const discard = (
    <PromotionDialog
      open={confirmClose}
      onOpenChange={setConfirmClose}
      tone="warning"
      icon={<LogOut />}
      title="ทิ้งการแก้ไข?"
      description="ข้อมูลที่กรอกในฟอร์มยังไม่ได้บันทึก ถ้าปิดตอนนี้จะหายทั้งหมด"
      actions={
        <>
          <Button variant="outline" onClick={() => setConfirmClose(false)}>
            กลับไปแก้ต่อ
          </Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => {
              setConfirmClose(false);
              onClose();
            }}
          >
            ทิ้งการแก้ไข
          </Button>
        </>
      }
    />
  );

  if (locked) {
    return (
      <>
        <PromotionDialog
          open={open}
          onOpenChange={(value) => {
            if (!value) requestClose();
          }}
          tone="teal"
          icon={<Pencil />}
          title={`แก้ไขโค้ด ${existing.code}`}
          description={`ลูกค้าใช้แล้ว ${existing.usedCount} ครั้ง · ช่องที่มี 🔒 แก้ไม่ได้เพื่อให้ทุกออเดอร์คิดส่วนลดแบบเดียวกัน`}
          className="sm:max-w-[460px]"
          actions={
            <>
              <Button variant="outline" onClick={requestClose}>
                ยกเลิก
              </Button>
              <Button disabled={busy || !verified} onClick={() => void save()}>
                บันทึก
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LockedText label="รหัสโค้ด" value={existing.code} />
            <LockedText label="ส่วนลด" value={discountLabel(existing)} />
            <LockedText label="ยอดขั้นต่ำ" value={existing.minSpend > 0 ? money(existing.minSpend) : "ไม่มีขั้นต่ำ"} />
            <TextField control={control} errors={errors} name="name" label="ชื่อที่ลูกค้าเห็น" />
            <DateField
              control={control}
              errors={errors}
              name="endsAt"
              label="สิ้นสุด (ยืดได้)"
              min={toLocal(existing.endsAt)}
            />
            <NumberField
              control={control}
              errors={errors}
              name="usageLimitPerUser"
              label="สิทธิ์ต่อคน"
              unit="ครั้ง"
              locked
            />
            <NumberField
              control={control}
              errors={errors}
              name="usageLimitTotal"
              label={`จำนวนสิทธิ์ (≥ ${existing.usedCount})`}
              unit="สิทธิ์"
            />
            {existing.claimable ? (
              <NumberField
                control={control}
                errors={errors}
                name="claimLimit"
                label={`จำนวนที่แจก (≥ ${existing.claimedCount})`}
                unit="ใบ"
              />
            ) : null}
          </div>
        </PromotionDialog>
        {discard}
      </>
    );
  }

  const claimFixed = !!existing && existing.claimedCount > 0;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) requestClose();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto rounded-xl p-0 sm:max-w-[820px]"
        >
          <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_300px]">
            <form
              className="grid min-w-0 content-start gap-3"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <DialogTitle className="text-lg font-bold">
                {existing ? `แก้ไขโค้ด ${existing.code}` : "สร้างโค้ดร้าน"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                กรอกรายละเอียดโค้ดส่วนลดของร้าน ตัวอย่างตั๋วและยอดที่ร้านได้รับอยู่ด้านข้าง
              </DialogDescription>
              <Row>
                <TextField
                  control={control}
                  errors={errors}
                  name="code"
                  label="รหัสโค้ด"
                  required
                  hint="A–Z 0–9 · 4–20 ตัว"
                  upper
                />
                <TextField control={control} errors={errors} name="name" label="ชื่อที่ลูกค้าเห็น" required />
              </Row>
              <Segmented
                control={control}
                name="discountType"
                label="ประเภทส่วนลด"
                options={[
                  ["FIXED", "ลดเป็นบาท"],
                  ["PERCENT", "ลดเป็น %"],
                ]}
              />
              <DiscountFields control={control} errors={errors} />
              <Row>
                <DateField control={control} errors={errors} name="startsAt" label="เริ่ม" required />
                <DateField control={control} errors={errors} name="endsAt" label="สิ้นสุด" />
              </Row>
              <Row>
                <NumberField
                  control={control}
                  errors={errors}
                  name="usageLimitTotal"
                  label="จำนวนสิทธิ์ทั้งหมด"
                  unit="สิทธิ์"
                  hint="เว้นว่าง = ไม่จำกัด"
                />
                <NumberField
                  control={control}
                  errors={errors}
                  name="usageLimitPerUser"
                  label="สิทธิ์ต่อลูกค้า"
                  unit="ครั้ง"
                />
              </Row>
              <Segmented
                control={control}
                name="visibility"
                label="การมองเห็น"
                disabled={claimFixed}
                onPick={(value) => {
                  if (value === "PRIVATE") setValue("claimable", false, { shouldDirty: true });
                }}
                options={[
                  ["PUBLIC", "สาธารณะ"],
                  ["PRIVATE", "ส่วนตัว (พิมพ์เอง)"],
                ]}
              />
              <ClaimFields control={control} errors={errors} claimFixed={claimFixed} />
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={requestClose}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={busy || !verified}>
                  {existing ? "บันทึก" : "สร้างโค้ด"}
                </Button>
              </div>
            </form>
            <PreviewAside control={control} />
          </div>
        </DialogContent>
      </Dialog>
      {discard}
    </>
  );
}

type FieldProps = { control: Control<SellerPromotionInput>; errors: FieldErrors<SellerPromotionInput> };

function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">{children}</div>;
}

/**
 * ช่องกรอกแบบ Figma PRM-S2 / M2: กรอบ 8px ขาวเส้นเทา ตัวอักษร 13px · ช่องที่ล็อกเป็นพื้นเทา ตัวหนังสือจาง และมีแม่กุญแจ
 * ขอบแดงตอน error มาจาก `aria-invalid` ของ `InputGroup` เอง
 */
function FieldBox({
  prefix,
  suffix,
  locked,
  ...input
}: ComponentProps<typeof InputGroupInput> & { prefix?: string; suffix?: string; locked?: boolean }) {
  return (
    <InputGroup className="h-9 rounded-lg border-border bg-card has-[input:disabled]:bg-muted">
      {prefix ? (
        <InputGroupAddon>
          <InputGroupText className="text-[13px] text-muted-foreground/70">{prefix}</InputGroupText>
        </InputGroupAddon>
      ) : null}
      <InputGroupInput
        {...input}
        disabled={locked || input.disabled}
        className="px-3 text-[13px] md:text-[13px] disabled:text-muted-foreground/70 disabled:opacity-100"
      />
      {suffix || locked ? (
        <InputGroupAddon align="inline-end" className="gap-1.5">
          {suffix ? <InputGroupText className="text-[13px] text-muted-foreground/70">{suffix}</InputGroupText> : null}
          {locked ? <Lock aria-label="ล็อก" className="size-3.5 text-muted-foreground/70" /> : null}
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

function TextField({
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
          <FieldBox
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

function LockedText({ label, value }: { label: string; value: string }) {
  return (
    <FormField field={label} label={label}>
      <FieldBox aria-label={label} value={value} readOnly locked />
    </FormField>
  );
}

function NumberField({
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
    <FormField field={name} label={label} required={required} hint={hint} error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <FieldBox
            ref={field.ref}
            id={`seller-promotion-${name}`}
            aria-label={label}
            aria-invalid={!!errors[name] || undefined}
            type="number"
            inputMode="decimal"
            min={0}
            value={field.value ?? ""}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
            prefix={unit === "฿" ? unit : undefined}
            suffix={unit === "฿" ? undefined : unit}
            locked={locked}
          />
        )}
      />
    </FormField>
  );
}

function DateField({
  control,
  errors,
  name,
  label,
  required,
  min,
}: FieldProps & { name: "startsAt" | "endsAt"; label: string; required?: boolean; min?: string }) {
  return (
    <FormField field={name} label={label} required={required} error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <FieldBox
            ref={field.ref}
            aria-label={label}
            aria-invalid={!!errors[name] || undefined}
            type="datetime-local"
            min={min}
            value={toLocal(field.value)}
            onBlur={field.onBlur}
            onChange={(event) =>
              field.onChange(event.target.value ? new Date(event.target.value).toISOString() : "")
            }
          />
        )}
      />
    </FormField>
  );
}

/** ปุ่มเลือกสองทางแบบแถบเดียว (Figma PRM-S2 A: ประเภทส่วนลด / การมองเห็น) */
function Segmented<K extends "discountType" | "visibility">({
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

function DiscountFields({ control, errors }: FieldProps) {
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

function ClaimFields({ control, errors, claimFixed }: FieldProps & { claimFixed: boolean }) {
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

function PreviewAside({ control }: { control: Control<SellerPromotionInput> }) {
  const form = useWatch({ control }) as SellerPromotionInput;
  const subtotal = Math.max(SAMPLE_SUBTOTAL, form.minSpend || 0);
  const discount = Math.min(
    subtotal,
    form.discountType === "FIXED"
      ? form.discountValue || 0
      : Math.min((subtotal * (form.discountValue || 0)) / 100, form.maxDiscount ?? Infinity),
  );
  const afterShopCode = subtotal - discount;
  const commission = Math.round(afterShopCode * SAMPLE_COMMISSION_RATE);
  const payout = afterShopCode - commission;

  return (
    <aside className="grid min-w-0 content-start gap-3.5 rounded-xl bg-muted p-4">
      <strong className="text-xs font-semibold">ตัวอย่าง</strong>
      <CouponTicket promotion={form} preview />
      <dl className="grid gap-2.5 text-xs">
        <strong className="text-xs font-semibold">ถ้าลูกค้าซื้อ {money(subtotal)} จากร้านคุณ</strong>
        <PreviewRow label="ยอดสินค้า" value={money(subtotal)} />
        <PreviewRow label="โค้ดร้าน (ร้านออก)" value={`− ${money(discount)}`} className="text-amber-700" />
        <PreviewRow
          label={`คอมมิชชั่น ${SAMPLE_COMMISSION_RATE * 100}% ของ ${money(afterShopCode)}`}
          value={`− ${money(commission)}`}
        />
        <PreviewRow
          label="ร้านได้รับ (ไม่รวมค่าส่ง)"
          value={money(payout)}
          className="text-emerald-700"
          total
        />
        <p className="text-[11px] text-muted-foreground">
          ถ้าลูกค้าใช้โค้ด Pegasus ร่วมด้วย ร้านยังได้ {money(payout)} เท่าเดิม
        </p>
      </dl>
    </aside>
  );
}

function PreviewRow({
  label,
  value,
  className,
  total,
}: {
  label: string;
  value: string;
  className?: string;
  total?: boolean;
}) {
  return (
    <div className={total ? "flex justify-between gap-2 border-t border-border pt-2.5" : "flex justify-between gap-2"}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={className ? `font-semibold ${className}` : "font-semibold"}>{value}</dd>
    </div>
  );
}
