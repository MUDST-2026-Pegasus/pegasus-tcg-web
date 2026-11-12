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
  // สลับภาษาแล้วแอป remount (I18nProvider) — เก็บตำแหน่ง scroll ไว้ ไม่ให้เด้งกลับบนสุด
  const setLanguage = async (next: Language) => {
    const y = window.scrollY;
    await tolgee.changeLanguage(next);
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
  };
  return { language: current, setLanguage };
}
