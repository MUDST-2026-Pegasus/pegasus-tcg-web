import { z } from "zod";

import type { useTranslate } from "@/lib/i18n";

import { CARD_EDITIONS, CARD_FINISHES, PRODUCT_TYPES } from "./catalog.format";
import type {
  AttributeValue,
  CardEffect,
  CardEffectPayload,
  CatalogProduct,
  CatalogVariant,
  GameAttribute,
  ProductPayload,
  ProductType,
  VariantPayload,
} from "./catalog.types";

/** t ของ namespace admin — schema เป็น factory ที่รับ t ข้อความ validation จึงตามภาษาปัจจุบัน [TCG-556] */
export type AdminT = ReturnType<typeof useTranslate<"admin">>["t"];

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
  translate: AdminT,
): string | null {
  const value = text.trim();
  if (value === "") {
    return attribute.required ? translate("catalog.validation.attributeRequired", "ต้องระบุ {label}", { label: attribute.label }) : null;
  }

  switch (attribute.dataType) {
    case "NUMBER":
      return Number.isFinite(Number(value))
        ? null
        : translate("catalog.validation.attributeNumber", "{label} ต้องเป็นตัวเลข", { label: attribute.label });
    case "BOOLEAN":
      return value === "true" || value === "false"
        ? null
        : translate("catalog.validation.attributeBoolean", "เลือกใช่หรือไม่ใช่");
    case "DATE":
      return DATE_PATTERN.test(value) ? null : translate("catalog.validation.invalidDate", "วันที่ไม่ถูกต้อง");
    case "ENUM":
      return attribute.options.includes(value)
        ? null
        : translate("catalog.validation.attributeEnum", "เลือกจากตัวเลือกที่มีเท่านั้น");
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

export function productSchema(registry: GameAttribute[], translate: AdminT) {
  return z.object({
    gameId: z.string().min(1, translate("catalog.validation.gameRequired", "เลือกเกม")),
    categoryId: z.string().min(1, translate("catalog.validation.categoryRequired", "เลือกหมวดหมู่")),
    /** `""` = ไม่ระบุชุด (อุปกรณ์เสริมไม่อยู่ในชุดไหน) */
    cardSetId: z.string(),
    productType: z.enum(PRODUCT_TYPES),
    name: z
      .string()
      .trim()
      .min(1, translate("catalog.validation.nameRequired", "กรอกชื่อสินค้า"))
      .max(255, translate("catalog.validation.nameMax", "ชื่อต้องไม่เกิน {max} ตัวอักษร", { max: 255 })),
    nameLocal: z.string().trim().max(255, translate("catalog.validation.nameMax", "ชื่อต้องไม่เกิน {max} ตัวอักษร", { max: 255 })),
    /** ใช้เฉพาะตอนสร้าง — ว่างไว้ backend สร้างจากชื่อกับเลขการ์ดให้ */
    slug: z
      .string()
      .trim()
      .max(120, translate("catalog.validation.slugMax", "slug ต้องไม่เกิน {max} ตัวอักษร", { max: 120 }))
      .regex(/^[a-z0-9-]*$/, translate("catalog.validation.slugPattern", "ใช้ได้แค่ a-z ตัวเล็ก ตัวเลข และขีดกลาง (-)")),
    cardNumber: z.string().trim().max(32, translate("catalog.validation.cardNumberMax", "เลขการ์ดต้องไม่เกิน {max} ตัวอักษร", { max: 32 })),
    rarityCode: z.string().trim().max(32, translate("catalog.validation.rarityMax", "รหัสความหายากต้องไม่เกิน {max} ตัวอักษร", { max: 32 })),
    description: z.string().trim(),
    // ช่องที่ยังไม่เคยแตะเป็น undefined (สินค้าเก่าไม่มีคีย์นั้น) — ถือเป็นค่าว่าง
    attributes: z
      .record(z.string(), z.string().optional())
      .superRefine((values, context) => {
        for (const attribute of registry) {
          const problem = attributeProblem(
            attribute,
            values[attribute.attrKey] ?? "",
            translate,
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
const BACKEND_ATTRIBUTE_PROBLEMS: [RegExp, (label: string, translate: AdminT) => string][] = [
  [/^is required for this game$/, (label, translate) => translate("catalog.validation.attributeRequired", "ต้องระบุ {label}", { label })],
  [/^must be a number$/, (label, translate) => translate("catalog.validation.attributeNumber", "{label} ต้องเป็นตัวเลข", { label })],
  [/^must be true or false$/, (_, translate) => translate("catalog.validation.attributeBoolean", "เลือกใช่หรือไม่ใช่")],
  [/^must be text$/, (label, translate) => translate("catalog.validation.attributeString", "{label} ต้องเป็นข้อความ", { label })],
  [/^must be a date/, (_, translate) => translate("catalog.validation.invalidDate", "วันที่ไม่ถูกต้อง")],
  [/^must be one of/, (_, translate) => translate("catalog.validation.attributeEnum", "เลือกจากตัวเลือกที่มีเท่านั้น")],
];

/**
 * `INVALID_PRODUCT_ATTRIBUTES` ไม่มี violations — backend รวมทุกปัญหาไว้ในข้อความเดียว
 * คั่นด้วย "; " แต่ละข้อขึ้นต้นด้วยคีย์ ("hp is required for this game; ...")
 * แยกกลับเป็นรายช่องเพื่อแปะ error ใต้ช่องนั้น ข้อที่จับคู่ช่องไม่ได้คืนไปใน `unmatched`
 */
export function splitAttributeProblems(
  message: string,
  registry: GameAttribute[],
  translate: AdminT,
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
    const describe = BACKEND_ATTRIBUTE_PROBLEMS.find(([pattern]) =>
      pattern.test(rest),
    )?.[1];
    fields.push({
      key: attribute.attrKey,
      message: describe ? describe(attribute.label, translate) : problem,
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
export const variantSchema = (translate: AdminT) =>
  z.object({
  languageCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2,10}$/, translate("catalog.validation.languageCode", "ใส่รหัสภาษา 2–10 ตัวอักษร เช่น EN, JP, TH")),
  finish: z.enum(CARD_FINISHES),
  edition: z.enum(CARD_EDITIONS),
  printingNote: z.string().trim().max(100, translate("catalog.validation.printingNoteMax", "หมายเหตุต้องไม่เกิน {max} ตัวอักษร", { max: 100 })),
  sku: z
    .string()
    .trim()
    .max(64, translate("catalog.validation.skuMax", "SKU ต้องไม่เกิน {max} ตัวอักษร", { max: 64 }))
    .regex(/^[A-Za-z0-9_-]*$/, translate("catalog.validation.skuPattern", "ใช้ได้แค่ตัวอักษร ตัวเลข ขีดกลาง และขีดล่าง")),
  barcode: z.string().trim().max(64, translate("catalog.validation.barcodeMax", "บาร์โค้ดต้องไม่เกิน {max} ตัวอักษร", { max: 64 })),
  active: z.boolean(),
});

export type VariantFormValues = z.infer<ReturnType<typeof variantSchema>>;

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

// ---------- Abilities & Attacks ----------

/**
 * ตรงกับ Bean Validation ใน `dto/CatalogCardEffectRequest.java`
 * ทุกช่องเก็บเป็นข้อความ — `damage` แปลงเป็นตัวเลข และ `energyCost`
 * แยกด้วยจุลภาคตอนส่ง (`toCardEffectsPayload`)
 */
export const cardEffectsSchema = (translate: AdminT) =>
  z.object({
  effects: z
    .array(
      z.object({
        effectType: z.enum(["ABILITY", "ATTACK", "RULE"]),
        name: z
          .string()
          .trim()
          .min(1, translate("catalog.validation.effectNameRequired", "ใส่ชื่อ"))
          .max(120, translate("catalog.validation.nameMax", "ชื่อต้องไม่เกิน {max} ตัวอักษร", { max: 120 })),
        effectText: z
          .string()
          .trim()
          .max(2000, translate("catalog.validation.effectTextMax", "คำอธิบายต้องไม่เกิน {max} ตัวอักษร", { max: 2000 })),
        damage: z
          .string()
          .trim()
          .regex(/^\d{0,6}$/, translate("catalog.validation.damage", "ใส่ตัวเลข 0 ขึ้นไป หรือเว้นว่าง")),
        energyCost: z
          .string()
          .trim()
          .refine(
            (value) => splitEnergy(value).length <= 10,
            translate("catalog.validation.energyCount", "พลังงานไม่เกิน {max} ตัว", { max: 10 }),
          )
          .refine(
            (value) => splitEnergy(value).every((energy) => energy.length <= 20),
            translate("catalog.validation.energyNameMax", "ชื่อพลังงานแต่ละตัวต้องไม่เกิน {max} ตัวอักษร", { max: 20 }),
          ),
        sourceUrl: z.string().trim().max(500, translate("catalog.validation.sourceUrlMax", "ลิงก์ต้องไม่เกิน {max} ตัวอักษร", { max: 500 })),
      }),
    )
    .max(30, translate("catalog.validation.effectsMax", "ไม่เกิน {max} รายการต่อการ์ด", { max: 30 })),
});

export type CardEffectsFormValues = z.infer<ReturnType<typeof cardEffectsSchema>>;

export type CardEffectFormValues = CardEffectsFormValues["effects"][number];

function splitEnergy(value: string): string[] {
  return value
    .split(",")
    .map((energy) => energy.trim())
    .filter((energy) => energy !== "");
}

export function emptyCardEffectForm(): CardEffectFormValues {
  return {
    effectType: "ATTACK",
    name: "",
    effectText: "",
    damage: "",
    energyCost: "",
    sourceUrl: "",
  };
}

export function toCardEffectsForm(effects: CardEffect[]): CardEffectsFormValues {
  return {
    effects: effects.map((effect) => ({
      effectType: effect.effectType,
      name: effect.name,
      effectText: effect.effectText ?? "",
      damage: effect.damage === null ? "" : String(effect.damage),
      energyCost: effect.energyCost.join(", "),
      sourceUrl: effect.sourceUrl ?? "",
    })),
  };
}

export function toCardEffectsPayload(
  values: CardEffectsFormValues,
): CardEffectPayload[] {
  return values.effects.map((effect) => {
    // ดาเมจกับพลังงานมีแค่ท่าโจมตี — เปลี่ยนประเภทแล้วค่าที่ค้างในช่องที่ซ่อนไปต้องไม่ติดไปด้วย
    const isAttack = effect.effectType === "ATTACK";
    return {
      effectType: effect.effectType,
      name: effect.name,
      effectText: orNull(effect.effectText),
      damage: isAttack && effect.damage !== "" ? Number(effect.damage) : null,
      energyCost: isAttack ? splitEnergy(effect.energyCost) : [],
      sourceUrl: orNull(effect.sourceUrl),
    };
  });
}

/** violation ของ backend ชื่อ `effects[2].name` — ฟอร์มใช้ `effects.2.name` */
export function toCardEffectField(field: string): string {
  return field.replace(/\[(\d+)\]/g, ".$1");
}

// @tolgee-key {"key": "catalog.validation.attributeRequired", "ns": "admin", "defaultValue": "ต้องระบุ {label}"}
// @tolgee-key {"key": "catalog.validation.attributeNumber", "ns": "admin", "defaultValue": "{label} ต้องเป็นตัวเลข"}
// @tolgee-key {"key": "catalog.validation.attributeBoolean", "ns": "admin", "defaultValue": "เลือกใช่หรือไม่ใช่"}
// @tolgee-key {"key": "catalog.validation.invalidDate", "ns": "admin", "defaultValue": "วันที่ไม่ถูกต้อง"}
// @tolgee-key {"key": "catalog.validation.attributeEnum", "ns": "admin", "defaultValue": "เลือกจากตัวเลือกที่มีเท่านั้น"}
// @tolgee-key {"key": "catalog.validation.gameRequired", "ns": "admin", "defaultValue": "เลือกเกม"}
// @tolgee-key {"key": "catalog.validation.categoryRequired", "ns": "admin", "defaultValue": "เลือกหมวดหมู่"}
// @tolgee-key {"key": "catalog.validation.nameRequired", "ns": "admin", "defaultValue": "กรอกชื่อสินค้า"}
// @tolgee-key {"key": "catalog.validation.nameMax", "ns": "admin", "defaultValue": "ชื่อต้องไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "catalog.validation.slugMax", "ns": "admin", "defaultValue": "slug ต้องไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "catalog.validation.slugPattern", "ns": "admin", "defaultValue": "ใช้ได้แค่ a-z ตัวเล็ก ตัวเลข และขีดกลาง (-)"}
// @tolgee-key {"key": "catalog.validation.cardNumberMax", "ns": "admin", "defaultValue": "เลขการ์ดต้องไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "catalog.validation.rarityMax", "ns": "admin", "defaultValue": "รหัสความหายากต้องไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "catalog.validation.attributeString", "ns": "admin", "defaultValue": "{label} ต้องเป็นข้อความ"}
// @tolgee-key {"key": "catalog.validation.languageCode", "ns": "admin", "defaultValue": "ใส่รหัสภาษา 2–10 ตัวอักษร เช่น EN, JP, TH"}
// @tolgee-key {"key": "catalog.validation.printingNoteMax", "ns": "admin", "defaultValue": "หมายเหตุต้องไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "catalog.validation.skuMax", "ns": "admin", "defaultValue": "SKU ต้องไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "catalog.validation.skuPattern", "ns": "admin", "defaultValue": "ใช้ได้แค่ตัวอักษร ตัวเลข ขีดกลาง และขีดล่าง"}
// @tolgee-key {"key": "catalog.validation.barcodeMax", "ns": "admin", "defaultValue": "บาร์โค้ดต้องไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "catalog.validation.effectNameRequired", "ns": "admin", "defaultValue": "ใส่ชื่อ"}
// @tolgee-key {"key": "catalog.validation.effectTextMax", "ns": "admin", "defaultValue": "คำอธิบายต้องไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "catalog.validation.damage", "ns": "admin", "defaultValue": "ใส่ตัวเลข 0 ขึ้นไป หรือเว้นว่าง"}
// @tolgee-key {"key": "catalog.validation.energyCount", "ns": "admin", "defaultValue": "พลังงานไม่เกิน {max} ตัว"}
// @tolgee-key {"key": "catalog.validation.energyNameMax", "ns": "admin", "defaultValue": "ชื่อพลังงานแต่ละตัวต้องไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "catalog.validation.sourceUrlMax", "ns": "admin", "defaultValue": "ลิงก์ต้องไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "catalog.validation.effectsMax", "ns": "admin", "defaultValue": "ไม่เกิน {max} รายการต่อการ์ด"}
