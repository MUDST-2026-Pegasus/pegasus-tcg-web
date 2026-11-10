import type { CardCondition } from "@/features/catalog/catalog.types";
import { translate } from "@/lib/i18n";

// คำอธิบายสภาพการ์ด — getter แปลตอนอ่าน, ตัวย่อ NM / LP / … ไม่แปล [TCG-550]
export const conditionDescription: Partial<Record<CardCondition, string>> = {
  get NM() {
    return translate("common", "condition.nm", "สภาพใกล้เคียงใหม่");
  },
  get LP() {
    return translate("common", "condition.lp", "มีรอยเล็กน้อย");
  },
  get MP() {
    return translate("common", "condition.mp", "มีรอยจากการใช้งาน");
  },
  get HP() {
    return translate("common", "condition.hp", "มีรอยจากการใช้งานมาก");
  },
  get DMG() {
    return translate("common", "condition.dmg", "มีความเสียหาย");
  },
  get SEALED() {
    return translate("common", "condition.sealed", "ยังไม่แกะซีล");
  },
};

// key ของ translate() ด้านบน — ประกาศให้ tolgee CLI เห็น
// @tolgee-key {"key": "condition.nm", "ns": "common", "defaultValue": "สภาพใกล้เคียงใหม่"}
// @tolgee-key {"key": "condition.lp", "ns": "common", "defaultValue": "มีรอยเล็กน้อย"}
// @tolgee-key {"key": "condition.mp", "ns": "common", "defaultValue": "มีรอยจากการใช้งาน"}
// @tolgee-key {"key": "condition.hp", "ns": "common", "defaultValue": "มีรอยจากการใช้งานมาก"}
// @tolgee-key {"key": "condition.dmg", "ns": "common", "defaultValue": "มีความเสียหาย"}
// @tolgee-key {"key": "condition.sealed", "ns": "common", "defaultValue": "ยังไม่แกะซีล"}
