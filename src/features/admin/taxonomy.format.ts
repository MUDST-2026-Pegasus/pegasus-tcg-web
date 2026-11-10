import { hasErrorCode } from "@/lib/api";

import type {
  AttributeDataType,
  CatalogCategory,
  Game,
  GameAttribute,
} from "./catalog.types";
import { dateTimeFormat, translate, translateError } from "@/lib/i18n";

/**
 * ตัวช่วยแปลงข้อมูลเกม ฟิลด์ ชุด และหมวดหมู่ → ข้อความที่โชว์บนจอ
 * ไม่มี React ไม่มี state
 */

/** เรียงตามที่ผู้ดูแลน่าจะใช้บ่อย — ไม่ใช่ลำดับใน `AttributeDataType.java` */
export const ATTRIBUTE_TYPES: AttributeDataType[] = [
  "STRING",
  "NUMBER",
  "ENUM",
  "BOOLEAN",
  "DATE",
];

/** ป้ายสั้นบน badge — คงคำเดิมของดีไซน์ (text / number / enum / boolean) */
export const ATTRIBUTE_TYPE_BADGE: Record<AttributeDataType, string> = {
  STRING: "text",
  NUMBER: "number",
  ENUM: "enum",
  BOOLEAN: "boolean",
  DATE: "date",
};

export const ATTRIBUTE_TYPE_LABEL: Record<AttributeDataType, string> = {
  get STRING() {
    return translate("admin", "cardAttributes.types.string", "ข้อความสั้น");
  },
  get NUMBER() {
    return translate("admin", "cardAttributes.types.number", "ตัวเลข");
  },
  get ENUM() {
    return translate("admin", "cardAttributes.types.enum", "ตัวเลือก");
  },
  get BOOLEAN() {
    return translate("admin", "cardAttributes.types.boolean", "ใช่/ไม่ใช่");
  },
  get DATE() {
    return translate("admin", "cardAttributes.types.date", "วันที่");
  },
};

/** คอลัมน์ "ค่าที่รับ" — ENUM โชว์ตัวเลือกจริง ชนิดอื่นบอกรูปแบบค่า */
export function acceptedValues(attribute: GameAttribute): string {
  switch (attribute.dataType) {
    case "ENUM":
      return attribute.options.join(", ");
    case "BOOLEAN":
      return translate("admin", "cardAttributes.values.boolean", "ใช่ / ไม่ใช่");
    case "DATE":
      return translate("admin", "cardAttributes.values.date", "วันที่ (ปปปป-ดด-วว)");
    case "NUMBER":
      return translate("admin", "cardAttributes.values.number", "ตัวเลข");
    case "STRING":
      return translate("admin", "cardAttributes.values.string", "ข้อความ");
  }
}

/** "Magic: The Gathering" → "MTG", "Yu-Gi-Oh!" → "YGO", "Pokémon" → "PO" */
export function gameInitials(game: Pick<Game, "name" | "code">): string {
  const words = game.name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const initials =
    words.length > 1
      ? words.map((word) => word[0]).join("")
      : (words[0] ?? game.code).slice(0, 2);
  return initials.slice(0, 3).toUpperCase();
}

const RELEASE_DATE = dateTimeFormat({
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "2025-01-24" → "24 ม.ค. 2568" — อ่านเป็นวันตามปฏิทิน ไม่ขยับตาม timezone */
export function formatReleaseDate(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  return RELEASE_DATE.format(new Date(year, month - 1, day));
}

/**
 * หมวดของเกมหนึ่งเรียงเป็นต้นไม้สองชั้น: หมวดแม่ตาม `displayOrder` แล้วตามด้วยหมวดลูกของมัน
 * หมวดลูกที่หมวดแม่ไม่อยู่ในรายการ (เช่นแม่เป็นของเกมอื่น) ขึ้นเป็นระดับบนแทน จะได้ไม่หายจากจอ
 */
export function categoryTree(
  categories: CatalogCategory[],
): { category: CatalogCategory; depth: 0 | 1 }[] {
  const byOrder = (a: CatalogCategory, b: CatalogCategory) =>
    a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);
  const ids = new Set(categories.map((category) => category.id));
  const roots = categories
    .filter((category) => category.parentId === null || !ids.has(category.parentId))
    .sort(byOrder);

  return roots.flatMap((root) => [
    { category: root, depth: 0 as const },
    ...categories
      .filter((child) => child.parentId === root.id)
      .sort(byOrder)
      .map((child) => ({ category: child, depth: 1 as const })),
  ]);
}

/** error จาก endpoint เกม/ฟิลด์/ชุด/หมวด → ข้อความภาษาไทย ตัวที่ไม่รู้จักใช้ข้อความจาก backend */
export function taxonomyErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "GAME_NOT_FOUND")) {
    return translate("admin", "cardAttributes.errors.gameNotFound", "ไม่พบเกมนี้แล้ว ลองโหลดหน้าใหม่");
  }
  if (hasErrorCode(error, "ATTRIBUTE_NOT_FOUND")) {
    return translate("admin", "cardAttributes.errors.attributeNotFound", "ฟิลด์นี้ถูกลบไปแล้ว");
  }
  if (hasErrorCode(error, "CARD_SET_NOT_FOUND")) {
    return translate("admin", "cardAttributes.errors.cardSetNotFound", "ชุดการ์ดนี้ถูกลบไปแล้ว");
  }
  if (hasErrorCode(error, "CATEGORY_NOT_FOUND")) {
    return translate("admin", "cardAttributes.errors.categoryNotFound", "ไม่พบหมวดหมู่นี้แล้ว");
  }
  if (hasErrorCode(error, "GAME_CODE_ALREADY_USED")) {
    return translate("admin", "cardAttributes.errors.gameCodeAlreadyUsed", "รหัสนี้มีเกมอื่นใช้อยู่แล้ว");
  }
  if (hasErrorCode(error, "ATTRIBUTE_KEY_ALREADY_USED")) {
    return translate("admin", "cardAttributes.errors.attributeKeyAlreadyUsed", "เกมนี้มีฟิลด์ที่ใช้คีย์นี้อยู่แล้ว");
  }
  if (hasErrorCode(error, "CARD_SET_CODE_ALREADY_USED")) {
    return translate("admin", "cardAttributes.errors.cardSetCodeAlreadyUsed", "เกมนี้มีชุดที่ใช้รหัสนี้อยู่แล้ว");
  }
  if (hasErrorCode(error, "CATEGORY_CODE_ALREADY_USED")) {
    return translate("admin", "cardAttributes.errors.categoryCodeAlreadyUsed", "มีหมวดที่ใช้รหัสนี้อยู่แล้ว");
  }
  if (hasErrorCode(error, "CARD_SET_IN_USE")) {
    return translate("admin", "cardAttributes.errors.cardSetInUse", "ยังมีการ์ดในแคตตาล็อกอยู่ในชุดนี้ ย้ายการ์ดไปชุดอื่นก่อนแล้วค่อยลบ");
  }
  if (hasErrorCode(error, "INVALID_ATTRIBUTE_DEFINITION")) {
    return translate("admin", "cardAttributes.errors.invalidAttributeDefinition", "ฟิลด์ชนิดตัวเลือกต้องมีตัวเลือกอย่างน้อยหนึ่งตัว และชนิดอื่นต้องไม่มีตัวเลือก");
  }
  if (hasErrorCode(error, "FILE_NOT_FOUND")) {
    return translate("admin", "cardAttributes.errors.fileNotFound", "รูปยังอัปโหลดไม่เสร็จหรือหายไปแล้ว ลองอัปใหม่");
  }
  if (hasErrorCode(error, "ACCESS_DENIED")) {
    return translate("admin", "cardAttributes.errors.accessDenied", "บัญชีนี้ไม่มีสิทธิ์แก้ข้อมูลเกม");
  }
  return translateError(error, fallback);
}

// @tolgee-key {"key": "cardAttributes.errors.gameNotFound", "ns": "admin", "defaultValue": "ไม่พบเกมนี้แล้ว ลองโหลดหน้าใหม่"}
// @tolgee-key {"key": "cardAttributes.errors.attributeNotFound", "ns": "admin", "defaultValue": "ฟิลด์นี้ถูกลบไปแล้ว"}
// @tolgee-key {"key": "cardAttributes.errors.cardSetNotFound", "ns": "admin", "defaultValue": "ชุดการ์ดนี้ถูกลบไปแล้ว"}
// @tolgee-key {"key": "cardAttributes.errors.categoryNotFound", "ns": "admin", "defaultValue": "ไม่พบหมวดหมู่นี้แล้ว"}
// @tolgee-key {"key": "cardAttributes.errors.gameCodeAlreadyUsed", "ns": "admin", "defaultValue": "รหัสนี้มีเกมอื่นใช้อยู่แล้ว"}
// @tolgee-key {"key": "cardAttributes.errors.attributeKeyAlreadyUsed", "ns": "admin", "defaultValue": "เกมนี้มีฟิลด์ที่ใช้คีย์นี้อยู่แล้ว"}
// @tolgee-key {"key": "cardAttributes.errors.cardSetCodeAlreadyUsed", "ns": "admin", "defaultValue": "เกมนี้มีชุดที่ใช้รหัสนี้อยู่แล้ว"}
// @tolgee-key {"key": "cardAttributes.errors.categoryCodeAlreadyUsed", "ns": "admin", "defaultValue": "มีหมวดที่ใช้รหัสนี้อยู่แล้ว"}
// @tolgee-key {"key": "cardAttributes.errors.cardSetInUse", "ns": "admin", "defaultValue": "ยังมีการ์ดในแคตตาล็อกอยู่ในชุดนี้ ย้ายการ์ดไปชุดอื่นก่อนแล้วค่อยลบ"}
// @tolgee-key {"key": "cardAttributes.errors.invalidAttributeDefinition", "ns": "admin", "defaultValue": "ฟิลด์ชนิดตัวเลือกต้องมีตัวเลือกอย่างน้อยหนึ่งตัว และชนิดอื่นต้องไม่มีตัวเลือก"}
// @tolgee-key {"key": "cardAttributes.errors.fileNotFound", "ns": "admin", "defaultValue": "รูปยังอัปโหลดไม่เสร็จหรือหายไปแล้ว ลองอัปใหม่"}
// @tolgee-key {"key": "cardAttributes.errors.accessDenied", "ns": "admin", "defaultValue": "บัญชีนี้ไม่มีสิทธิ์แก้ข้อมูลเกม"}
// @tolgee-key {"key": "cardAttributes.values.boolean", "ns": "admin", "defaultValue": "ใช่ / ไม่ใช่"}
// @tolgee-key {"key": "cardAttributes.values.date", "ns": "admin", "defaultValue": "วันที่ (ปปปป-ดด-วว)"}
// @tolgee-key {"key": "cardAttributes.values.number", "ns": "admin", "defaultValue": "ตัวเลข"}
// @tolgee-key {"key": "cardAttributes.values.string", "ns": "admin", "defaultValue": "ข้อความ"}
// @tolgee-key {"key": "cardAttributes.types.string", "ns": "admin", "defaultValue": "ข้อความสั้น"}
// @tolgee-key {"key": "cardAttributes.types.number", "ns": "admin", "defaultValue": "ตัวเลข"}
// @tolgee-key {"key": "cardAttributes.types.enum", "ns": "admin", "defaultValue": "ตัวเลือก"}
// @tolgee-key {"key": "cardAttributes.types.boolean", "ns": "admin", "defaultValue": "ใช่/ไม่ใช่"}
// @tolgee-key {"key": "cardAttributes.types.date", "ns": "admin", "defaultValue": "วันที่"}
