import { useState, type ReactNode } from "react";
import { TolgeeProvider, type TolgeeInstance } from "@tolgee/react";

import { createTolgee } from "@/lib/i18n/tolgee";

export function I18nProvider({ children, tolgee: given }: { children: ReactNode; tolgee?: TolgeeInstance }) {
  const [tolgee] = useState(() => given ?? createTolgee());
  // useSuspense ต้องเปิดเอง — ค่าเริ่มต้นของ @tolgee/react 7 คือ false ซึ่งโชว์ key ดิบระหว่างโหลด ns [TCG-544]
  // fallback null เพราะ splash ใน index.html บังช่วงโหลดแรกอยู่แล้ว
  return (
    <TolgeeProvider tolgee={tolgee} fallback={null} options={{ useSuspense: true }}>
      {children}
    </TolgeeProvider>
  );
}
