import { useLanguage } from "@/lib/i18n/use-language";
import {
  dateFnsLocale,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatRelative,
  intlLocale,
} from "@/lib/i18n/format";

/** format ที่ผูกกับภาษาปัจจุบัน — component ที่เรียก hook นี้ render ใหม่เองเมื่อสลับภาษา */
export function useFormat() {
  const { language: lang } = useLanguage();
  return {
    lang,
    locale: intlLocale({ lang }),
    dateFnsLocale: dateFnsLocale(lang),
    money: (value: number) => formatMoney(value, { lang }),
    number: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(value, options, lang),
    date: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => formatDate(value, options, lang),
    dateTime: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => formatDateTime(value, options, lang),
    relative: (value: Date | number | string, now?: Date | number | string) => formatRelative(value, now, lang),
  };
}
