import { enUS, th } from "date-fns/locale";
import type { Locale } from "date-fns";
import { enUS as dayPickerEn, th as dayPickerTh } from "react-day-picker/locale";

import { DEFAULT_LANGUAGE, type Language } from "@/lib/i18n/tolgee";

/**
 * format เงิน / ตัวเลข / วันที่ตามภาษา — จุดเดียวที่รู้ว่า th → th-TH, en → en-GB [TCG-546]
 *
 * ภาษาปัจจุบันอ่านจาก <html lang> ที่ I18nProvider ตั้งไว้ จึงเรียกจากที่ไหนก็ได้ (ไม่ต้องเป็น hook)
 * สลับภาษาแล้ว I18nProvider remount แอป ทุกจุดที่ format ตอน render จึงได้ภาษาใหม่
 * formatter ระดับ module ต้องสร้างผ่าน numberFormat() / dateTimeFormat() ที่ resolve locale ทุกครั้งที่เรียก
 */

export const TIME_ZONE = "Asia/Bangkok";

const INTL_LOCALE: Record<Language, string> = { th: "th-TH", en: "en-GB" };

export function currentLanguage(): Language {
  return typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : DEFAULT_LANGUAGE;
}

/**
 * locale สำหรับ Intl / toLocaleString — th-TH ใช้ปฏิทินพุทธ (พ.ศ.) ให้เอง ไม่ต้องบวก 543
 * calendar "gregory" = ไทยแต่ปี ค.ศ. (จุดที่ตั้งใจแสดง ค.ศ. อยู่แล้ว)
 */
export function intlLocale(options: { calendar?: "gregory"; lang?: Language } = {}): string {
  const lang = options.lang ?? currentLanguage();
  return options.calendar === "gregory" && lang === "th" ? "th-TH-u-ca-gregory" : INTL_LOCALE[lang];
}

/** locale ของ date-fns / react-day-picker */
export function dateFnsLocale(lang: Language = currentLanguage()): Locale {
  return lang === "en" ? enUS : th;
}

/** locale ของ react-day-picker (ชื่อเดือน / วัน + aria-label ของปฏิทิน) */
export function dayPickerLocale(lang: Language = currentLanguage()) {
  return lang === "en" ? dayPickerEn : dayPickerTh;
}

const numberCache = new Map<string, Intl.NumberFormat>();
const dateCache = new Map<string, Intl.DateTimeFormat>();

function cached<T>(cache: Map<string, T>, locale: string, options: object | undefined, create: () => T): T {
  const key = `${locale}|${JSON.stringify(options ?? {})}`;
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = create();
    cache.set(key, formatter);
  }
  return formatter;
}

export function getNumberFormat(options?: Intl.NumberFormatOptions, locale = intlLocale()): Intl.NumberFormat {
  return cached(numberCache, locale, options, () => new Intl.NumberFormat(locale, options));
}

export function getDateTimeFormat(options?: Intl.DateTimeFormatOptions, locale = intlLocale()): Intl.DateTimeFormat {
  return cached(dateCache, locale, options, () => new Intl.DateTimeFormat(locale, options));
}

export interface LazyNumberFormat {
  format(value: number | bigint): string;
  formatToParts(value?: number | bigint): Intl.NumberFormatPart[];
  formatRange(start: number | bigint, end: number | bigint): string;
}
export interface LazyDateTimeFormat {
  format(date?: Date | number): string;
  formatToParts(date?: Date | number): Intl.DateTimeFormatPart[];
  formatRange(start: Date | number, end: Date | number): string;
}

/** แทน `const X = new Intl.NumberFormat("th-TH", opts)` ระดับ module — locale ตามภาษาปัจจุบันทุกครั้งที่เรียก */
export function numberFormat(options?: Intl.NumberFormatOptions, localeOptions?: Parameters<typeof intlLocale>[0]): LazyNumberFormat {
  const get = () => getNumberFormat(options, intlLocale(localeOptions));
  return {
    format: (value: number | bigint) => get().format(value),
    formatToParts: (value?: number | bigint) => get().formatToParts(value),
    formatRange: (start: number | bigint, end: number | bigint) => get().formatRange(start, end),
  };
}

/** แทน `const X = new Intl.DateTimeFormat("th-TH", opts)` ระดับ module */
export function dateTimeFormat(options?: Intl.DateTimeFormatOptions, localeOptions?: Parameters<typeof intlLocale>[0]): LazyDateTimeFormat {
  const get = () => getDateTimeFormat(options, intlLocale(localeOptions));
  return {
    format: (date?: Date | number) => get().format(date),
    formatToParts: (date?: Date | number) => get().formatToParts(date),
    formatRange: (start: Date | number, end: Date | number) => get().formatRange(start, end),
  };
}

type DateInput = Date | number | string;
const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

/** "THB 1,234.50" ทั้งสองภาษา ทุกหน้าใช้รูปแบบเดียวกัน [TCG-560] · ติดลบ = "-THB 120.00" */
export function formatMoney(value: number, { lang }: { lang?: Language } = {}): string {
  const amount = getNumberFormat({ minimumFractionDigits: 2, maximumFractionDigits: 2 }, intlLocale({ lang })).format(Math.abs(value));
  return `${value < 0 ? "-" : ""}THB ${amount}`;
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions, lang?: Language): string {
  return getNumberFormat(options, intlLocale({ lang })).format(value);
}

/** "19 ต.ค. 2569" / "19 Oct 2026" */
export function formatDate(value: DateInput, options?: Intl.DateTimeFormatOptions, lang?: Language): string {
  return getDateTimeFormat(
    { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE, ...options },
    intlLocale({ lang }),
  ).format(toDate(value));
}

/** "19 ต.ค. 2569 14:05" / "19 Oct 2026, 14:05" */
export function formatDateTime(value: DateInput, options?: Intl.DateTimeFormatOptions, lang?: Language): string {
  return formatDate(value, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", ...options }, lang);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

/** "3 วันที่ผ่านมา" / "3 days ago" — เลือกหน่วยใหญ่สุดที่ได้อย่างน้อย 1 */
export function formatRelative(value: DateInput, now: DateInput = Date.now(), lang?: Language): string {
  const seconds = Math.round((toDate(value).getTime() - toDate(now).getTime()) / 1000);
  const [unit, size] = RELATIVE_UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? ["second", 1];
  return new Intl.RelativeTimeFormat(intlLocale({ lang }), { numeric: "auto" }).format(Math.round(seconds / size), unit);
}

/** ปีตามภาษาเป็นตัวเลขล้วน — th = พ.ศ. ("2569") ไม่มีคำว่า "พ.ศ." นำหน้า, en = ค.ศ. ("2026") */
export function formatYear(value: DateInput, { digits = "numeric" }: { digits?: "numeric" | "2-digit" } = {}, lang?: Language): string {
  return (
    getDateTimeFormat({ year: digits, timeZone: TIME_ZONE }, intlLocale({ lang }))
      .formatToParts(toDate(value))
      .find((part) => part.type === "year")?.value ?? ""
  );
}

/** ชื่อเดือนของ "YYYY-MM" ตามภาษา — "ต.ค." / "Oct" (month: "long" → "ตุลาคม" / "October") */
export function formatMonth(yearMonth: string, month: "short" | "long" = "short", lang?: Language): string {
  return getDateTimeFormat({ month, timeZone: "UTC" }, intlLocale({ lang })).format(monthStart(yearMonth));
}

/** "YYYY-MM" → วันที่ 1 ของเดือน (UTC เที่ยงวัน กันเลื่อนวันข้ามเขตเวลา) */
export function monthStart(yearMonth: string): Date {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1, 12));
}

const pad2 = (value: number) => String(value).padStart(2, "0");

/**
 * นับถอยหลัง "3 วัน 04:05:06" / "3 days 04:05:06" — ใช้ร่วมกันทั้งประมูลและ sale
 * compact: ซ่อนชั่วโมงเมื่อเป็น 0 ("05:06") แบบนาฬิกาประมูล
 */
export function formatCountdown(ms: number, { compact = false }: { compact?: boolean } = {}, lang?: Language): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const clock = `${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`;
  const withHours = `${pad2(hours)}:${clock}`;
  if (days > 0) return `${formatNumber(days, { style: "unit", unit: "day", unitDisplay: "long" }, lang)} ${withHours}`;
  return compact && hours === 0 ? clock : withHours;
}
