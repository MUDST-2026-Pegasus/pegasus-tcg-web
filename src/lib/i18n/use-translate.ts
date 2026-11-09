import { useTranslate as useTolgeeTranslate, type DefaultParamType, type TFnType } from "@tolgee/react";

import type admin from "@/i18n/admin/th.json";
import type buyer from "@/i18n/buyer/th.json";
import type common from "@/i18n/common/th.json";
import type errors from "@/i18n/errors/th.json";
import type seller from "@/i18n/seller/th.json";
import type { Namespace } from "@/lib/i18n/tolgee";

/** "a.b.c" ทุก key ใน JSON แบบ nested */
type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown> ? Paths<T[K], `${P}${K}.`> : `${P}${K}`;
}[keyof T & string];

type KeysByNamespace = {
  common: Paths<typeof common>;
  errors: Paths<typeof errors>;
  buyer: Paths<typeof buyer>;
  seller: Paths<typeof seller>;
  admin: Paths<typeof admin>;
};

export type TranslationKey<N extends Namespace = "common"> = KeysByNamespace[N];

/**
 * useTranslate ของ @tolgee/react ที่ล็อก key ตาม th.json ของ namespace — key ผิด tsc ฟ้อง
 * ชื่อต้องเป็น useTranslate และคืน { t } เพราะ tolgee CLI หา key จากชื่อนี้ (wrapper ชื่ออื่น extract ไม่เจอ)
 * (declare module "@tolgee/web" ใช้ไม่ได้เพราะ TranslationKey เป็น type alias [TCG-544])
 */
export function useTranslate<N extends Namespace = "common">(ns?: N) {
  const { t, isLoading } = useTolgeeTranslate(ns ?? "common");
  // shortcut: ช่วง migrate (I18N-10–19) ยอมรับ string ด้วย เพราะเขียน key ใหม่ก่อน pull เข้า JSON — ได้ autocomplete แต่ยังไม่ฟ้อง key ผิด
  // พอย้ายครบแล้วให้ตัด `| (string & {})` ออก เพื่อให้ key ที่ไม่มีใน th.json เป็น error
  return { t: t as TFnType<DefaultParamType, string, TranslationKey<N> | (string & {})>, isLoading };
}
