import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { applyApiErrors } from "@/lib/form";
import type { AuthUser } from "@/features/auth/auth.types";

import { useUpdateProfile } from "../profile.queries";
import {
  useEditProfileSchema,
  toEditProfileForm,
  toUpdateProfilePayload,
  type EditProfileFormValues,
} from "../profile.schema";
import { translateError, useTranslate } from "@/lib/i18n";

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser;
};

export function EditProfileDialog({
  open,
  onOpenChange,
  user,
}: EditProfileDialogProps) {
  const { t } = useTranslate("buyer");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
          showCloseButton={false}
          overlayClassName="supports-backdrop-filter:backdrop-blur-none !backdrop-blur-none bg-black/45"
          className="max-h-[calc(100svh-2rem)] overflow-y-auto rounded-2xl p-6 sm:max-w-md"
      >
        <DialogHeader className="gap-1 text-left">
          <DialogTitle className="text-xl font-bold text-foreground">
            {t("account.profile.edit.title", "แก้ไขโปรไฟล์")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("account.profile.edit.description", "แก้ไขข้อมูลส่วนตัวของคุณ")}
          </DialogDescription>
        </DialogHeader>
        <EditProfileForm
          key={`${user.id}-${user.phonePublic ?? false}-${user.phone ?? ""}-${user.displayName ?? ""}`}
          user={user}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditProfileForm({
  user,
  onSaved,
}: {
  user: AuthUser;
  onSaved: () => void;
}) {
  const { t } = useTranslate("buyer");
  const updateProfile = useUpdateProfile();

  const schema = useEditProfileSchema();
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toEditProfileForm(user),
  });

  const phone = watch("phone") ?? "";
  const phonePublic = watch("phonePublic") ?? false;
  const isPhoneBlank = !phone.trim();
  const isSwitchDisabled = isSubmitting || isPhoneBlank;

  const hasChanges = isDirty;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = toUpdateProfilePayload(values, {
        dirtyFields,
      });
      await updateProfile.mutateAsync(payload);
      toast.add({
        type: "success",
        title: t("account.profile.edit.saved", "อัปเดตโปรไฟล์แล้ว"),
        description: t("account.profile.edit.savedHint", "บันทึกการเปลี่ยนแปลงโปรไฟล์เรียบร้อยแล้ว"),
      });
      onSaved();
    } catch (error) {
      applyApiErrors(error, setError);
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {updateProfile.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {translateError(updateProfile.error, t("account.profile.edit.failed", "บันทึกโปรไฟล์ไม่สำเร็จ"))}
          </AlertDescription>
        </Alert>
      )}

      {/* Hidden inputs to preserve existing avatarUrl and bio without overwriting */}
      <input type="hidden" {...register("avatarUrl")} />
      <input type="hidden" {...register("bio")} />

      <FieldGroup className="gap-4">
        {/* Field 1: Name */}
        <Field className="gap-2" data-invalid={Boolean(errors.displayName) || undefined}>
          <FieldLabel htmlFor="displayName" className="text-sm font-medium text-foreground">
            {t("account.profile.edit.name", "ชื่อ")}
          </FieldLabel>
          <Input
            id="displayName"
            aria-label={t("account.profile.edit.nameAria", "ชื่อที่แสดง")}
            autoComplete="name"
            className="h-11 rounded-xl border border-input bg-white px-3.5 text-sm font-normal text-foreground dark:bg-background"
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
          />
          <FieldError errors={[errors.displayName]} />
        </Field>

        {/* Field 2: Email */}
        <Field className="gap-2">
          <FieldLabel htmlFor="email" className="text-sm font-medium text-foreground">
            {t("account.profile.edit.email", "อีเมล")}
          </FieldLabel>
          <Input
            id="email"
            value={user.email}
            disabled
            className="h-11 rounded-xl border border-input bg-muted/40 px-3.5 text-sm text-muted-foreground disabled:cursor-not-allowed disabled:opacity-100"
          />
        </Field>

        {/* Field 3: Phone Number */}
        <Field className="gap-2" data-invalid={Boolean(errors.phone) || undefined}>
          <FieldLabel htmlFor="phone" className="text-sm font-medium text-foreground">
            {t("account.profile.edit.phone", "เบอร์โทรศัพท์")}
          </FieldLabel>
          <Input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(+66) 89-123-4567"
            className="h-11 rounded-xl border border-input bg-white px-3.5 text-sm text-foreground dark:bg-background"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          <FieldError errors={[errors.phone]} />
        </Field>

        {/* Phone Visibility Switch Card */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/30 p-4">
          <div className="space-y-0.5">
            <label
              htmlFor="phone-public"
              className={cn(
                "text-sm font-medium text-foreground",
                isSwitchDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              )}
            >
              {t("account.profile.edit.showPhone", "แสดงเบอร์โทรบนหน้าร้าน")}
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {phonePublic
                ? t("account.profile.edit.phonePublic", "สาธารณะ · ผู้เข้าชมหน้าร้านมองเห็นเบอร์โทรได้")
                : t("account.profile.edit.phonePrivate", "Private · เฉพาะคุณที่เห็นเบอร์โทรในโปรไฟล์")}
            </p>
          </div>
          <Controller
            control={control}
            name="phonePublic"
            render={({ field }) => (
              <Switch
                id="phone-public"
                aria-label={t("account.profile.edit.showPhone", "แสดงเบอร์โทรบนหน้าร้าน")}
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isSwitchDisabled}
              />
            )}
          />
        </div>
      </FieldGroup>

      <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-3">
        <DialogClose
          render={
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full border border-input bg-background px-6 font-medium text-foreground hover:bg-muted"
            />
          }
        >
          {t("account.orders.cancel", "ยกเลิก")}
        </DialogClose>
        <Button
          type="submit"
          className="h-10 rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90"
          disabled={isSubmitting || !hasChanges}
        >
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {t("account.profile.edit.save", "บันทึกการเปลี่ยนแปลง")}
        </Button>
      </DialogFooter>
    </form>
  );
}
