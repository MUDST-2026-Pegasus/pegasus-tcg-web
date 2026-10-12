import { z } from "zod";

import type {
  CardSet,
  CatalogCategory,
  Game,
  GameAttribute,
} from "./catalog.types";
import { ATTRIBUTE_TYPES } from "./taxonomy.format";
import type {
  AttributePayload,
  CardSetPayload,
  CategoryPayload,
  GamePayload,
} from "./taxonomy.types";

/**
 * ฟอร์มเกม / ฟิลด์ / ชุดการ์ด / หมวดหมู่ — กติกาตั้งให้ตรงกับ Bean Validation ใน
 * `dto/GameRequest.java`, `GameAttributeRequest.java`, `CardSetRequest.java`, `CategoryRequest.java`
 * ถ้าฝั่งโน้นแก้ ต้องตามมาแก้ที่นี่
 *
 * ชื่อช่องตรงกับชื่อฟิลด์ใน DTO violations ที่หลุดมาจาก backend จึงแปะช่องได้เลย
 * ช่องตัวเลขเก็บเป็นข้อความในฟอร์ม แล้วค่อยแปลงตอนส่ง
 */

/** `smallint` ฝั่ง database */
const SMALLINT_MAX = 32767;

const optionalText = (max: number) =>
  z.string().trim().max(max, `ไม่เกิน ${max} ตัวอักษร`);

const requiredText = (label: string, max: number) =>
  optionalText(max).min(1, `ต้องระบุ${label}`);

const displayOrder = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      (/^\d+$/.test(value) && Number(value) <= SMALLINT_MAX),
    `เป็นเลขจำนวนเต็ม 0–${SMALLINT_MAX}`,
  );

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const toOrder = (value: string): number =>
  value.trim() === "" ? 0 : Number(value);

// ---------- เกม ----------

export const gameSchema = z.object({
  name: requiredText("ชื่อเกม", 100),
  nameLocal: optionalText(100),
  code: requiredText("รหัสเกม", 32).regex(
    /^[A-Za-z0-9_]+$/,
    "ใช้ได้แค่ A-Z 0-9 และ _",
  ),
  slug: optionalText(100).regex(
    /^[a-z0-9-]*$/,
    "ใช้ได้แค่ a-z 0-9 และ -",
  ),
  logoUrl: optionalText(500),
  displayOrder,
  active: z.boolean(),
});

export type GameFormValues = z.infer<typeof gameSchema>;

export function toGameForm(game?: Game): GameFormValues {
  return {
    name: game?.name ?? "",
    nameLocal: game?.nameLocal ?? "",
    code: game?.code ?? "",
    slug: game?.slug ?? "",
    logoUrl: game?.logoUrl ?? "",
    displayOrder: String(game?.displayOrder ?? 0),
    active: game?.active ?? true,
  };
}

export function toGamePayload(values: GameFormValues): GamePayload {
  return {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    nameLocal: blankToNull(values.nameLocal),
    slug: blankToNull(values.slug),
    logoUrl: blankToNull(values.logoUrl),
    displayOrder: toOrder(values.displayOrder),
    active: values.active,
  };
}

/** PUT เขียนทับทั้งแถว — สลับแค่ `active` ก็ต้องส่งช่องอื่นเดิมไปครบ */
export function gameWithActive(game: Game, active: boolean): GamePayload {
  return {
    code: game.code,
    name: game.name,
    nameLocal: game.nameLocal,
    slug: game.slug,
    logoUrl: game.logoUrl,
    displayOrder: game.displayOrder,
    active,
  };
}

// ---------- ฟิลด์ของการ์ด ----------

/** `GameAttributeRequest.attrKey` */
const ATTR_KEY = /^[a-z][a-z0-9_]*$/;

/** "Card Type" → "card_type", "HP" → "hp" — ใช้เดาคีย์ให้ตอนพิมพ์ชื่อฟิลด์ */
export function suggestAttrKey(label: string): string {
  const key = label
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .replace(/_+$/, "");
  return key.slice(0, 50);
}

/** ตัวเลือกพิมพ์บรรทัดละตัว — ตัดช่องว่างหัวท้ายและบรรทัดว่างทิ้ง */
export function parseOptions(text: string): string[] {
  return text
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean);
}

export const attributeSchema = z
  .object({
    label: requiredText("ชื่อฟิลด์", 100),
    attrKey: requiredText("คีย์", 50).regex(
      ATTR_KEY,
      "ขึ้นต้นด้วย a-z แล้วตามด้วย a-z 0-9 หรือ _ เท่านั้น",
    ),
    dataType: z.enum(ATTRIBUTE_TYPES),
    options: z.string(),
    filterable: z.boolean(),
    required: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.dataType !== "ENUM") {
      return;
    }
    const options = parseOptions(values.options);
    if (options.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "ฟิลด์ชนิดตัวเลือกต้องมีอย่างน้อยหนึ่งตัวเลือก",
      });
    } else if (options.some((option) => option.length > 100)) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "แต่ละตัวเลือกยาวไม่เกิน 100 ตัวอักษร",
      });
    } else if (new Set(options).size !== options.length) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "มีตัวเลือกซ้ำกัน",
      });
    }
  });

export type AttributeFormValues = z.infer<typeof attributeSchema>;

export function toAttributeForm(attribute?: GameAttribute): AttributeFormValues {
  return {
    label: attribute?.label ?? "",
    attrKey: attribute?.attrKey ?? "",
    dataType: attribute?.dataType ?? "STRING",
    options: attribute?.options.join("\n") ?? "",
    filterable: attribute?.filterable ?? true,
    required: attribute?.required ?? false,
  };
}

/**
 * @param displayOrder ของเดิมตอนแก้ ส่วนฟิลด์ใหม่ต่อท้ายตาราง
 * ชนิดที่ไม่ใช่ ENUM ต้องส่ง `options: []` ไม่งั้น backend ตอบ `INVALID_ATTRIBUTE_DEFINITION`
 */
export function toAttributePayload(
  values: AttributeFormValues,
  displayOrder: number,
): AttributePayload {
  return {
    attrKey: values.attrKey.trim(),
    label: values.label.trim(),
    dataType: values.dataType,
    options: values.dataType === "ENUM" ? parseOptions(values.options) : [],
    filterable: values.filterable,
    required: values.required,
    displayOrder,
  };
}

/** สวิตช์ในตาราง — PUT เขียนทับทั้งแถว จึงส่งช่องอื่นเดิมไปครบ */
export function attributeWith(
  attribute: GameAttribute,
  changes: Partial<Pick<AttributePayload, "required" | "filterable">>,
): AttributePayload {
  return {
    attrKey: attribute.attrKey,
    label: attribute.label,
    dataType: attribute.dataType,
    options: attribute.options,
    filterable: attribute.filterable,
    required: attribute.required,
    displayOrder: attribute.displayOrder,
    ...changes,
  };
}

// ---------- ชุดการ์ด ----------

export const cardSetSchema = z.object({
  code: requiredText("รหัสชุด", 32).regex(
    /^[A-Za-z0-9_.-]+$/,
    "ใช้ได้แค่ A-Z 0-9 . - และ _",
  ),
  name: requiredText("ชื่อชุด", 150),
  nameLocal: optionalText(150),
  /** `<input type="date">` ให้ค่า `yyyy-MM-dd` หรือ `""` */
  releaseDate: z
    .string()
    .refine(
      (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "วันที่ไม่ถูกต้อง",
    ),
  totalCards: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d+$/.test(value) && Number(value) > 0),
      "เป็นจำนวนเต็มมากกว่า 0",
    ),
  logoUrl: optionalText(500),
});

export type CardSetFormValues = z.infer<typeof cardSetSchema>;

export function toCardSetForm(cardSet?: CardSet): CardSetFormValues {
  return {
    code: cardSet?.code ?? "",
    name: cardSet?.name ?? "",
    nameLocal: cardSet?.nameLocal ?? "",
    releaseDate: cardSet?.releaseDate ?? "",
    totalCards:
      cardSet?.totalCards === null || cardSet?.totalCards === undefined
        ? ""
        : String(cardSet.totalCards),
    logoUrl: cardSet?.logoUrl ?? "",
  };
}

export function toCardSetPayload(values: CardSetFormValues): CardSetPayload {
  return {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    nameLocal: blankToNull(values.nameLocal),
    releaseDate: values.releaseDate === "" ? null : values.releaseDate,
    totalCards: values.totalCards.trim() === "" ? null : Number(values.totalCards),
    logoUrl: blankToNull(values.logoUrl),
  };
}

// ---------- หมวดหมู่ ----------

/** `"all"` = ใช้กับทุกเกม (`gameId: null`) — Base UI Select ไม่รับ `null` เป็นตัวเลือก */
export const ALL_GAMES = "all";
/** ไม่มีหมวดแม่ (ระดับบนสุด) */
export const NO_PARENT = "none";

export const categorySchema = z.object({
  name: requiredText("ชื่อหมวด", 100),
  code: requiredText("รหัส", 50).regex(
    /^[A-Za-z0-9_]+$/,
    "ใช้ได้แค่ A-Z 0-9 และ _",
  ),
  slug: optionalText(120).regex(/^[a-z0-9-]*$/, "ใช้ได้แค่ a-z 0-9 และ -"),
  /** `gameId` เป็นข้อความ หรือ `ALL_GAMES` */
  scope: z.string().min(1),
  /** `categoryId` เป็นข้อความ หรือ `NO_PARENT` */
  parentId: z.string().min(1),
  displayOrder,
  active: z.boolean(),
  /** key เดิม หรือ key ใหม่จากการอัปโหลด — `""` = ไม่มีรูป */
  imageKey: z.string(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export function toCategoryForm(
  gameId: number,
  category?: CatalogCategory,
): CategoryFormValues {
  const categoryGame = category ? category.gameId : gameId;
  return {
    name: category?.name ?? "",
    code: category?.code ?? "",
    slug: category?.slug ?? "",
    scope: categoryGame === null ? ALL_GAMES : String(categoryGame),
    parentId:
      category?.parentId === null || category?.parentId === undefined
        ? NO_PARENT
        : String(category.parentId),
    displayOrder: String(category?.displayOrder ?? 0),
    active: category?.active ?? true,
    imageKey: category?.imageKey ?? "",
  };
}

export function toCategoryPayload(values: CategoryFormValues): CategoryPayload {
  return {
    gameId: values.scope === ALL_GAMES ? null : Number(values.scope),
    parentId: values.parentId === NO_PARENT ? null : Number(values.parentId),
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    slug: blankToNull(values.slug),
    displayOrder: toOrder(values.displayOrder),
    active: values.active,
    imageKey: blankToNull(values.imageKey),
  };
}

/** สวิตช์ "เปิดใช้งาน" ในตาราง — PUT เขียนทับทั้งแถว */
export function categoryWithActive(
  category: CatalogCategory,
  active: boolean,
): CategoryPayload {
  return {
    gameId: category.gameId,
    parentId: category.parentId,
    code: category.code,
    name: category.name,
    slug: category.slug,
    displayOrder: category.displayOrder,
    active,
    imageKey: category.imageKey,
  };
}
