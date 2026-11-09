import { Fragment, useState, type ReactNode } from "react";
import { TolgeeProvider, type TolgeeInstance } from "@tolgee/react";

import { registerErrorTranslator } from "@/lib/i18n/errors";
import { createTolgee } from "@/lib/i18n/tolgee";
import { useLanguage } from "@/lib/i18n/use-language";

export function I18nProvider({ children, tolgee: given }: { children: ReactNode; tolgee?: TolgeeInstance }) {
  const [tolgee] = useState(() => given ?? createTolgee());
  // ลงทะเบียนตัวที่ส่งให้ TolgeeProvider จริง — ทำใน createTolgee ไม่ได้ เพราะ StrictMode เรียก initializer
  // ของ useState สองครั้ง แล้วตัวที่ลงทะเบียนจะเป็นตัวที่ถูกทิ้ง (ไม่เคย run จึงแปล error ไม่ได้)
  registerErrorTranslator(tolgee);
  // useSuspense ต้องเปิดเอง — ค่าเริ่มต้นของ @tolgee/react 7 คือ false ซึ่งโชว์ key ดิบระหว่างโหลด ns [TCG-544]
  // fallback null เพราะ splash ใน index.html บังช่วงโหลดแรกอยู่แล้ว
  return (
    <TolgeeProvider tolgee={tolgee} fallback={null} options={{ useSuspense: true }}>
      <RemountOnLanguageChange>{children}</RemountOnLanguageChange>
    </TolgeeProvider>
  );
}

/**
 * สลับภาษาแล้ว remount ทั้งแอปครั้งเดียว — format เงิน / วันที่ (src/lib/i18n/format.ts) ถูกเรียกจาก helper ทั่วเว็บ
 * ที่ไม่ได้ subscribe ภาษา และ React Compiler memo ไว้ จึงต้อง remount ถึงจะได้ภาษาใหม่ [TCG-546]
 * shortcut: ค่าในฟอร์มที่ยังไม่บันทึกจะหายตอนสลับภาษา (cache ของ React Query กับ route ยังอยู่)
 * — ถ้าต้องเก็บไว้ ให้ย้ายจุด format ไปใช้ useFormat() แล้วเอา key นี้ออก
 */
function RemountOnLanguageChange({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  return <Fragment key={language}>{children}</Fragment>;
}
