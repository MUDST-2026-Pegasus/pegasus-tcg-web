import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LogOut, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { toLocalInput } from "@/features/promotions/shared/promotionForm.dates";
import { getErrorMessage, hasErrorCode } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

import { useCreateSellerPromotion, useUpdateSellerPromotion } from "../promotions.queries";
import { discountLabel, money } from "../promotions.format";
import { schemaForSellerPromotion } from "../promotions.schema";
import type { SellerPromotion, SellerPromotionInput } from "../promotions.types";
import {
  ClaimFields,
  DateField,
  DiscountFields,
  LockedText,
  NumberField,
  Row,
  Segmented,
  TextField,
} from "./SellerPromotionFields";
import { SellerPromotionPreview } from "./SellerPromotionPreview";

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
              min={toLocalInput(existing.endsAt)}
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
            <SellerPromotionPreview control={control} />
          </div>
        </DialogContent>
      </Dialog>
      {discard}
    </>
  );
}
