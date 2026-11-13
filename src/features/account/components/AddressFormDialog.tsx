import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import { applyApiErrors } from "@/lib/form";

import { useCreateAddress, useUpdateAddress } from "../address.queries";
import {
  useAddressSchema,
  EMPTY_ADDRESS_FORM,
  toAddressForm,
  toAddressPayload,
  type AddressFormValues,
} from "../address.schema";
import type { Address } from "../address.types";
import { translateError, useTranslate } from "@/lib/i18n";

type AddressFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ไม่ส่งมา = เพิ่มที่อยู่ใหม่ */
  address?: Address;
  onSaved?: (address: Address) => void;
};

/**
 * ฟอร์มเดียวใช้ทั้งเพิ่มและแก้ เพราะ `POST` กับ `PUT` รับ body หน้าตาเดียวกัน
 *
 * ตัวฟอร์มแยกเป็น component ข้างใน `DialogContent` ที่ถูก unmount ตอนปิด
 * ค่าตั้งต้นจึงถูกคำนวณใหม่ทุกครั้งที่เปิด ไม่ต้อง `reset()` ใน effect
 */
export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSaved,
}: AddressFormDialogProps) {
  const { t } = useTranslate("buyer");
  const isEdit = address !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("account.address.form.editTitle", "แก้ไขที่อยู่") : t("account.address.form.addTitle", "เพิ่มที่อยู่ใหม่")}
          </DialogTitle>
          <DialogDescription>
            {t("account.address.form.description", "ที่อยู่ที่บันทึกไว้จะแสดงตอนชำระเงิน กรอกแค่ครั้งเดียว")}
          </DialogDescription>
        </DialogHeader>
        <AddressForm
          key={address?.id ?? "new"}
          address={address}
          onSaved={(saved) => {
            onSaved?.(saved);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddressForm({
  address,
  onSaved,
}: {
  address?: Address;
  onSaved: (address: Address) => void;
}) {
  const { t } = useTranslate("buyer");
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const schema = useAddressSchema();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(schema),
    defaultValues: address ? toAddressForm(address) : EMPTY_ADDRESS_FORM,
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = toAddressPayload(values, address);

    try {
      const saved = address
        ? await updateAddress.mutateAsync({ addressId: address.id, payload })
        : await createAddress.mutateAsync(payload);
      onSaved(saved);
    } catch (error) {
      // ชื่อฟิลด์ใน violations ตรงกับชื่อช่องอยู่แล้ว ไม่ต้อง map
      // ตัวที่ไม่มีช่องรับผิดชอบจะไปโผล่ที่ Alert ด้านบนฟอร์มแทน
      applyApiErrors(error, setError);
    }
  });

  const failed = address ? updateAddress.error : createAddress.error;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {failed && (
        <Alert variant="destructive">
          <AlertDescription>
            {translateError(failed, t("account.address.form.failed", "บันทึกที่อยู่นี้ไม่สำเร็จ"))}
          </AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(errors.label) || undefined}>
          <FieldLabel htmlFor="label">{t("account.address.field.label", "ชื่อที่อยู่")}</FieldLabel>
          <Input
            id="label"
            placeholder={t("account.address.form.labelPlaceholder", "บ้าน, ที่ทำงาน, …")}
            aria-invalid={Boolean(errors.label)}
            {...register("label")}
          />
          <FieldError errors={[errors.label]} />
        </Field>

        <Field data-invalid={Boolean(errors.recipientName) || undefined}>
          <FieldLabel htmlFor="recipientName">{t("account.address.field.recipientName", "ชื่อผู้รับ")}</FieldLabel>
          <Input
            id="recipientName"
            autoComplete="name"
            aria-invalid={Boolean(errors.recipientName)}
            {...register("recipientName")}
          />
          <FieldError errors={[errors.recipientName]} />
        </Field>

        <Field data-invalid={Boolean(errors.phone) || undefined}>
          <FieldLabel htmlFor="phone">{t("account.address.field.phone", "เบอร์โทรศัพท์")}</FieldLabel>
          <Input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08x-xxx-xxxx"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          <FieldError errors={[errors.phone]} />
        </Field>

        <Field data-invalid={Boolean(errors.line1) || undefined}>
          <FieldLabel htmlFor="line1">{t("account.address.field.line1", "ที่อยู่บรรทัดที่ 1")}</FieldLabel>
          <Input
            id="line1"
            autoComplete="address-line1"
            placeholder={t("account.address.form.line1Placeholder", "บ้านเลขที่ ถนน")}
            aria-invalid={Boolean(errors.line1)}
            {...register("line1")}
          />
          <FieldError errors={[errors.line1]} />
        </Field>

        <Field data-invalid={Boolean(errors.line2) || undefined}>
          <FieldLabel htmlFor="line2">{t("account.address.field.line2", "ที่อยู่บรรทัดที่ 2")}</FieldLabel>
          <Input
            id="line2"
            autoComplete="address-line2"
            placeholder={t("account.address.form.line2Placeholder", "อาคาร ชั้น ห้อง")}
            aria-invalid={Boolean(errors.line2)}
            {...register("line2")}
          />
          <FieldError errors={[errors.line2]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.subdistrict) || undefined}>
            <FieldLabel htmlFor="subdistrict">{t("account.address.field.subdistrict", "ตำบล / แขวง")}</FieldLabel>
            <Input
              id="subdistrict"
              aria-invalid={Boolean(errors.subdistrict)}
              {...register("subdistrict")}
            />
            <FieldError errors={[errors.subdistrict]} />
          </Field>

          <Field data-invalid={Boolean(errors.district) || undefined}>
            <FieldLabel htmlFor="district">{t("account.address.field.district", "อำเภอ / เขต")}</FieldLabel>
            <Input
              id="district"
              aria-invalid={Boolean(errors.district)}
              {...register("district")}
            />
            <FieldError errors={[errors.district]} />
          </Field>

          <Field data-invalid={Boolean(errors.province) || undefined}>
            <FieldLabel htmlFor="province">{t("account.address.field.province", "จังหวัด")}</FieldLabel>
            <Input
              id="province"
              autoComplete="address-level1"
              aria-invalid={Boolean(errors.province)}
              {...register("province")}
            />
            <FieldError errors={[errors.province]} />
          </Field>

          <Field data-invalid={Boolean(errors.postalCode) || undefined}>
            <FieldLabel htmlFor="postalCode">{t("account.address.field.postalCode", "รหัสไปรษณีย์")}</FieldLabel>
            <Input
              id="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="10110"
              aria-invalid={Boolean(errors.postalCode)}
              {...register("postalCode")}
            />
            <FieldError errors={[errors.postalCode]} />
          </Field>
        </div>

        <Field orientation="horizontal">
          <Controller
            control={control}
            name="defaultShipping"
            render={({ field }) => (
              <Checkbox
                id="defaultShipping"
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
                onBlur={field.onBlur}
                disabled={address?.defaultShipping}
              />
            )}
          />
          <FieldLabel htmlFor="defaultShipping" className="font-normal">
            {t("account.address.form.default", "ใช้เป็นที่อยู่จัดส่งหลัก")}
          </FieldLabel>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          {t("account.orders.cancel", "ยกเลิก")}
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {address ? t("account.address.form.save", "บันทึกการเปลี่ยนแปลง") : t("account.address.form.add", "เพิ่มที่อยู่")}
        </Button>
      </DialogFooter>
    </form>
  );
}
