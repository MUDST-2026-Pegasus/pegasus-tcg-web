import { z } from "zod";

import { CARD_CONDITIONS } from "./listing-form.format";
import type {
  CreateListingPayload,
  ListingDetailsPayload,
  NewUnitsPayload,
} from "./listing-form.types";
import { toNumber } from "./products.format";
import type { ListingPricePayload, SellerListing } from "./products.types";

/**
 * ฟอร์มลงขาย / แก้ประกาศ — ตั้งกติกาให้ตรงกับ Bean Validation ใน `dto/ListingRequest.java`,
 * `NewUnitsRequest.java`, `ListingDetailsRequest.java` และ `ListingService` ถ้าฝั่งโน้นแก้ต้องตามมาแก้
 *
 * ชื่อช่องตรงกับชื่อฟิลด์ใน DTO violations ที่หลุดมาจาก backend จึงแปะช่องได้เลยด้วย `applyApiErrors`
 * ตัวเลขเก็บเป็นข้อความตามที่พิมพ์ (`AmountInput`) แล้วค่อยแปลงตอนส่ง
 */

/** `@Digits(integer = 12, fraction = 2)` */
const MAX_MONEY = 999_999_999_999.99;
/** `NewUnitsRequest.quantity` — `@Max(100)` ต่อครั้ง */
export const MAX_UNITS_PER_STOCK_IN = 100;
/** `ListingRequest.imageKeys` — `@Size(max = 10)` */
export const MAX_LISTING_PHOTOS = 10;

/** create = ลงขายใหม่ (มีต้นทุนกับจำนวน) · edit = แก้ประกาศเดิม (ต้นทุน/จำนวนไปทางเติมสต็อก) */
export type ListingFormMode = "create" | "edit";

const baseSchema = z.object({
  catalogVariantId: z.number().nullable(),
  condition: z.enum(CARD_CONDITIONS).nullable(),
  pricingMode: z.enum(["MANUAL", "AUTO_MEDIAN"]),
  price: z.string(),
  autoPriceOffsetPercent: z.string(),
  autoPriceFloor: z.string(),
  autoPriceCeiling: z.string(),
  unitCost: z.string(),
  quantity: z.string(),
  gradingCompany: z
    .string()
    .trim()
    .max(20, "ชื่อบริษัทเกรดต้องไม่เกิน 20 ตัวอักษร"),
  gradeValue: z.string(),
  lotLabel: z.string().trim().max(60, "ป้ายล็อตต้องไม่เกิน 60 ตัวอักษร"),
  publicNote: z
    .string()
    .trim()
    .max(500, "รายละเอียดต้องไม่เกิน 500 ตัวอักษร"),
  imageKeys: z
    .array(z.string())
    .max(MAX_LISTING_PHOTOS, `ใส่รูปได้สูงสุด ${MAX_LISTING_PHOTOS} รูป`),
});

export type ListingFormValues = z.infer<typeof baseSchema>;

type Issue = { path: keyof ListingFormValues; message: string };

/** เงินบาท: ต้องกรอก (ถ้าบังคับ) มากกว่า 0 และไม่เกินที่ฐานข้อมูลเก็บได้ */
function moneyIssue(
  text: string,
  path: keyof ListingFormValues,
  label: string,
  options: { required: boolean; allowZero?: boolean },
): Issue | null {
  const value = toNumber(text);
  if (value === null) {
    return options.required ? { path, message: `กรอก${label}` } : null;
  }
  if (options.allowZero ? value < 0 : value <= 0) {
    return {
      path,
      message: options.allowZero
        ? `${label}ต้องไม่ติดลบ`
        : `${label}ต้องมากกว่า 0`,
    };
  }
  if (value > MAX_MONEY) {
    return { path, message: `${label}สูงเกินไป` };
  }
  return null;
}

/** ทุกกติกาที่ข้ามช่องหรือขึ้นกับโหมด — แยกออกมาให้ test ได้โดยไม่ผ่าน zod */
export function listingIssues(
  values: ListingFormValues,
  mode: ListingFormMode,
): Issue[] {
  const issues: (Issue | null)[] = [];

  if (mode === "create" && values.catalogVariantId === null) {
    issues.push({
      path: "catalogVariantId",
      message: "เลือกการ์ดจากแคตตาล็อกก่อน",
    });
  }
  if (values.condition === null) {
    issues.push({ path: "condition", message: "เลือกสภาพการ์ด" });
  }

  // AUTO_MEDIAN ก็ต้องมีราคา — เป็นราคาจนกว่างานกลางคืนจะขยับครั้งแรก
  issues.push(moneyIssue(values.price, "price", "ราคาขาย", { required: true }));

  if (values.pricingMode === "AUTO_MEDIAN") {
    const offset = toNumber(values.autoPriceOffsetPercent.replace(/^-$/, ""));
    if (values.autoPriceOffsetPercent !== "" && offset === null) {
      issues.push({
        path: "autoPriceOffsetPercent",
        message: "ส่วนต่างต้องเป็นตัวเลข เช่น -5 หรือ 3",
      });
    } else if (offset !== null && (offset < -99.99 || offset > 999.99)) {
      issues.push({
        path: "autoPriceOffsetPercent",
        message: "ส่วนต่างต้องอยู่ระหว่าง -99.99% ถึง 999.99%",
      });
    }

    // ticket บังคับขอบเขตราคาเสมอ — กันราคาวิ่งตามตลาดไปไกลเกินที่ผู้ขายรับได้
    const floorIssue = moneyIssue(
      values.autoPriceFloor,
      "autoPriceFloor",
      "ราคาต่ำสุด",
      { required: true },
    );
    const ceilingIssue = moneyIssue(
      values.autoPriceCeiling,
      "autoPriceCeiling",
      "ราคาสูงสุด",
      { required: true },
    );
    issues.push(floorIssue, ceilingIssue);

    const floor = toNumber(values.autoPriceFloor);
    const ceiling = toNumber(values.autoPriceCeiling);
    if (!floorIssue && !ceilingIssue && floor !== null && ceiling !== null && floor > ceiling) {
      issues.push({
        path: "autoPriceCeiling",
        message: "ราคาสูงสุดต้องไม่ต่ำกว่าราคาต่ำสุด",
      });
    }
  }

  if (mode === "create") {
    issues.push(
      moneyIssue(values.unitCost, "unitCost", "ต้นทุนต่อใบ", {
        required: true,
        allowZero: true,
      }),
    );
    const quantity = toNumber(values.quantity);
    if (quantity === null) {
      issues.push({ path: "quantity", message: "กรอกจำนวนการ์ด" });
    } else if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_UNITS_PER_STOCK_IN
    ) {
      issues.push({
        path: "quantity",
        message: `จำนวนต้องอยู่ระหว่าง 1–${MAX_UNITS_PER_STOCK_IN} ใบต่อครั้ง (เติมเพิ่มได้ทีหลัง)`,
      });
    }
  }

  const grade = toNumber(values.gradeValue);
  if (values.gradeValue !== "" && grade !== null) {
    if (grade < 0.5 || grade > 10 || !Number.isInteger(grade * 10)) {
      issues.push({
        path: "gradeValue",
        message: "เกรดต้องอยู่ระหว่าง 0.5–10 ทศนิยมไม่เกิน 1 ตำแหน่ง",
      });
    } else if (values.gradingCompany.trim() === "") {
      // `ListingService.requireGradingConsistent`
      issues.push({
        path: "gradingCompany",
        message: "ใส่บริษัทที่ให้เกรดนี้ด้วย เช่น PSA, BGS, CGC",
      });
    }
  }

  return issues.filter((issue): issue is Issue => issue !== null);
}

export function listingSchema(mode: ListingFormMode) {
  return baseSchema.superRefine((values, context) => {
    for (const issue of listingIssues(values, mode)) {
      context.addIssue({
        code: "custom",
        path: [issue.path],
        message: issue.message,
      });
    }
  });
}

/** ช่องของแต่ละขั้นในหน้าลงขาย — ใช้ตรวจก่อนไปขั้นถัดไป และพาไปขั้นที่มี error */
export const CREATE_STEP_FIELDS: (keyof ListingFormValues)[][] = [
  ["catalogVariantId"],
  [
    "condition",
    "pricingMode",
    "price",
    "autoPriceOffsetPercent",
    "autoPriceFloor",
    "autoPriceCeiling",
    "unitCost",
    "quantity",
    "gradingCompany",
    "gradeValue",
    "lotLabel",
    "publicNote",
  ],
  ["imageKeys"],
  [],
];

export function emptyListingForm(): ListingFormValues {
  return {
    catalogVariantId: null,
    condition: null,
    pricingMode: "MANUAL",
    price: "",
    autoPriceOffsetPercent: "0",
    autoPriceFloor: "",
    autoPriceCeiling: "",
    unitCost: "",
    quantity: "1",
    gradingCompany: "",
    gradeValue: "",
    lotLabel: "",
    publicNote: "",
    imageKeys: [],
  };
}

const text = (value: number | null) => (value === null ? "" : String(value));

/** ประกาศเดิม → ค่าตั้งต้นของฟอร์มแก้ไข (PUT เขียนทับทั้งชุด ต้องเริ่มจากของจริงเสมอ) */
export function toListingForm(listing: SellerListing): ListingFormValues {
  return {
    catalogVariantId: listing.card.variantId,
    condition: listing.condition,
    pricingMode: listing.pricingMode,
    price: text(listing.price),
    autoPriceOffsetPercent: text(listing.autoPriceOffsetPercent) || "0",
    autoPriceFloor: text(listing.autoPriceFloor),
    autoPriceCeiling: text(listing.autoPriceCeiling),
    unitCost: "",
    quantity: "",
    gradingCompany: listing.gradingCompany ?? "",
    gradeValue: text(listing.gradeValue),
    lotLabel: listing.lotLabel ?? "",
    publicNote: listing.publicNote ?? "",
    imageKeys: listing.photos.map((photo) => photo.imageKey),
  };
}

const orNull = (value: string) => (value.trim() === "" ? null : value.trim());
const numberOrNull = (value: string) => toNumber(value.replace(/^-$/, ""));

function autoFields(values: ListingFormValues) {
  const auto = values.pricingMode === "AUTO_MEDIAN";
  return {
    autoPriceOffsetPercent: auto
      ? (numberOrNull(values.autoPriceOffsetPercent) ?? 0)
      : null,
    autoPriceFloor: auto ? numberOrNull(values.autoPriceFloor) : null,
    autoPriceCeiling: auto ? numberOrNull(values.autoPriceCeiling) : null,
  };
}

/** หลังผ่าน schema แล้ว — ช่องที่บังคับมีค่าแน่นอน */
export function toCreatePayload(
  values: ListingFormValues,
): CreateListingPayload {
  return {
    catalogVariantId: values.catalogVariantId as number,
    condition: values.condition as NonNullable<ListingFormValues["condition"]>,
    gradingCompany: orNull(values.gradingCompany),
    gradeValue: numberOrNull(values.gradeValue),
    price: toNumber(values.price) as number,
    pricingMode: values.pricingMode,
    ...autoFields(values),
    lotLabel: orNull(values.lotLabel),
    publicNote: orNull(values.publicNote),
    imageKeys: values.imageKeys,
  };
}

export function toUnitsPayload(values: ListingFormValues): NewUnitsPayload {
  return {
    quantity: toNumber(values.quantity) as number,
    unitCost: toNumber(values.unitCost) as number,
  };
}

export function toDetailsPayload(
  values: ListingFormValues,
): ListingDetailsPayload {
  return {
    gradingCompany: orNull(values.gradingCompany),
    gradeValue: numberOrNull(values.gradeValue),
    lotLabel: orNull(values.lotLabel),
    publicNote: orNull(values.publicNote),
    imageKeys: values.imageKeys,
  };
}

/**
 * `PATCH .../price` เขียนทับทั้งชุด — ฟิลด์ auto ที่ไม่ส่งถูกล้าง จึงส่งครบทุกครั้ง
 * (AUTO_MEDIAN ส่งราคาที่เห็นในช่องไปด้วย ซึ่งคือราคาปัจจุบันถ้าไม่ได้แก้)
 */
export function toPricePayload(values: ListingFormValues): ListingPricePayload {
  const auto = autoFields(values);
  return {
    pricingMode: values.pricingMode,
    price: toNumber(values.price) as number,
    ...(values.pricingMode === "AUTO_MEDIAN"
      ? {
          autoPriceOffsetPercent: auto.autoPriceOffsetPercent ?? 0,
          autoPriceFloor: auto.autoPriceFloor ?? undefined,
          autoPriceCeiling: auto.autoPriceCeiling ?? undefined,
        }
      : {}),
  };
}

/** ราคาเปลี่ยนไหม — ไม่เปลี่ยนก็ไม่ต้องยิง PATCH (ประวัติราคาจะได้ไม่มีแถวว่าง ๆ) */
export function pricingChanged(
  values: ListingFormValues,
  listing: SellerListing,
): boolean {
  const auto = autoFields(values);
  return (
    values.pricingMode !== listing.pricingMode ||
    toNumber(values.price) !== listing.price ||
    (values.pricingMode === "AUTO_MEDIAN" &&
      (auto.autoPriceOffsetPercent !== (listing.autoPriceOffsetPercent ?? 0) ||
        auto.autoPriceFloor !== listing.autoPriceFloor ||
        auto.autoPriceCeiling !== listing.autoPriceCeiling))
  );
}

/** รายละเอียดหรือรูปเปลี่ยนไหม — รวมลำดับรูป เพราะรูปแรกคือรูปหลัก */
export function detailsChanged(
  values: ListingFormValues,
  listing: SellerListing,
): boolean {
  const next = toDetailsPayload(values);
  const keys = listing.photos.map((photo) => photo.imageKey);
  return (
    next.gradingCompany !== listing.gradingCompany ||
    next.gradeValue !== listing.gradeValue ||
    next.lotLabel !== listing.lotLabel ||
    next.publicNote !== listing.publicNote ||
    next.imageKeys.length !== keys.length ||
    next.imageKeys.some((key, index) => key !== keys[index])
  );
}
