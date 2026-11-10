import { GlobalContextPlugin, type TolgeeInstance } from "@tolgee/react";

import { createTolgee, LANGUAGES, NAMESPACES, type Language } from "@/lib/i18n";
import { registerErrorTranslator } from "@/lib/i18n/errors";

/**
 * instance สำหรับเทสต์ต่อภาษา — ไม่ต่อ Tolgee, ไม่มี DevTools, โหลดทุก namespace ไว้ก่อน (ไม่ suspend)
 * setupTests รอให้พร้อมก่อนเริ่มเทสต์ จึงเรียก testTolgee() แบบ sync ได้
 */
const instances = new Map<Language, TolgeeInstance>();

export async function prepareTestTolgee() {
  for (const language of LANGUAGES) {
    const tolgee = createTolgee({ language, live: false });
    await tolgee.run();
    await tolgee.loadRecords(NAMESPACES.map((namespace) => ({ language, namespace })));
    instances.set(language, tolgee);
  }
  // เทสต์ที่ render เองโดยไม่ครอบ provider ใช้ภาษาไทย
  testTolgee("th").addPlugin(GlobalContextPlugin({ useSuspense: false }));
  registerErrorTranslator(testTolgee("th"));
}

export function testTolgee(language: Language = "th"): TolgeeInstance {
  const tolgee = instances.get(language);
  if (!tolgee) throw new Error("prepareTestTolgee() ยังไม่ถูกเรียกใน setupTests");
  return tolgee;
}
