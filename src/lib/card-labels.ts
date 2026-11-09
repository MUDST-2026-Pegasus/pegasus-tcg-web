import { intlLocale } from "@/lib/i18n";
export const CARD_FINISH_LABEL: Record<string, string> = {
  NORMAL: "Normal",
  HOLO: "Holo",
  REVERSE_HOLO: "Reverse Holo",
  FOIL: "Foil",
  ETCHED: "Etched",
  TEXTURED: "Textured",
  NOT_APPLICABLE: "ไม่มี (ของซีล/อุปกรณ์)",
};

export const CARD_EDITION_LABEL: Record<string, string> = {
  FIRST_EDITION: "1st Edition",
  UNLIMITED: "Unlimited",
  PROMO: "Promo",
  NOT_APPLICABLE: "ไม่ระบุ",
};

export const RARITY_LABELS: Record<string, string> = {
  C: "Common", U: "Uncommon", R: "Rare", AR: "Art Rare", HR: "Hyper Rare",
  RR: "Double Rare",
  UR: "Ultra Rare",
  SAR: "Special Art Rare",
  SR: "Super Rare",
  SIR: "Special Illustration Rare",
};
export const languageLabel = (code?: string) =>
  code
    ? `${({ EN: "English", TH: "ไทย", JP: "日本語", JA: "日本語", ZH: "中文", KO: "한국어" } as Record<string, string>)[code] ?? code} (${code})`
    : null;
export const rarityLabel = (code?: string | null) =>
  code ? [code, RARITY_LABELS[code]].filter(Boolean).join(" · ") : null;
export const cardDate = (value: string) =>
  new Intl.DateTimeFormat(intlLocale({ calendar: "gregory" }), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export const finishLabel = (key?: string) => !key || key === "NOT_APPLICABLE" ? null : CARD_FINISH_LABEL[key] ?? key;
export const editionLabel = (key?: string) => !key || key === "NOT_APPLICABLE" ? null : CARD_EDITION_LABEL[key] ?? key;
