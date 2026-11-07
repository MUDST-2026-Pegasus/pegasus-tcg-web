import type { CardCondition } from "@/features/catalog/catalog.types";
export const conditionDescription: Partial<Record<CardCondition, string>> = {
  NM: "สภาพใกล้เคียงใหม่",
  LP: "มีรอยเล็กน้อย",
  MP: "มีรอยจากการใช้งาน",
  HP: "มีรอยจากการใช้งานมาก",
  DMG: "มีความเสียหาย",
  SEALED: "ยังไม่แกะซีล",
};
