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
import { getErrorMessage } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

import { useCreateAddress, useUpdateAddress } from "../address.queries";
import {
  addressSchema,
  EMPTY_ADDRESS_FORM,
  toAddressForm,
  toAddressPayload,
  type AddressFormValues,
} from "../address.schema";
import type { Address } from "../address.types";

type AddressFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ไม่ส่งมา = เพิ่มที่อยู่ใหม่ */
  address?: Address;
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
}: AddressFormDialogProps) {
  const isEdit = address !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Address" : "Add New Address"}
          </DialogTitle>
          <DialogDescription>
            Saved addresses show up at checkout, so you only type this once.
          </DialogDescription>
        </DialogHeader>
        <AddressForm
          key={address?.id ?? "new"}
          address={address}
          onSaved={() => onOpenChange(false)}
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
  onSaved: () => void;
}) {
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ? toAddressForm(address) : EMPTY_ADDRESS_FORM,
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = toAddressPayload(values, address);

    try {
      if (address) {
        await updateAddress.mutateAsync({ addressId: address.id, payload });
      } else {
        await createAddress.mutateAsync(payload);
      }
      onSaved();
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
            {getErrorMessage(failed, "Could not save this address.")}
          </AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(errors.label) || undefined}>
          <FieldLabel htmlFor="label">Label</FieldLabel>
          <Input
            id="label"
            placeholder="Home, Office, …"
            aria-invalid={Boolean(errors.label)}
            {...register("label")}
          />
          <FieldError errors={[errors.label]} />
        </Field>

        <Field data-invalid={Boolean(errors.recipientName) || undefined}>
          <FieldLabel htmlFor="recipientName">Recipient name</FieldLabel>
          <Input
            id="recipientName"
            autoComplete="name"
            aria-invalid={Boolean(errors.recipientName)}
            {...register("recipientName")}
          />
          <FieldError errors={[errors.recipientName]} />
        </Field>

        <Field data-invalid={Boolean(errors.phone) || undefined}>
          <FieldLabel htmlFor="phone">Phone number</FieldLabel>
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
          <FieldLabel htmlFor="line1">Address line 1</FieldLabel>
          <Input
            id="line1"
            autoComplete="address-line1"
            placeholder="House number, street"
            aria-invalid={Boolean(errors.line1)}
            {...register("line1")}
          />
          <FieldError errors={[errors.line1]} />
        </Field>

        <Field data-invalid={Boolean(errors.line2) || undefined}>
          <FieldLabel htmlFor="line2">Address line 2</FieldLabel>
          <Input
            id="line2"
            autoComplete="address-line2"
            placeholder="Building, floor, room"
            aria-invalid={Boolean(errors.line2)}
            {...register("line2")}
          />
          <FieldError errors={[errors.line2]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.subdistrict) || undefined}>
            <FieldLabel htmlFor="subdistrict">Subdistrict</FieldLabel>
            <Input
              id="subdistrict"
              aria-invalid={Boolean(errors.subdistrict)}
              {...register("subdistrict")}
            />
            <FieldError errors={[errors.subdistrict]} />
          </Field>

          <Field data-invalid={Boolean(errors.district) || undefined}>
            <FieldLabel htmlFor="district">District</FieldLabel>
            <Input
              id="district"
              aria-invalid={Boolean(errors.district)}
              {...register("district")}
            />
            <FieldError errors={[errors.district]} />
          </Field>

          <Field data-invalid={Boolean(errors.province) || undefined}>
            <FieldLabel htmlFor="province">Province</FieldLabel>
            <Input
              id="province"
              autoComplete="address-level1"
              aria-invalid={Boolean(errors.province)}
              {...register("province")}
            />
            <FieldError errors={[errors.province]} />
          </Field>

          <Field data-invalid={Boolean(errors.postalCode) || undefined}>
            <FieldLabel htmlFor="postalCode">Postal code</FieldLabel>
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
            Use as my default shipping address
          </FieldLabel>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {address ? "Save changes" : "Add address"}
        </Button>
      </DialogFooter>
    </form>
  );
}
