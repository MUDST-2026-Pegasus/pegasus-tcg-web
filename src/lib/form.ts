import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { isApiError } from "@/lib/api";

/**
 * ย้าย `violations` ไปแปะที่ช่องกรอก ส่วน error ที่ไม่มี violations ต้องบอกทางผ่าน `codeToField`
 *
 * @returns `false` แปลว่าไม่มีช่องไหนรับผิดชอบ ผู้เรียกต้องหาที่แสดงข้อความเอง
 */
export function applyApiErrors<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  options?: {
    codeToField?: Partial<Record<string, Path<TValues>>>;
    fieldMap?: Partial<Record<string, Path<TValues>>>;
  },
): boolean {
  if (!isApiError(error)) {
    return false;
  }

  let attached = false;

  for (const violation of error.violations) {
    const field = (options?.fieldMap?.[violation.field] ??
      violation.field) as Path<TValues>;
    setError(field, { type: "server", message: violation.message });
    attached = true;
  }

  const mapped = options?.codeToField?.[error.code];
  if (!attached && mapped) {
    setError(mapped, { type: "server", message: error.message });
    attached = true;
  }

  return attached;
}
