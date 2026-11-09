import { useTranslate } from "@tolgee/react";

/**
 * ข้อความที่ประกาศระดับ module (route handle, label ของ skeleton) — เรียก t() ตอนนั้นไม่ได้ จึงเก็บ key + default ไว้
 * แล้วแปลตอน render ด้วย useMessage() [TCG-550]
 * CLI หา key จาก msg() ไม่เจอ ไฟล์ที่ใช้ต้องประกาศ `// @tolgee-key {...}` ไว้ด้วย (ไม่งั้น sync จะไม่ส่ง key / ลบทิ้ง)
 */
export interface Message {
  key: string;
  defaultValue: string;
  /** ไม่ระบุ = common */
  ns?: string;
}

export function msg(key: string, defaultValue: string, ns?: string): Message {
  return { key, defaultValue, ns };
}

/** แปล Message (namespace common) — string ธรรมดาคืนตามเดิม */
export function useMessage() {
  const { t } = useTranslate("common");
  return (message: Message | string | undefined): string | undefined =>
    message === undefined || typeof message === "string"
      ? message
      : // @tolgee-ignore — key มาจาก msg() ที่ประกาศ @tolgee-key ไว้ในไฟล์ต้นทางแล้ว
        t(message.key, message.defaultValue, { ns: message.ns ?? "common" });
}
