import { translate } from "@/lib/language";
import type { CardCondition } from "@/features/catalog/catalog.types";
export const conditionDescription: Partial<Record<CardCondition, string>> = {
  get NM() { return translate("สภาพใกล้เคียงใหม่", "Near mint condition"); },
  get LP() { return translate("มีรอยเล็กน้อย", "Minor wear"); },
  get MP() { return translate("มีรอยจากการใช้งาน", "Moderate wear"); },
  get HP() { return translate("มีรอยจากการใช้งานมาก", "Heavy wear"); },
  get DMG() { return translate("มีความเสียหาย", "Damaged"); },
  get SEALED() { return translate("ยังไม่แกะซีล", "Factory sealed"); },
};
