import { z } from "zod";

import type { AuthUser } from "@/features/auth/auth.types";

import type { UpdateProfilePayload } from "./profile.types";

export const editProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number must be at most 20 characters")
    .refine((val) => !val || /^[0-9+()\-\s]+$/.test(val), "Enter a valid phone number"),
  bio: z
    .string()
    .trim()
    .max(200, "Bio must be at most 200 characters"),
  avatarUrl: z
    .string()
    .trim()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), "Enter a valid image URL"),
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

const blankToNull = (value?: string) => (!value || value.trim() === "" ? null : value.trim());

export function toUpdateProfilePayload(values: EditProfileFormValues): UpdateProfilePayload {
  return {
    displayName: values.displayName.trim(),
    phone: blankToNull(values.phone),
    bio: blankToNull(values.bio),
    avatarUrl: blankToNull(values.avatarUrl),
  };
}
