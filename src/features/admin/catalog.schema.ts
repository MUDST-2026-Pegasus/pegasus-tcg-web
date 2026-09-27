import { z } from "zod";

import { CARD_EDITIONS, CARD_FINISHES, PRODUCT_TYPES } from "./catalog.format";
import type {
  AttributeValue,
  CatalogProduct,
  CatalogVariant,
  GameAttribute,
  ProductPayload,
  ProductType,
  VariantPayload,
} from "./catalog.types";

/**
 * ฟอร์มสินค้า — กติกาตั้งให้ตรงกับ Bean Validation ใน `dto/ProductRequest.java`
 * และ `service/ProductAttributeValidator.java` ถ้าฝั่งโน้นแก้ ต้องตามมาแก้ที่นี่
 *
 * ชื่อช่องตรงกับชื่อฟิลด์ใน DTO violations ที่หลุดมาจาก backend จึงแปะช่องได้เลย
 *
 * `attributes` ขึ้นกับเกม: schema จึงสร้างจาก registry ของเกมนั้น (`GameAttribute[]`)
 * ทุกค่าเก็บในฟอร์มเป็นข้อความ แล้วค่อยแปลงเป็นชนิดจริงตอนส่ง
 */

/** `ProductAttributeValidator.isDate` — `LocalDate.parse` รับแค่ yyyy-MM-dd */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** @returns ข้อความที่ผิด หรือ `null` เมื่อค่าใช้ได้ — ค่าว่างผิดเฉพาะช่องที่บังคับ */
export function attributeProblem(
  attribute: GameAttribute,
  text: string,
): string | null {
  const value = text.trim();
  if (value === "") {
    return attribute.required ? `ต้องระบุ ${attribute.label}` : null;
  }

  switch (attribute.dataType) {
    case "NUMBER":
      return Number.isFinite(Number(value))
        ? null
        : `${attribute.label} ต้องเป็นตัวเลข`;
    case "BOOLEAN":
      return value === "true" || value === "false"
        ? null
        : "เลือกใช่หรือไม่ใช่";
    case "DATE":
      return DATE_PATTERN.test(value) ? null : "วันที่ไม่ถูกต้อง";
    case "ENUM":
      return attribute.options.includes(value)
        ? null
        : "เลือกจากตัวเลือกที่มีเท่านั้น";
    case "STRING":
      return null;
  }
}

/** ข้อความในฟอร์ม → ชนิดที่ backend เช็ค (`value instanceof Number` / `Boolean` / `String`) */
function toAttributeValue(
  attribute: GameAttribute,
  text: string,
): AttributeValue {
  const value = text.trim();
  switch (attribute.dataType) {
    case "NUMBER":
      return Number(value);
    case "BOOLEAN":
      return value === "true";
    default:
      return value;
  }
}

export function productSchema(registry: GameAttribute[]) {
  return z.object({
    gameId: z.string().min(1, "เลือกเกม"),
    categoryId: z.string().min(1, "เลือกหมวดหมู่"),
    /** `""` = ไม่ระบุชุด (อุปกรณ์เสริมไม่อยู่ในชุดไหน) */
    cardSetId: z.string(),
    productType: z.enum(PRODUCT_TYPES),
    name: z
      .string()
      .trim()
      .min(1, "กรอกชื่อสินค้า")
      .max(255, "ชื่อต้องไม่เกิน 255 ตัวอักษร"),
    nameLocal: z.string().trim().max(255, "ชื่อต้องไม่เกิน 255 ตัวอักษร"),
    /** ใช้เฉพาะตอนสร้าง — ว่างไว้ backend สร้างจากชื่อกับเลขการ์ดให้ */
    slug: z
      .string()
      .trim()
      .max(120, "slug ต้องไม่เกิน 120 ตัวอักษร")
      .regex(/^[a-z0-9-]*$/, "ใช้ได้แค่ a-z ตัวเล็ก ตัวเลข และขีดกลาง (-)"),
    cardNumber: z.string().trim().max(32, "เลขการ์ดต้องไม่เกิน 32 ตัวอักษร"),
    rarityCode: z.string().trim().max(32, "รหัสความหายากต้องไม่เกิน 32 ตัวอักษร"),
    description: z.string().trim(),
    // ช่องที่ยังไม่เคยแตะเป็น undefined (สินค้าเก่าไม่มีคีย์นั้น) — ถือเป็นค่าว่าง
    attributes: z
      .record(z.string(), z.string().optional())
      .superRefine((values, context) => {
        for (const attribute of registry) {
          const problem = attributeProblem(
            attribute,
            values[attribute.attrKey] ?? "",
          );
          if (problem) {
            context.addIssue({
              code: "custom",
              path: [attribute.attrKey],
              message: problem,
            });
          }
        }
      }),
    active: z.boolean(),
  });
}

export type ProductFormValues = z.infer<ReturnType<typeof productSchema>>;

export function emptyProductForm(gameId: number): ProductFormValues {
  return {
    gameId: String(gameId),
    categoryId: "",
    cardSetId: "",
    productType: "SINGLE_CARD",
    name: "",
    nameLocal: "",
    slug: "",
    cardNumber: "",
    rarityCode: "",
    description: "",
    attributes: {},
    active: true,
  };
}

/** ค่าเดิมของสินค้า → ค่าตั้งต้นของฟอร์มแก้ไข (PUT เขียนทับทั้งแถว ต้องเริ่มจากของจริงเสมอ) */
export function toProductForm(product: CatalogProduct): ProductFormValues {
  const attributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(product.attributes)) {
    attributes[key] = value === null || value === undefined ? "" : String(value);
  }

  return {
    gameId: String(product.gameId),
    categoryId: String(product.categoryId),
    cardSetId: product.cardSetId === null ? "" : String(product.cardSetId),
    productType: product.productType,
    name: product.name,
    nameLocal: product.nameLocal ?? "",
    slug: product.slug,
    cardNumber: product.cardNumber ?? "",
    rarityCode: product.rarityCode ?? "",
    description: product.description ?? "",
    attributes,
    active: product.active,
  };
}

const orNull = (value: string) => (value === "" ? null : value);

/**
 * ค่าในฟอร์ม → body ของ POST/PUT
 *
 * ส่งเฉพาะคีย์ที่อยู่ใน registry ตอนนี้ — คีย์เก่าที่ถูกลบออกจากเกมไปแล้วแต่ยังค้างในสินค้า
 * ถ้าส่งกลับไป backend จะปฏิเสธทั้งคำขอ ("is not an attribute of this game")
 */
export function toProductPayload(
  values: ProductFormValues,
  registry: GameAttribute[],
): ProductPayload {
  const attributes: Record<string, AttributeValue> = {};
  for (const attribute of registry) {
    const text = values.attributes[attribute.attrKey] ?? "";
    if (text.trim() !== "") {
      attributes[attribute.attrKey] = toAttributeValue(attribute, text);
    }
  }

  return {
    gameId: Number(values.gameId),
    categoryId: Number(values.categoryId),
    cardSetId: values.cardSetId === "" ? null : Number(values.cardSetId),
    productType: values.productType,
    name: values.name,
    nameLocal: orNull(values.nameLocal),
    slug: orNull(values.slug),
    cardNumber: orNull(values.cardNumber),
    rarityCode: orNull(values.rarityCode),
    description: orNull(values.description),
    attributes,
    active: values.active,
  };
}

/** ท้ายข้อความของ `ProductAttributeValidator` → ข้อความไทย */
const BACKEND_ATTRIBUTE_PROBLEMS: [RegExp, (label: string) => string][] = [
  [/^is required for this game$/, (label) => `ต้องระบุ ${label}`],
  [/^must be a number$/, (label) => `${label} ต้องเป็นตัวเลข`],
  [/^must be true or false$/, () => "เลือกใช่หรือไม่ใช่"],
  [/^must be text$/, (label) => `${label} ต้องเป็นข้อความ`],
  [/^must be a date/, () => "วันที่ไม่ถูกต้อง"],
  [/^must be one of/, () => "เลือกจากตัวเลือกที่มีเท่านั้น"],
];

/**
 * `INVALID_PRODUCT_ATTRIBUTES` ไม่มี violations — backend รวมทุกปัญหาไว้ในข้อความเดียว
 * คั่นด้วย "; " แต่ละข้อขึ้นต้นด้วยคีย์ ("hp is required for this game; ...")
 * แยกกลับเป็นรายช่องเพื่อแปะ error ใต้ช่องนั้น ข้อที่จับคู่ช่องไม่ได้คืนไปใน `unmatched`
 */
export function splitAttributeProblems(
  message: string,
  registry: GameAttribute[],
): { fields: { key: string; message: string }[]; unmatched: string[] } {
  const fields: { key: string; message: string }[] = [];
  const unmatched: string[] = [];

  for (const problem of message.split("; ")) {
    const attribute = registry.find((candidate) =>
      problem.startsWith(`${candidate.attrKey} `),
    );
    if (!attribute) {
      unmatched.push(problem);
      continue;
    }
    const rest = problem.slice(attribute.attrKey.length + 1);
    const translate = BACKEND_ATTRIBUTE_PROBLEMS.find(([pattern]) =>
      pattern.test(rest),
    )?.[1];
    fields.push({
      key: attribute.attrKey,
      message: translate ? translate(attribute.label) : problem,
    });
  }

  return { fields, unmatched };
}

// ---------- variant ----------

/**
 * ตรงกับ Bean Validation ใน `dto/VariantRequest.java` — ชื่อช่องตรงกับ DTO
 * `imageUrl` ไม่มีช่องในฟอร์ม (รูปจัดการที่แท็บรูปภาพ) แต่ PUT เขียนทับทั้งแถว
 * จึงส่งค่าเดิมกลับไปเสมอใน `toVariantPayload`
 */
export const variantSchema = z.object({
  languageCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2,10}$/, "ใส่รหัสภาษา 2–10 ตัวอักษร เช่น EN, JP, TH"),
  finish: z.enum(CARD_FINISHES),
  edition: z.enum(CARD_EDITIONS),
  printingNote: z.string().trim().max(100, "หมายเหตุต้องไม่เกิน 100 ตัวอักษร"),
  sku: z
    .string()
    .trim()
    .max(64, "SKU ต้องไม่เกิน 64 ตัวอักษร")
    .regex(/^[A-Za-z0-9_-]*$/, "ใช้ได้แค่ตัวอักษร ตัวเลข ขีดกลาง และขีดล่าง"),
  barcode: z.string().trim().max(64, "บาร์โค้ดต้องไม่เกิน 64 ตัวอักษร"),
  active: z.boolean(),
});

export type VariantFormValues = z.infer<typeof variantSchema>;

/** การ์ดเดี่ยวเริ่มที่ Normal ส่วนของซีล/อุปกรณ์ไม่มี finish */
export function emptyVariantForm(productType: ProductType): VariantFormValues {
  return {
    languageCode: "EN",
    finish: productType === "SINGLE_CARD" ? "NORMAL" : "NOT_APPLICABLE",
    edition: "NOT_APPLICABLE",
    printingNote: "",
    sku: "",
    barcode: "",
    active: true,
  };
}

export function toVariantForm(variant: CatalogVariant): VariantFormValues {
  return {
    languageCode: variant.languageCode,
    finish: variant.finish,
    edition: variant.edition,
    printingNote: variant.printingNote ?? "",
    sku: variant.sku,
    barcode: variant.barcode ?? "",
    active: variant.active,
  };
}

/**
 * `sku` ว่าง = ตอนสร้างให้ backend สร้างให้ ตอนแก้คงของเดิม
 * `imageUrl` ส่งของเดิมกลับไป ไม่งั้น PUT ล้างทิ้ง
 */
export function toVariantPayload(
  values: VariantFormValues,
  existing?: CatalogVariant,
): VariantPayload {
  return {
    sku: orNull(values.sku),
    languageCode: values.languageCode.toUpperCase(),
    finish: values.finish,
    edition: values.edition,
    printingNote: orNull(values.printingNote),
    barcode: orNull(values.barcode),
    imageUrl: existing?.imageUrl ?? null,
    active: values.active,
  };
}
