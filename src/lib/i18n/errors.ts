import { useTranslate } from "@tolgee/react";
import type { TolgeeInstance } from "@tolgee/react";

import { getErrorMessage, isApiError } from "@/lib/api/errors";
import type { FieldViolation } from "@/lib/api/types";

/**
 * แปลข้อความ error จาก `code` ของ API ด้วย namespace `errors` [TCG-547]
 * ลำดับ: คำแปลของ code → `message` จาก BE → fallback ของหน้านั้น (ไม่โชว์ key ดิบ)
 *
 * เรียกได้จากทุกที่ (format / hook / component) เพราะ instance ของแอปลงทะเบียนไว้ที่นี่
 * และ namespace `errors` โหลดตั้งแต่เปิดเว็บ (I18nProvider) — สลับภาษาแล้วแอป remount จึงได้ภาษาใหม่
 */

type Params = Record<string, string | number>;

let instance: TolgeeInstance | null = null;

/** createTolgee ของแอป / instance เทสต์เรียกตอนสร้าง */
export function registerErrorTranslator(tolgee: TolgeeInstance | null) {
  instance = tolgee;
}

/** คำแปลของ key ใน `errors` — ไม่มีคำแปลคืน undefined (ไม่คืน key ดิบ) */
export function errorText(key: string, params?: Params): string | undefined {
  if (!instance) return undefined;
  try {
    const text = instance.t({ key, ns: "errors", params, orEmpty: true, noWrap: true });
    // format พัง (param ขาด) onFormatError คืน key — ถือว่าแปลไม่ได้ ให้ไปใช้ message จาก BE แทน
    return text && text !== key ? text : undefined;
  } catch {
    return undefined;
  }
}

/** ค่าตัวเลข / ข้อความจาก `details` ของ API ส่งเข้า ICU params ได้เลย */
function detailParams(details: Record<string, unknown>): Params {
  const params: Params = {};
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === "string" || (typeof value === "number" && Number.isFinite(value))) params[key] = value;
  }
  return params;
}

export function translateError(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    return errorText(error.code, detailParams(error.details)) ?? (error.message || fallback);
  }
  return getErrorMessage(error, fallback);
}

/** ข้อความรายช่อง — ใช้ `validation.<code>` เมื่อ BE ส่ง code / params มา (I18N-04) ไม่งั้นใช้ message เดิม */
export function translateViolation(violation: FieldViolation): string {
  const params = violation.params ? detailParams(violation.params) : undefined;
  return (violation.code && errorText(`validation.${violation.code}`, params)) || violation.message;
}

/** สำหรับ component ใหม่: subscribe namespace `errors` แล้วคืน translateError */
export function useErrorMessage() {
  useTranslate("errors");
  return translateError;
}

// key ที่ FE สร้างเอง (ไม่ได้มาจาก ErrorCode ของ BE) — ประกาศให้ tolgee CLI เห็น
// @tolgee-key {"key":"NETWORK_ERROR","ns":"errors","defaultValue":"เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง"}
// @tolgee-key {"key":"ABORTED","ns":"errors","defaultValue":"ยกเลิกคำขอแล้ว"}
// @tolgee-key {"key":"MALFORMED_RESPONSE","ns":"errors","defaultValue":"เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง ลองใหม่อีกครั้ง"}
// @tolgee-key {"key":"HTTP_500","ns":"errors","defaultValue":"ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้ง"}
// @tolgee-key {"key":"HTTP_502","ns":"errors","defaultValue":"ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้ง"}
// @tolgee-key {"key":"HTTP_503","ns":"errors","defaultValue":"ระบบปิดปรับปรุงชั่วคราว ลองใหม่ภายหลัง"}
// @tolgee-key {"key":"HTTP_504","ns":"errors","defaultValue":"เซิร์ฟเวอร์ตอบช้าเกินไป ลองใหม่อีกครั้ง"}
// @tolgee-key {"key": "promo.minSpendShortfall", "ns": "errors", "defaultValue": "ซื้อสินค้าเพิ่มอีก {amount} เพื่อใช้โค้ดนี้"}
// @tolgee-key {"key": "promo.wrongSellerNamed", "ns": "errors", "defaultValue": "โค้ดนี้เป็นของร้าน {seller} — ใส่ในช่อง “โค้ดร้าน” ของร้านนั้น"}
// @tolgee-key {"key": "promo.startsAt", "ns": "errors", "defaultValue": "โค้ดใช้ได้ตั้งแต่วันที่ {date}"}
// @tolgee-key {"key": "validation.NotBlank", "ns": "errors", "defaultValue": "กรุณากรอกช่องนี้"}
// @tolgee-key {"key": "validation.NotNull", "ns": "errors", "defaultValue": "กรุณากรอกช่องนี้"}
// @tolgee-key {"key": "validation.NotEmpty", "ns": "errors", "defaultValue": "กรุณากรอกช่องนี้"}
// @tolgee-key {"key": "validation.Size", "ns": "errors", "defaultValue": "ความยาวต้องอยู่ระหว่าง {min} ถึง {max} ตัวอักษร"}
// @tolgee-key {"key": "validation.Max", "ns": "errors", "defaultValue": "ต้องไม่เกิน {value}"}
// @tolgee-key {"key": "validation.Min", "ns": "errors", "defaultValue": "ต้องไม่น้อยกว่า {value}"}
// @tolgee-key {"key": "validation.Email", "ns": "errors", "defaultValue": "รูปแบบอีเมลไม่ถูกต้อง"}
// @tolgee-key {"key": "validation.Pattern", "ns": "errors", "defaultValue": "รูปแบบไม่ถูกต้อง"}
// @tolgee-key {"key": "validation.Positive", "ns": "errors", "defaultValue": "ต้องมากกว่า 0"}
// @tolgee-key {"key": "validation.PositiveOrZero", "ns": "errors", "defaultValue": "ต้องไม่ติดลบ"}
// @tolgee-key {"key": "validation.typeMismatch", "ns": "errors", "defaultValue": "รูปแบบค่าไม่ถูกต้อง"}
// @tolgee-key {"key": "validation.missingParameter", "ns": "errors", "defaultValue": "ขาดข้อมูลที่จำเป็น"}
