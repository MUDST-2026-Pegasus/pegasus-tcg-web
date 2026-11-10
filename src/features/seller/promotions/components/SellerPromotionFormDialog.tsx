import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LogOut, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { toLocalInput } from "@/features/promotions/shared/promotionForm.dates";
import { hasErrorCode } from "@/lib/api";
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
import { translateError, useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("promotions");
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
        title: existing ? t("seller.sellerPromotionFormDialog.title", "บันทึกการแก้ไขแล้ว") : t("seller.sellerPromotionFormDialog.title2", "สร้างโค้ด {code} แล้ว", { code: payload.code }),
        type: "success",
        actionProps: existing
          ? undefined
          : {
              children: t("seller.sellerPromotionFormDialog.children", "คัดลอกโค้ด"),
              onClick: () => void navigator.clipboard?.writeText(payload.code),
            },
      });
    } catch (error) {
      if (hasErrorCode(error, "PROMO_CODE_TAKEN")) {
        setError("code", { message: t("seller.sellerPromotionFormDialog.message", "โค้ดนี้ถูกใช้แล้วในระบบ (PROMO_CODE_TAKEN)") }, { shouldFocus: true });
        return;
      }
      if (applyApiErrors(error, setError)) return;
      toast.add({
        title: t("seller.sellerPromotionFormDialog.title3", "บันทึกไม่สำเร็จ"),
        description: hasErrorCode(error, "SELLER_NOT_VERIFIED")
          ? t("seller.sellerPromotionFormDialog.description", "กรุณายืนยันตัวตนผู้ขายก่อนสร้างโค้ด")
          : hasErrorCode(error, "PROMO_IN_USE")
            ? t("seller.sellerPromotionFormDialog.description2", "โค้ดนี้มีลูกค้าใช้หรือเก็บแล้ว แก้ได้เฉพาะชื่อ วันสิ้นสุดที่ยาวขึ้น และจำนวนสิทธิ์ที่เพิ่มขึ้น")
            : translateError(error, t("seller.sellerPromotionFormDialog.translateError", "กรุณาลองอีกครั้ง")),
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
      title={t("seller.sellerPromotionFormDialog.title4", "ทิ้งการแก้ไข?")}
      description={t("seller.sellerPromotionFormDialog.description3", "ข้อมูลที่กรอกในฟอร์มยังไม่ได้บันทึก ถ้าปิดตอนนี้จะหายทั้งหมด")}
      actions={
        <>
          <Button variant="outline" onClick={() => setConfirmClose(false)}>
            {t("seller.sellerPromotionFormDialog.button", "กลับไปแก้ต่อ")}
          </Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => {
              setConfirmClose(false);
              onClose();
            }}
          >
            {t("seller.sellerPromotionFormDialog.button2", "ทิ้งการแก้ไข")}
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
          title={t("seller.sellerPromotionFormDialog.title5", "แก้ไขโค้ด {code}", { code: existing.code })}
          description={t("seller.sellerPromotionFormDialog.description4", "ลูกค้าใช้แล้ว {usedCount} ครั้ง · ช่องที่มี 🔒 แก้ไม่ได้เพื่อให้ทุกออเดอร์คิดส่วนลดแบบเดียวกัน", { usedCount: existing.usedCount })}
          className="sm:max-w-[460px]"
          actions={
            <>
              <Button variant="outline" onClick={requestClose}>
                {t("seller.sellerPromotionFormDialog.button3", "ยกเลิก")}
              </Button>
              <Button disabled={busy || !verified} onClick={() => void save()}>
                {t("seller.sellerPromotionFormDialog.button4", "บันทึก")}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LockedText label={t("seller.sellerPromotionFormDialog.label", "รหัสโค้ด")} value={existing.code} />
            <LockedText label={t("seller.sellerPromotionFormDialog.label2", "ส่วนลด")} value={discountLabel(existing)} />
            <LockedText label={t("seller.sellerPromotionFormDialog.label3", "ยอดขั้นต่ำ")} value={existing.minSpend > 0 ? money(existing.minSpend) : t("seller.sellerPromotionFormDialog.value", "ไม่มีขั้นต่ำ")} />
            <TextField control={control} errors={errors} name="name" label={t("seller.sellerPromotionFormDialog.label4", "ชื่อที่ลูกค้าเห็น")} />
            <DateField
              control={control}
              errors={errors}
              name="endsAt"
              label={t("seller.sellerPromotionFormDialog.label5", "สิ้นสุด (ยืดได้)")}
              min={toLocalInput(existing.endsAt)}
            />
            <NumberField
              control={control}
              errors={errors}
              name="usageLimitPerUser"
              label={t("seller.sellerPromotionFormDialog.label6", "สิทธิ์ต่อคน")}
              unit={t("seller.sellerPromotionFormDialog.unit", "ครั้ง")}
              locked
            />
            <NumberField
              control={control}
              errors={errors}
              name="usageLimitTotal"
              label={t("seller.sellerPromotionFormDialog.label7", "จำนวนสิทธิ์ (≥ {usedCount})", { usedCount: existing.usedCount })}
              unit={t("seller.sellerPromotionFormDialog.unit2", "สิทธิ์")}
            />
            {existing.claimable ? (
              <NumberField
                control={control}
                errors={errors}
                name="claimLimit"
                label={t("seller.sellerPromotionFormDialog.label8", "จำนวนที่แจก (≥ {claimedCount})", { claimedCount: existing.claimedCount })}
                unit={t("seller.sellerPromotionFormDialog.unit3", "ใบ")}
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
                {existing ? t("seller.sellerPromotionFormDialog.title5", "แก้ไขโค้ด {code}", { code: existing.code }) : t("seller.sellerPromotionFormDialog.dialogTitle", "สร้างโค้ดร้าน")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t("seller.sellerPromotionFormDialog.dialogDescription", "กรอกรายละเอียดโค้ดส่วนลดของร้าน ตัวอย่างตั๋วและยอดที่ร้านได้รับอยู่ด้านข้าง")}
              </DialogDescription>
              <Row>
                <TextField
                  control={control}
                  errors={errors}
                  name="code"
                  label={t("seller.sellerPromotionFormDialog.label", "รหัสโค้ด")}
                  required
                  hint={t("seller.sellerPromotionFormDialog.hint", "A–Z 0–9 · 4–20 ตัว")}
                  upper
                />
                <TextField control={control} errors={errors} name="name" label={t("seller.sellerPromotionFormDialog.label4", "ชื่อที่ลูกค้าเห็น")} required />
              </Row>
              <Segmented
                control={control}
                name="discountType"
                label={t("seller.sellerPromotionFormDialog.label9", "ประเภทส่วนลด")}
                options={[
                  ["FIXED", t("seller.sellerPromotionFormDialog.text", "ลดเป็นบาท")],
                  ["PERCENT", t("seller.sellerPromotionFormDialog.text2", "ลดเป็น %")],
                ]}
              />
              <DiscountFields control={control} errors={errors} />
              <Row>
                <DateField control={control} errors={errors} name="startsAt" label={t("seller.sellerPromotionFormDialog.label10", "เริ่ม")} required />
                <DateField control={control} errors={errors} name="endsAt" label={t("seller.sellerPromotionFormDialog.label11", "สิ้นสุด")} />
              </Row>
              <Row>
                <NumberField
                  control={control}
                  errors={errors}
                  name="usageLimitTotal"
                  label={t("seller.sellerPromotionFormDialog.label12", "จำนวนสิทธิ์ทั้งหมด")}
                  unit={t("seller.sellerPromotionFormDialog.unit2", "สิทธิ์")}
                  hint={t("seller.sellerPromotionFormDialog.hint2", "เว้นว่าง = ไม่จำกัด")}
                />
                <NumberField
                  control={control}
                  errors={errors}
                  name="usageLimitPerUser"
                  label={t("seller.sellerPromotionFormDialog.label13", "สิทธิ์ต่อลูกค้า")}
                  unit={t("seller.sellerPromotionFormDialog.unit", "ครั้ง")}
                />
              </Row>
              <Segmented
                control={control}
                name="visibility"
                label={t("seller.sellerPromotionFormDialog.label14", "การมองเห็น")}
                disabled={claimFixed}
                onPick={(value) => {
                  if (value === "PRIVATE") setValue("claimable", false, { shouldDirty: true });
                }}
                options={[
                  ["PUBLIC", t("seller.sellerPromotionFormDialog.text3", "สาธารณะ")],
                  ["PRIVATE", t("seller.sellerPromotionFormDialog.text4", "ส่วนตัว (พิมพ์เอง)")],
                ]}
              />
              <ClaimFields control={control} errors={errors} claimFixed={claimFixed} />
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={requestClose}>
                  {t("seller.sellerPromotionFormDialog.button3", "ยกเลิก")}
                </Button>
                <Button type="submit" disabled={busy || !verified}>
                  {existing ? t("seller.sellerPromotionFormDialog.button4", "บันทึก") : t("seller.sellerPromotionFormDialog.button5", "สร้างโค้ด")}
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
