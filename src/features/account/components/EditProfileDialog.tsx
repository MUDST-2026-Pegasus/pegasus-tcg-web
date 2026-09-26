import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getErrorMessage } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";
import type { AuthUser } from "@/features/auth/auth.types";

import { initialsOf } from "../account.format";
import { useUpdateProfile } from "../profile.queries";
import {
  editProfileSchema,
  toEditProfileForm,
  toUpdateProfilePayload,
  type EditProfileFormValues,
} from "../profile.schema";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and profile display.
          </DialogDescription>
        </DialogHeader>
        <EditProfileForm
          key={user.id}
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
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarCleared, setIsAvatarCleared] = useState(false);

  const avatarUpload = useFileUpload({
    purpose: "AVATAR_IMAGE",
    multiple: false,
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: toEditProfileForm(user),
  });

  const uploadedAvatarKey = avatarUpload.objectKeys[0] ?? null;
  const isUploading = avatarUpload.isUploading;
  const previewItem = avatarUpload.items[0];
  const hasUploadError = previewItem?.status === "error";

  // ISSUE-002: Do not display preview if upload resulted in error
  const avatarPreview = !isAvatarCleared
    ? (previewItem && previewItem.status !== "error"
        ? previewItem.previewUrl
        : user.avatarUrl) || null
    : null;

  const initials = initialsOf(user.displayName ?? user.username ?? "U");

  // ISSUE-004: Disable submit when form has no changes
  const hasChanges =
    isDirty || isAvatarCleared || Boolean(uploadedAvatarKey);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = toUpdateProfilePayload(values, {
        newAvatarKey: uploadedAvatarKey,
        isAvatarCleared,
        dirtyFields,
      });
      await updateProfile.mutateAsync(payload);
      toast.add({
        type: "success",
        title: "Profile updated",
        description: "Your profile changes have been saved successfully.",
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
            {getErrorMessage(updateProfile.error, "Could not save profile changes.")}
          </AlertDescription>
        </Alert>
      )}

      {/* Avatar upload / preview section */}
      <div className="flex flex-col items-center gap-3">
        <Avatar className="size-20">
          {avatarPreview && <AvatarImage src={avatarPreview} alt={user.displayName ?? ""} />}
          <AvatarFallback className="text-xl font-medium">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={avatarUpload.accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setIsAvatarCleared(false);
                avatarUpload.addFiles(e.target.files);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || isSubmitting}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Spinner data-icon="inline-start" />
                Uploading...
              </>
            ) : (
              "Change photo"
            )}
          </Button>

          {(avatarPreview || user.avatarUrl) && !isAvatarCleared && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUploading || isSubmitting}
              onClick={() => {
                setIsAvatarCleared(true);
                avatarUpload.clear();
              }}
            >
              Remove
            </Button>
          )}
        </div>

        {previewItem?.status === "error" && (
          <p className="text-xs text-destructive">{previewItem.error}</p>
        )}
      </div>

      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(errors.displayName) || undefined}>
          <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
          <Input
            id="displayName"
            autoComplete="name"
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
          />
          <FieldError errors={[errors.displayName]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            value={user.email}
            disabled
            className="bg-muted/50 text-muted-foreground"
          />
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

        <Field className="hidden">
          <FieldLabel htmlFor="avatarUrl">Avatar URL</FieldLabel>
          <Input
            id="avatarUrl"
            type="text"
            aria-invalid={Boolean(errors.avatarUrl)}
            {...register("avatarUrl")}
          />
        </Field>

        <Field data-invalid={Boolean(errors.bio) || undefined}>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea
            id="bio"
            placeholder="Tell other collectors about yourself..."
            rows={3}
            aria-invalid={Boolean(errors.bio)}
            {...register("bio")}
          />
          <FieldError errors={[errors.bio]} />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={isSubmitting || isUploading || hasUploadError || !hasChanges}
        >
          {(isSubmitting || isUploading) && <Spinner data-icon="inline-start" />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}
