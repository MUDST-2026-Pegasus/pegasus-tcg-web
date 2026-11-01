import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LockKeyhole, LogOut, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/toast";
import { FormField, NumberInput, ToggleRow, ChoiceCard } from "@/features/admin/components/PromotionFormControls";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { getErrorMessage, hasErrorCode } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";
import { useCreateSellerPromotion, useUpdateSellerPromotion } from "../promotions.queries";
import { money } from "../promotions.format";
import { schemaForSellerPromotion } from "../promotions.schema";
import type { SellerPromotion, SellerPromotionInput } from "../promotions.types";
import { CouponTicket } from "./CouponTicket";

const newInput = (): SellerPromotionInput => ({
  code: "", name: "", description: "", discountType: "FIXED", discountValue: 100,
  maxDiscount: null, minSpend: 1000, visibility: "PUBLIC", newBuyerOnly: false,
  usageLimitTotal: 50, usageLimitPerUser: 1, claimable: true, claimLimit: 100,
  startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
});

function fromExisting(source: SellerPromotion): SellerPromotionInput {
  return {
    code: source.code, name: source.name, description: source.description,
    discountType: source.discountType, discountValue: source.discountValue,
    maxDiscount: source.maxDiscount, minSpend: source.minSpend, visibility: source.visibility,
    newBuyerOnly: source.newBuyerOnly, usageLimitTotal: source.usageLimitTotal,
    usageLimitPerUser: source.usageLimitPerUser, claimable: source.claimable,
    claimLimit: source.claimLimit, startsAt: source.startsAt, endsAt: source.endsAt,
  };
}

function toLocal(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : "";
}

/** ตัวอย่างตาม Figma: ใช้อัตราคอมมิชชั่นสมมติ 5% เพื่ออธิบายการคำนวณเท่านั้น */
const SAMPLE_COMMISSION_RATE = 0.05;

export function SellerPromotionForm({
  existing, open, verified, onClose,
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
  const form = useWatch({ control }) as SellerPromotionInput;
  const locked = !!existing && existing.usedCount > 0;
  const requestClose = () => isDirty ? setConfirmClose(true) : onClose();
  const busy = create.isPending || update.isPending;

  const save = handleSubmit(async (input) => {
    const payload = { ...input, code: input.code.trim().toUpperCase() };
    try {
      if (existing) await update.mutateAsync({ id: existing.id, input: payload });
      else await create.mutateAsync(payload);
      onClose();
      toast.add({
        title: existing ? `บันทึกโค้ด ${payload.code} แล้ว` : `สร้างโค้ด ${payload.code} แล้ว`,
        type: "success",
        actionProps: existing ? undefined : {
          children: "คัดลอกโค้ด",
          onClick: () => void navigator.clipboard?.writeText(payload.code),
        },
      });
    } catch (error) {
      if (hasErrorCode(error, "PROMO_CODE_TAKEN")) {
        setError("code", { message: "โค้ดนี้ถูกใช้แล้วในระบบ (PROMO_CODE_TAKEN)" });
        return;
      }
      if (applyApiErrors(error, setError)) return;
      toast.add({
        title: "บันทึกไม่สำเร็จ",
        description: hasErrorCode(error, "SELLER_NOT_VERIFIED")
          ? "กรุณายืนยันตัวตนผู้ขายก่อนสร้างโค้ด"
          : getErrorMessage(error, "กรุณาลองอีกครั้ง"),
        type: "error",
      });
    }
  });

  const textField = (label: string, key: "code" | "name" | "description", hint?: string, disabled = false) => (
    <FormField field={key} label={label} hint={hint} error={errors[key]?.message}>
      <Controller control={control} name={key} render={({ field }) => (
        <div className="relative">
          <Input aria-label={label} aria-invalid={!!errors[key]} disabled={disabled}
            value={field.value ?? ""} onChange={(event) => field.onChange(
              key === "code" ? event.target.value.toUpperCase() : event.target.value)}
            className="h-9 pr-9" />
          {disabled && <LockKeyhole className="pointer-events-none absolute top-2.5 right-3 size-4 text-muted-foreground" />}
        </div>
      )} />
    </FormField>
  );
  const numberField = (
    label: string,
    key: "discountValue" | "maxDiscount" | "minSpend" | "usageLimitTotal" | "usageLimitPerUser" | "claimLimit",
    unit: string, hint?: string, disabled = false,
  ) => (
    <FormField field={key} label={label} hint={hint} error={errors[key]?.message}>
      <Controller control={control} name={key} render={({ field }) => (
        <NumberInput id={key} label={label} value={field.value} onChange={field.onChange}
          prefix={unit === "฿" ? unit : undefined} suffix={unit === "฿" ? undefined : unit}
          locked={disabled} invalid={!!errors[key]} />
      )} />
    </FormField>
  );
  const dateField = (label: string, key: "startsAt" | "endsAt") => (
    <FormField field={key} label={label} error={errors[key]?.message}>
      <Controller control={control} name={key} render={({ field }) => (
        <Input aria-label={label} aria-invalid={!!errors[key]} type="datetime-local"
          value={toLocal(field.value)} onChange={(event) => field.onChange(
            event.target.value ? new Date(event.target.value).toISOString() : "" )} />
      )} />
    </FormField>
  );
  const exampleSubtotal = Math.max(1200, form.minSpend || 0);
  const exampleDiscount = form.discountType === "FIXED"
    ? form.discountValue || 0
    : Math.min(exampleSubtotal * (form.discountValue || 0) / 100, form.maxDiscount ?? Infinity);
  const afterShopCode = Math.max(0, exampleSubtotal - exampleDiscount);
  const commission = afterShopCode * SAMPLE_COMMISSION_RATE;

  return <>
    <Dialog open={open} onOpenChange={(value) => { if (!value) requestClose(); }}>
      <DialogContent showCloseButton={false}
        className={`w-[calc(100vw-32px)] max-w-[820px] sm:max-w-[820px] max-h-[90svh] overflow-auto rounded-xl border-border p-0 ${locked ? "sm:max-w-[460px]" : ""}`}>
        <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-[minmax(0,1.55fr)_minmax(235px,1fr)] sm:p-6">
          <div className="grid min-w-0 content-start gap-3.5">
            <DialogHeader>
              {locked && <div className="grid size-10 place-items-center rounded-lg bg-teal-50 text-teal-700 [&_svg]:size-5"><Pencil /></div>}
              <DialogTitle>{existing ? `แก้ไขโค้ด ${existing.code}` : "สร้างโค้ดร้าน"}</DialogTitle>
              {locked && <p>ลูกค้าใช้แล้ว {existing.usedCount} ครั้ง · ช่องที่มีรูปกุญแจแก้ไม่ได้เพื่อให้ออเดอร์คิดส่วนลดแบบเดียวกัน</p>}
            </DialogHeader>
            {locked ? <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {textField("รหัสโค้ด", "code", undefined, true)}
                {numberField("ส่วนลด", "discountValue", form.discountType === "FIXED" ? "฿" : "%", undefined, true)}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {numberField("ยอดขั้นต่ำ", "minSpend", "฿", undefined, true)}
                {textField("ชื่อที่ลูกค้าเห็น", "name")}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {dateField("สิ้นสุด (ยืดได้)", "endsAt")}
                {numberField("สิทธิ์ต่อคน", "usageLimitPerUser", "ครั้ง", undefined, true)}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {numberField(`จำนวนสิทธิ์ (≥ ${existing.usedCount})`, "usageLimitTotal", "สิทธิ์")}
                {form.claimable && numberField(`จำนวนที่แจก (≥ ${existing.claimedCount})`, "claimLimit", "ใบ")}
              </div>
            </> : <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {textField("รหัสโค้ด *", "code", "A–Z 0–9 · 4–20 ตัว")}
                {textField("ชื่อที่ลูกค้าเห็น *", "name")}
              </div>
              <FormField field="discountType" label="ประเภทส่วนลด">
                <Controller control={control} name="discountType" render={({ field }) => (
                  <RadioGroup value={field.value} onValueChange={field.onChange}
                    className="grid grid-cols-2 gap-2">
                    <ChoiceCard value="FIXED" title="ลดเป็นบาท" hint="ส่วนลดเป็นจำนวนเงิน" />
                    <ChoiceCard value="PERCENT" title="ลดเป็น %" hint="ส่วนลดเป็นเปอร์เซ็นต์" />
                  </RadioGroup>
                )} />
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {numberField("ลด *", "discountValue", form.discountType === "FIXED" ? "฿" : "%")}
                {numberField("ยอดขั้นต่ำ (เฉพาะสินค้าร้านนี้)", "minSpend", "฿", "ส่วนลดต้องไม่เกินยอดขั้นต่ำ")}
              </div>
              {form.discountType === "PERCENT" && numberField("เพดานส่วนลด", "maxDiscount", "฿")}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {dateField("เริ่ม *", "startsAt")}{dateField("สิ้นสุด", "endsAt")}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {numberField("จำนวนสิทธิ์ทั้งหมด", "usageLimitTotal", "สิทธิ์", "เว้นว่าง = ไม่จำกัด")}
                {numberField("สิทธิ์ต่อคน", "usageLimitPerUser", "ครั้ง")}
              </div>
              <FormField field="visibility" label="การมองเห็น">
                <Controller control={control} name="visibility" render={({ field }) => (
                  <RadioGroup value={field.value} onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "PRIVATE") setValue("claimable", false, { shouldDirty: true });
                  }} className="grid grid-cols-2 gap-2">
                    <ChoiceCard value="PUBLIC" title="สาธารณะ" hint="แสดงบนหน้าร้าน" />
                    <ChoiceCard value="PRIVATE" title="ส่วนตัว" hint="ลูกค้าพิมพ์โค้ดเอง" />
                  </RadioGroup>
                )} />
              </FormField>
              <Controller control={control} name="claimable" render={({ field }) => (
                <ToggleRow id="claimable" title="ให้ลูกค้ากดเก็บที่หน้าร้าน"
                  hint="แสดงในแถบโค้ดส่วนลดของร้าน (ต้องเป็นสาธารณะ)"
                  checked={field.value} disabled={form.visibility !== "PUBLIC"}
                  onChange={field.onChange} />
              )} />
              {errors.claimable && <p role="alert" className="text-xs text-destructive">{errors.claimable.message}</p>}
              {form.claimable && numberField("จำนวนที่แจก", "claimLimit", "ใบ", "เว้นว่าง = ไม่จำกัด")}
              {textField("คำอธิบาย", "description")}
            </>}
            <DialogFooter className="mt-1 border-t border-border bg-muted/60 pt-3">
              <Button variant="outline" onClick={requestClose}>ยกเลิก</Button>
              <Button disabled={busy || !verified} onClick={() => void save()}>
                {existing ? "บันทึก" : "สร้างโค้ด"}
              </Button>
            </DialogFooter>
          </div>
          {!locked && <aside className="grid min-w-0 content-start gap-3.5 rounded-lg bg-muted p-4 max-sm:order-first [&>strong]:text-xs">
            <strong>ตัวอย่าง</strong><CouponTicket promotion={form} preview />
            <div className="grid gap-2.5 text-xs [&>div]:flex [&>div]:justify-between [&>div]:gap-2 [&_b]:font-semibold [&_.discount]:text-amber-700 [&_.total]:border-t [&_.total]:border-border [&_.total]:pt-2.5 [&_.total_b]:text-emerald-700 [&_p]:text-xs [&_p]:text-muted-foreground">
              <strong>ถ้าลูกค้าซื้อ {money(exampleSubtotal)} จากร้านคุณ</strong>
              <div><span>ยอดสินค้า</span><b>{money(exampleSubtotal)}</b></div>
              <div><span>โค้ดร้าน (ร้านออก)</span><b className="discount">− {money(exampleDiscount)}</b></div>
              <div><span>คอมมิชชั่นตัวอย่าง 5% ของ {money(afterShopCode)}</span><b>− {money(commission)}</b></div>
              <div className="total"><span>ร้านได้รับ (ไม่รวมค่าส่ง)</span>
                <b>{money(Math.max(0, afterShopCode - commission))}</b></div>
              <p>ถ้าลูกค้าใช้โค้ด Pegasus ร่วมด้วย ร้านยังได้ยอดนี้เท่าเดิม</p>
            </div>
          </aside>}
        </div>
      </DialogContent>
    </Dialog>
    <PromotionDialog open={confirmClose} onOpenChange={setConfirmClose} tone="warning"
      icon={<LogOut />} title="ทิ้งการแก้ไข?"
      description="ข้อมูลที่กรอกในฟอร์มยังไม่ได้บันทึก ถ้าปิดตอนนี้จะหายทั้งหมด"
      actions={<>
        <Button variant="outline" onClick={() => setConfirmClose(false)}>กลับไปแก้ต่อ</Button>
        <Button className="bg-destructive text-white hover:bg-destructive/90"
          onClick={() => { setConfirmClose(false); onClose(); }}>ทิ้งการแก้ไข</Button>
      </>} />
  </>;
}
