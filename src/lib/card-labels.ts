import { getLanguage, translate } from "@/lib/language";
export const CARD_FINISH_LABEL: Record<string, string> = {
  get NORMAL() { return translate("ปกติ", "Normal"); },
  get HOLO() { return translate("โฮโล", "Holo"); },
  get REVERSE_HOLO() { return translate("รีเวิร์สโฮโล", "Reverse Holo"); },
  get FOIL() { return translate("ฟอยล์", "Foil"); },
  get ETCHED() { return translate("ผิวกัดลาย", "Etched"); },
  get TEXTURED() { return translate("ผิวสัมผัส", "Textured"); },
  get NOT_APPLICABLE() { return translate("ไม่มี (ของซีล/อุปกรณ์)", "Not applicable (sealed/accessories)"); },
};

export const CARD_EDITION_LABEL: Record<string, string> = {
  get FIRST_EDITION() { return translate("พิมพ์ครั้งแรก", "1st Edition"); },
  get UNLIMITED() { return translate("ไม่จำกัดรุ่น", "Unlimited"); },
  get PROMO() { return translate("โปรโม", "Promo"); },
  get NOT_APPLICABLE() { return translate("ไม่ระบุ", "Not specified"); },
};

export const RARITY_LABELS: Record<string, string> = {
  get C() { return translate("ธรรมดา", "Common"); }, get U() { return translate("กึ่งหายาก", "Uncommon"); }, get R() { return translate("หายาก", "Rare"); }, get AR() { return translate("ภาพพิเศษหายาก", "Art Rare"); }, get HR() { return translate("ไฮเปอร์แรร์", "Hyper Rare"); },
  get RR() { return translate("ดับเบิลแรร์", "Double Rare"); },
  get UR() { return translate("อัลตร้าแรร์", "Ultra Rare"); },
  get SAR() { return translate("ภาพพิเศษหายากขั้นสูง", "Special Art Rare"); },
  get SR() { return translate("ซูเปอร์แรร์", "Super Rare"); },
  get SIR() { return translate("ภาพประกอบพิเศษหายาก", "Special Illustration Rare"); },
};
export const languageLabel = (code?: string) =>
  code
    ? `${({ EN: translate("อังกฤษ", "English"), TH: translate("ไทย", "Thai"), JP: "日本語", JA: "日本語", ZH: "中文", KO: "한국어" } as Record<string, string>)[code] ?? code} (${code})`
    : null;
export const rarityLabel = (code?: string | null) =>
  code ? [code, RARITY_LABELS[code]].filter(Boolean).join(" · ") : null;
export const cardDate = (value: string) =>
  new Intl.DateTimeFormat(getLanguage() === "th" ? "th-TH-u-ca-gregory" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export const finishLabel = (key?: string) => !key || key === "NOT_APPLICABLE" ? null : CARD_FINISH_LABEL[key] ?? key;
export const editionLabel = (key?: string) => !key || key === "NOT_APPLICABLE" ? null : CARD_EDITION_LABEL[key] ?? key;
