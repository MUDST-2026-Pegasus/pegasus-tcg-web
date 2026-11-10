import { z } from "zod";

import type { AuthUser } from "@/features/auth/auth.types";
import { useTranslate } from "@/lib/i18n";

import type { UpdateProfilePayload } from "./profile.types";

type ProfileMessages = { nameBlank: string; nameMax: string; phoneMax: string; phoneInvalid: string; bioMax: string };

const buildEditProfileSchema = (m: ProfileMessages) =>
  z.object({
    displayName: z.string().trim().min(1, m.nameBlank).max(100, m.nameMax),
    phone: z
      .string()
      .trim()
      .max(20, m.phoneMax)
      .refine((val) => !val || /^(\+?\d[\d()\-\s]*)?$/.test(val), m.phoneInvalid),
    phonePublic: z.boolean().optional(),
    bio: z.string().trim().max(1000, m.bioMax),
    avatarUrl: z.string().trim().optional(),
  });

/** schema ที่ข้อความ validation ตามภาษาปัจจุบัน */
export function useEditProfileSchema() {
  const { t } = useTranslate("buyer");
  return buildEditProfileSchema({
    nameBlank: t("account.profile.validation.nameBlank", "Name must not be blank"),
    nameMax: t("account.profile.validation.nameMax", "Name must be at most 100 characters"),
    phoneMax: t("account.profile.validation.phoneMax", "Phone number must be at most 20 characters"),
    phoneInvalid: t("account.profile.validation.phoneInvalid", "Enter a valid phone number"),
    bioMax: t("account.profile.validation.bioMax", "Bio must be at most 1000 characters"),
  });
}

// shortcut: ข้อความคงที่ (อังกฤษ) สำหรับ seller ShopProfileCard — ให้ seller (TCG-555) ย้ายไปใช้ useEditProfileSchema แล้วลบตัวนี้
export const editProfileSchema = buildEditProfileSchema({
  nameBlank: "Name must not be blank",
  nameMax: "Name must be at most 100 characters",
  phoneMax: "Phone number must be at most 20 characters",
  phoneInvalid: "Enter a valid phone number",
  bioMax: "Bio must be at most 1000 characters",
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function toEditProfileForm(user: AuthUser): EditProfileFormValues {
  return {
    displayName: user.displayName?.trim() || user.username || "",
    phone: user.phone ?? "",
    phonePublic: user.phonePublic ?? false,
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
  };
}

export type UpdateProfileOptions = {
  /** S3 objectKey ที่เพิ่งอัปโหลดสำเร็จผ่าน useFileUpload (purpose AVATAR_IMAGE) */
  newAvatarKey?: string | null;
  /** ผู้ใช้เลือกที่จะลบรูปโปรไฟล์ออก */
  isAvatarCleared?: boolean;
  /** รายการฟิลด์ที่ผู้ใช้แก้ไขจริงจาก react-hook-form */
  dirtyFields?: Partial<Record<keyof EditProfileFormValues, boolean>>;
};

export function toUpdateProfilePayload(
  values: EditProfileFormValues,
  options?: UpdateProfileOptions,
): UpdateProfilePayload {
  const dirty = options?.dirtyFields;

  // Selective update: ถ้ากำหนด dirtyFields มา ฟิลด์ที่ไม่ถูกแก้ไขจะส่ง null เพื่อคงค่าเดิมใน DB
  let phone: string | null = null;
  if (!dirty || dirty.phone) {
    phone = values.phone.trim();
  }

  let bio: string | null = null;
  if (!dirty || dirty.bio) {
    bio = values.bio.trim();
  }

  let avatarUrl: string | null;
  if (options?.isAvatarCleared) {
    avatarUrl = ""; // Backend null-semantics: "" = clear to NULL and delete storage file
  } else if (options?.newAvatarKey) {
    avatarUrl = options.newAvatarKey;
  } else if (dirty?.avatarUrl && values.avatarUrl && !values.avatarUrl.startsWith("http")) {
    avatarUrl = values.avatarUrl.trim();
  } else {
    avatarUrl = null; // null = keep current avatar
  }

  const payload: UpdateProfilePayload = {
    displayName: values.displayName.trim(),
    phone,
    bio,
    avatarUrl,
  };

  if ((!dirty || dirty.phonePublic) && values.phonePublic !== undefined) {
    payload.phonePublic = values.phonePublic;
  }

  return payload;
}
