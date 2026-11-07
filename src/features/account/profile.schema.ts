import { translate } from "@/lib/language";
import { z } from "zod";

import type { AuthUser } from "@/features/auth/auth.types";

import type { UpdateProfilePayload } from "./profile.types";

export const editProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: () => translate("กรุณากรอกชื่อ", "Name must not be blank") })
    .max(100, { error: () => translate("ชื่อต้องไม่เกิน 100 ตัวอักษร", "Name must be at most 100 characters") }),
  phone: z
    .string()
    .trim()
    .max(20, { error: () => translate("หมายเลขโทรศัพท์ต้องไม่เกิน 20 ตัวอักษร", "Phone number must be at most 20 characters") })
    .refine(
      (val) => !val || /^(\+?\d[\d()\-\s]*)?$/.test(val),
      { error: () => translate("กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง", "Enter a valid phone number") },
    ),
  bio: z
    .string()
    .trim()
    .max(1000, { error: () => translate("ประวัติย่อต้องไม่เกิน 1000 ตัวอักษร", "Bio must be at most 1000 characters") }),
  avatarUrl: z.string().trim().optional(),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function toEditProfileForm(user: AuthUser): EditProfileFormValues {
  return {
    displayName: user.displayName ?? "",
    phone: user.phone ?? "",
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

  return {
    displayName: values.displayName.trim(),
    phone,
    bio,
    avatarUrl,
  };
}
