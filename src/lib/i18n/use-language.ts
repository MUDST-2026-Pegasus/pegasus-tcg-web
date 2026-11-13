import { useSyncExternalStore } from "react";
import { useTolgee } from "@tolgee/react";

import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from "@/lib/i18n/tolgee";

/** ภาษาปัจจุบัน + ตัวเปลี่ยนภาษา (จำไว้ใน localStorage ผ่าน LanguageStorage) */
export function useLanguage() {
  const tolgee = useTolgee();
  const language = useSyncExternalStore(
    (onChange) => tolgee.on("language", onChange).unsubscribe,
    () => tolgee.getLanguage(),
  );
  const current = LANGUAGES.includes(language as Language) ? (language as Language) : DEFAULT_LANGUAGE;
  // สลับภาษาแล้วแอป remount (I18nProvider) — โหลดคำแปลให้ครบก่อนแล้วค่อยสลับในครั้งเดียว
  // ไม่ให้มีจังหวะหน้าว่าง และเก็บตำแหน่ง scroll ไว้ไม่ให้เด้งกลับบนสุด
  const setLanguage = async (next: Language) => {
    const y = window.scrollY;
    await tolgee.loadRecords(tolgee.getRequiredDescriptors(next));
    await tolgee.changeLanguage(next);
    window.scrollTo(0, y);
  };
  return { language: current, setLanguage };
}
