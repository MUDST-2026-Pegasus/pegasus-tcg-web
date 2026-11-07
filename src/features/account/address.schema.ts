import { translate } from "@/lib/language";
import { z } from "zod";

import type { Address, AddressPayload } from "./address.types";

/**
 * ตั้งให้ตรงกับ Bean Validation ใน `dto/AddressRequest.java`
 * ถ้าฝั่งโน้นแก้กติกา ต้องตามมาแก้ที่นี่ ไม่งั้นฟอร์มจะปล่อยผ่านแล้วไปตกที่ backend
 *
 */

/** ช่องที่ backend ปล่อยว่างได้ — ส่งเป็น `null` ไม่ใช่สตริงว่าง */
const fieldLabel = (field: string) => ({
  Label: translate("ชื่อเรียกที่อยู่", "Label"),
  "Recipient name": translate("ชื่อผู้รับ", "Recipient name"),
  "Phone number": translate("หมายเลขโทรศัพท์", "Phone number"),
  "Address line 1": translate("ที่อยู่บรรทัดที่ 1", "Address line 1"),
  "Address line 2": translate("ที่อยู่บรรทัดที่ 2", "Address line 2"),
  Subdistrict: translate("ตำบล/แขวง", "Subdistrict"),
  District: translate("อำเภอ/เขต", "District"),
  Province: translate("จังหวัด", "Province"),
  "Postal code": translate("รหัสไปรษณีย์", "Postal code"),
} as Record<string, string>)[field] ?? field;

const optional = (max: number, field: string) =>
  z.string().trim().max(max, { error: () => translate(`${fieldLabel(field)}ต้องไม่เกิน ${max} ตัวอักษร`, `${field} must be at most ${max} characters`) });

const required = (max: number, field: string) =>
  z
    .string()
    .trim()
    .min(1, { error: () => translate(`กรุณากรอก${fieldLabel(field)}`, `${field} is required`) })
    .max(max, { error: () => translate(`${fieldLabel(field)}ต้องไม่เกิน ${max} ตัวอักษร`, `${field} must be at most ${max} characters`) });

export const addressSchema = z.object({
  label: optional(50, "Label"),
  recipientName: required(150, "Recipient name"),
  phone: required(20, "Phone number").regex(
    /^[0-9+()\-\s]+$/,
    { error: () => translate("กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง", "Enter a valid phone number") },
  ),
  line1: required(255, "Address line 1"),
  line2: optional(255, "Address line 2"),
  subdistrict: optional(100, "Subdistrict"),
  district: optional(100, "District"),
  province: required(100, "Province"),
  postalCode: required(10, "Postal code").regex(
    /^[0-9]{5}$/,
    { error: () => translate("รหัสไปรษณีย์ต้องมี 5 หลัก", "Postal code must be 5 digits") },
  ),
  /** ในหน้านี้ "default" หมายถึงที่อยู่จัดส่งหลัก ส่วน billing ไม่ได้ให้ผู้ใช้เลือก */
  defaultShipping: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

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
