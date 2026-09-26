import { getErrorMessage, hasErrorCode } from "@/lib/api";

import type {
  AttributeDataType,
  CatalogCategory,
  Game,
  GameAttribute,
} from "./catalog.types";

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
  STRING: "ข้อความสั้น",
  NUMBER: "ตัวเลข",
  ENUM: "ตัวเลือก",
  BOOLEAN: "ใช่/ไม่ใช่",
  DATE: "วันที่",
};

/** คอลัมน์ "ค่าที่รับ" — ENUM โชว์ตัวเลือกจริง ชนิดอื่นบอกรูปแบบค่า */
export function acceptedValues(attribute: GameAttribute): string {
  switch (attribute.dataType) {
    case "ENUM":
      return attribute.options.join(", ");
    case "BOOLEAN":
      return "ใช่ / ไม่ใช่";
    case "DATE":
      return "วันที่ (ปปปป-ดด-วว)";
    case "NUMBER":
      return "ตัวเลข";
    case "STRING":
      return "ข้อความ";
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

/**
 * `logoUrl` ของ endpoint admin เป็นค่าดิบ — อาจเป็น URL ที่วางไว้ หรือ object key ที่ยังไม่เซ็น
 * เปิดเป็นรูปได้เฉพาะแบบแรก แบบหลังใช้ตัวย่อแทน
 */
export function displayableUrl(value: string | null): string | null {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

const RELEASE_DATE = new Intl.DateTimeFormat("th-TH", {
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
    return "ไม่พบเกมนี้แล้ว ลองโหลดหน้าใหม่";
  }
  if (hasErrorCode(error, "ATTRIBUTE_NOT_FOUND")) {
    return "ฟิลด์นี้ถูกลบไปแล้ว";
  }
  if (hasErrorCode(error, "CARD_SET_NOT_FOUND")) {
    return "ชุดการ์ดนี้ถูกลบไปแล้ว";
  }
  if (hasErrorCode(error, "CATEGORY_NOT_FOUND")) {
    return "ไม่พบหมวดหมู่นี้แล้ว";
  }
  if (hasErrorCode(error, "GAME_CODE_ALREADY_USED")) {
    return "รหัสนี้มีเกมอื่นใช้อยู่แล้ว";
  }
  if (hasErrorCode(error, "ATTRIBUTE_KEY_ALREADY_USED")) {
    return "เกมนี้มีฟิลด์ที่ใช้คีย์นี้อยู่แล้ว";
  }
  if (hasErrorCode(error, "CARD_SET_CODE_ALREADY_USED")) {
    return "เกมนี้มีชุดที่ใช้รหัสนี้อยู่แล้ว";
  }
  if (hasErrorCode(error, "CATEGORY_CODE_ALREADY_USED")) {
    return "มีหมวดที่ใช้รหัสนี้อยู่แล้ว";
  }
  if (hasErrorCode(error, "CARD_SET_IN_USE")) {
    return "ยังมีการ์ดในแคตตาล็อกอยู่ในชุดนี้ ย้ายการ์ดไปชุดอื่นก่อนแล้วค่อยลบ";
  }
  if (hasErrorCode(error, "INVALID_ATTRIBUTE_DEFINITION")) {
    return "ฟิลด์ชนิดตัวเลือกต้องมีตัวเลือกอย่างน้อยหนึ่งตัว และชนิดอื่นต้องไม่มีตัวเลือก";
  }
  if (hasErrorCode(error, "FILE_NOT_FOUND")) {
    return "รูปยังอัปโหลดไม่เสร็จหรือหายไปแล้ว ลองอัปใหม่";
  }
  if (hasErrorCode(error, "ACCESS_DENIED")) {
    return "บัญชีนี้ไม่มีสิทธิ์แก้ข้อมูลเกม";
  }
  return getErrorMessage(error, fallback);
}
