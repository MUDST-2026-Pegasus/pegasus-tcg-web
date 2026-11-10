import { DevTools, LanguageStorage, TolgeeCore, type TolgeeInstance } from "@tolgee/react";
import { FormatIcu } from "@tolgee/format-icu";

export const LANGUAGES = ["th", "en"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "th";
export const NAMESPACES = ["common", "errors", "buyer", "seller", "admin", "promotions", "sale", "auction"] as const;
export type Namespace = (typeof NAMESPACES)[number];

// JSON แยก chunk ต่อ namespace × ภาษา — โหลดเมื่อหน้าแรกที่ใช้ ns นั้นเรียก useTranslate(ns)
const staticData = {
  "th:common": () => import("@/i18n/common/th.json"),
  "en:common": () => import("@/i18n/common/en.json"),
  "th:errors": () => import("@/i18n/errors/th.json"),
  "en:errors": () => import("@/i18n/errors/en.json"),
  "th:buyer": () => import("@/i18n/buyer/th.json"),
  "en:buyer": () => import("@/i18n/buyer/en.json"),
  "th:seller": () => import("@/i18n/seller/th.json"),
  "en:seller": () => import("@/i18n/seller/en.json"),
  "th:admin": () => import("@/i18n/admin/th.json"),
  "en:admin": () => import("@/i18n/admin/en.json"),
  "th:promotions": () => import("@/i18n/promotions/th.json"),
  "en:promotions": () => import("@/i18n/promotions/en.json"),
  "th:sale": () => import("@/i18n/sale/th.json"),
  "en:sale": () => import("@/i18n/sale/en.json"),
  "th:auction": () => import("@/i18n/auction/th.json"),
  "en:auction": () => import("@/i18n/auction/en.json"),
};

// ต้องเช็ก import.meta.env.DEV ตรงนี้ (ค่าคงที่ตอน build) — ถ้าตัดสินตอน runtime Vite จะฝัง key ลง dist/ [TCG-544]
// vitest ก็โหลด .env* และ DEV=true เหมือนกัน — ตัดโหมด test ออกด้วย ไม่งั้นเทสต์จะยิงไป Tolgee
const LIVE = import.meta.env.DEV && import.meta.env.MODE !== "test";
const DEV_API_URL = LIVE ? import.meta.env.VITE_APP_TOLGEE_API_URL : undefined;
const DEV_API_KEY = LIVE ? import.meta.env.VITE_APP_TOLGEE_API_KEY : undefined;

interface CreateTolgeeOptions {
  /** ไม่ระบุ = ภาษาที่ผู้ใช้เลือกไว้ (LanguageStorage) หรือ th และ sync <html lang>; ระบุ = ล็อกภาษา ไม่แตะ DOM */
  language?: Language;
  /** false = ไม่ต่อ Tolgee แม้มี key (ใช้ในเทสต์) */
  live?: boolean;
}

export function createTolgee({ language, live = true }: CreateTolgeeOptions = {}): TolgeeInstance {
  const apiKey = live ? DEV_API_KEY : undefined;
  // TolgeeCore ไม่ใช่ Tolgee(): Tolgee() แถม BrowserExtensionPlugin ที่ ping extension ด้วย timer 4×300ms ตอนเริ่ม
  // (ค้างหลังเทสต์จบจน CI พัง "window is not defined" และฝัง loader CDN ใน production) — แก้คำแปลบนหน้าเว็บใช้ DevTools แทน
  let chain = TolgeeCore().use(FormatIcu());
  // DevTools ห่อทุกข้อความด้วยอักขระล่องหน (ไว้ Alt+คลิก) — ใส่เฉพาะตอนมี key ไม่งั้นเทสต์ที่หาด้วยข้อความพัง
  // production build ได้ DevTools ตัว no-op จาก export condition "production" อยู่แล้ว
  if (apiKey) chain = chain.use(DevTools());
  if (!language) chain = chain.use(LanguageStorage());
  const tolgee = chain.init({
    language,
    defaultLanguage: DEFAULT_LANGUAGE,
    fallbackLanguage: DEFAULT_LANGUAGE,
    availableLanguages: [...LANGUAGES],
    defaultNs: "common",
    ns: ["common", "errors"],
    staticData,
    // ICU format พัง (เช่น param ขาด) — ค่าเริ่มต้นของ Tolgee คือคำว่า "invalid" ให้ใช้ default / key แทน
    onFormatError: (_error, info) => info.defaultValue ?? info.key,
    apiUrl: apiKey ? DEV_API_URL : undefined,
    apiKey,
  });
  // instance ของแอป (ภาษาจาก LanguageStorage) เป็นเจ้าของ <html lang> — instance ที่ล็อกภาษา (เทสต์) ไม่แตะ DOM
  if (!language) {
    // event "language" ไม่ยิงตอน init จึงตั้งเองครั้งแรก
    const syncHtmlLang = () => {
      document.documentElement.lang = tolgee.getLanguage() ?? DEFAULT_LANGUAGE;
    };
    syncHtmlLang();
    tolgee.on("language", syncHtmlLang);
  }
  return tolgee;
}
