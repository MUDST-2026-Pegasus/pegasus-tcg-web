import { z } from "zod";

import { useTranslate } from "@/lib/i18n";

import type { Address, AddressPayload } from "./address.types";

/**
 * ตั้งให้ตรงกับ Bean Validation ใน `dto/AddressRequest.java`
 * ถ้าฝั่งโน้นแก้กติกา ต้องตามมาแก้ที่นี่ ไม่งั้นฟอร์มจะปล่อยผ่านแล้วไปตกที่ backend
 */

/** schema ที่ข้อความ validation ตามภาษาปัจจุบัน — hook เพื่อให้ tolgee CLI extract key จาก t() ได้ */
export function useAddressSchema() {
  const { t } = useTranslate("buyer");

  /** ช่องที่ backend ปล่อยว่างได้ — ส่งเป็น `null` ไม่ใช่สตริงว่าง */
  const optional = (max: number, field: string) =>
    z.string().trim().max(max, t("account.address.validation.max", "{field} ต้องไม่เกิน {max} ตัวอักษร", { field, max }));

  const required = (max: number, field: string) =>
    z
      .string()
      .trim()
      .min(1, t("account.address.validation.required", "กรุณากรอก{field}", { field }))
      .max(max, t("account.address.validation.max", "{field} ต้องไม่เกิน {max} ตัวอักษร", { field, max }));

  return z.object({
    label: optional(50, t("account.address.field.label", "ชื่อที่อยู่")),
    recipientName: required(150, t("account.address.field.recipientName", "ชื่อผู้รับ")),
    phone: required(20, t("account.address.field.phone", "เบอร์โทรศัพท์")).regex(
      /^[0-9+()\-\s]+$/,
      t("account.address.validation.phone", "กรอกเบอร์โทรศัพท์ให้ถูกต้อง"),
    ),
    line1: required(255, t("account.address.field.line1", "ที่อยู่บรรทัดที่ 1")),
    line2: optional(255, t("account.address.field.line2", "ที่อยู่บรรทัดที่ 2")),
    subdistrict: optional(100, t("account.address.field.subdistrict", "ตำบล / แขวง")),
    district: optional(100, t("account.address.field.district", "อำเภอ / เขต")),
    province: required(100, t("account.address.field.province", "จังหวัด")),
    postalCode: required(10, t("account.address.field.postalCode", "รหัสไปรษณีย์")).regex(
      /^[0-9]{5}$/,
      t("account.address.validation.postalCode", "รหัสไปรษณีย์ต้องมี 5 หลัก"),
    ),
    /** ในหน้านี้ "default" หมายถึงที่อยู่จัดส่งหลัก ส่วน billing ไม่ได้ให้ผู้ใช้เลือก */
    defaultShipping: z.boolean(),
  });
}

export type AddressFormValues = z.infer<ReturnType<typeof useAddressSchema>>;

export const EMPTY_ADDRESS_FORM: AddressFormValues = {
  label: "",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  subdistrict: "",
  district: "",
  province: "",
  postalCode: "",
  defaultShipping: false,
};

/** ที่อยู่ที่มีอยู่แล้ว → ค่าตั้งต้นของฟอร์มตอนกดแก้ไข */
export function toAddressForm(address: Address): AddressFormValues {
  return {
    label: address.label ?? "",
    recipientName: address.recipientName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    subdistrict: address.subdistrict ?? "",
    district: address.district ?? "",
    province: address.province,
    postalCode: address.postalCode,
    defaultShipping: address.defaultShipping,
  };
}

const blankToNull = (value: string) => (value === "" ? null : value);

/**
 * ค่าจากฟอร์ม → body ที่ `POST`/`PUT` รับ
 *
 * `billing` กับ `countryCode` ไม่ได้อยู่ในฟอร์ม แต่ `PUT` เขียนทับทั้งก้อน
 * จึงต้องพาค่าเดิมของที่อยู่นั้นไปด้วย ไม่งั้นโดนล้างทิ้งตอนแก้ไข
 */
export function toAddressPayload(
  values: AddressFormValues,
  current?: Address,
): AddressPayload {
  return {
    label: blankToNull(values.label),
    recipientName: values.recipientName,
    phone: values.phone,
    line1: values.line1,
    line2: blankToNull(values.line2),
    subdistrict: blankToNull(values.subdistrict),
    district: blankToNull(values.district),
    province: values.province,
    postalCode: values.postalCode,
    countryCode: current?.countryCode || "TH",
    defaultShipping: values.defaultShipping,
    defaultBilling: current?.defaultBilling ?? false,
  };
}
