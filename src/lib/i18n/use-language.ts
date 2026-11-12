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
  // View Transition = ภาพเก่าค่อย ๆ จางเป็นภาพใหม่ ไม่เห็นจังหวะ remount ว่างเปล่า (เบราว์เซอร์ที่ไม่รองรับก็สลับตรง ๆ)
  const setLanguage = async (next: Language) => {
    const y = window.scrollY;
    // โหลดคำแปลของภาษาใหม่ให้เสร็จก่อน — ไม่งั้น view transition ค้างภาพเก่าไว้ระหว่างรอโหลดเหมือนหน้าค้าง
    await tolgee.loadRecords(tolgee.getRequiredDescriptors(next));
    const swap = async () => {
      await tolgee.changeLanguage(next);
      await new Promise(requestAnimationFrame);
      window.scrollTo(0, y);
    };
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await document.startViewTransition(swap).finished;
    } else {
      await swap();
    }
  };
  return { language: current, setLanguage };
}
