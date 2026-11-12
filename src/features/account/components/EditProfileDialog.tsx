import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Camera } from "lucide-react";

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
import { useFileUpload } from "@/hooks/use-file-upload";

import { initialsOf } from "../account.format";
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

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png"];

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
  "use no memo";
  const { t } = useTranslate("buyer");
  const updateProfile = useUpdateProfile();
  const upload = useFileUpload({ purpose: "AVATAR_IMAGE" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const schema = useEditProfileSchema();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toEditProfileForm(user),
  });

  const phone = useWatch({ control, name: "phone" }) ?? "";
  const phonePublic = useWatch({ control, name: "phonePublic" }) ?? false;
  const isPhoneBlank = !phone.trim();
  const isSwitchDisabled = isSubmitting || isPhoneBlank;

  const hasAvatarChange = Boolean(previewUrl);
  const hasChanges = isDirty || hasAvatarChange;
  const busy = isSubmitting || upload.isUploading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting the same file fires onChange
    e.target.value = "";

    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    const isJpegOrPng =
      ALLOWED_AVATAR_TYPES.includes(type) ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png");

    if (!isJpegOrPng) {
      toast.add({
        type: "error",
        title: t("account.profile.edit.avatarInvalidType", "รองรับเฉพาะไฟล์ JPG และ PNG เท่านั้น"),
      });
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.add({
        type: "error",
        title: t("account.profile.edit.avatarTooLarge", "ขนาดไฟล์ต้องไม่เกิน 5MB"),
      });
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const nextPreview = URL.createObjectURL(file);
    setPreviewUrl(nextPreview);
    upload.addFiles([file]);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = toUpdateProfilePayload(values, {
        dirtyFields,
        newAvatarKey: upload.objectKeys[0],
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

  const displayAvatarUrl = previewUrl || user.avatarUrl;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      {updateProfile.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {translateError(updateProfile.error, t("account.profile.edit.failed", "บันทึกโปรไฟล์ไม่สำเร็จ"))}
          </AlertDescription>
        </Alert>
      )}
      {upload.items[0]?.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {upload.items[0].error}
          </AlertDescription>
        </Alert>
      )}

      {/* Centered Circular Profile Photo Uploader */}
      <div className="flex flex-col items-center gap-2.5 my-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative h-24 w-24 rounded-full cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={t("account.profile.edit.changePhoto", "เปลี่ยนรูปโปรไฟล์")}
        >
          <div className="size-full overflow-hidden rounded-full border border-border/50 bg-muted shadow-sm flex items-center justify-center">
            {displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt={user.displayName?.trim() || user.username || t("account.profile.edit.avatarAlt", "รูปโปรไฟล์")}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-muted-foreground select-none">
                {initialsOf(user.displayName || user.username || "?")}
              </span>
            )}
          </div>
          <div
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#0066AD] text-white ring-2 ring-white shadow-sm transition-transform group-hover:scale-105"
            aria-hidden="true"
          >
            <Camera className="h-4 w-4" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          tabIndex={-1}
          aria-label={t("account.profile.edit.uploadPhoto", "อัปโหลดรูปโปรไฟล์")}
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground">
          {t("account.profile.edit.avatarHint", "คลิกที่รูปเพื่อเปลี่ยน · JPG, PNG ไม่เกิน 5MB")}
        </p>
      </div>

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
          disabled={busy || !hasChanges}
        >
          {busy && <Spinner data-icon="inline-start" />}
          {t("account.profile.edit.save", "บันทึกการเปลี่ยนแปลง")}
        </Button>
      </DialogFooter>
    </form>
  );
}
