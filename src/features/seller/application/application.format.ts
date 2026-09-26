import { addBusinessDays, format } from "date-fns";
import { th } from "date-fns/locale";

/** locale ไทยของ date-fns ยังพิมพ์ปี ค.ศ. ต้องบวกเป็น พ.ศ. เอง */
function buddhistYear(date: Date): number {
  return date.getFullYear() + 543;
}

/** "14 ก.ย. 2569" */
export function formatThaiDate(value: string | Date): string {
  const date = new Date(value);
  return `${format(date, "d MMM", { locale: th })} ${buddhistYear(date)}`;
}

/** "14 ก.ย. 2569 · 10:24 น." */
export function formatThaiDateTime(value: string | Date): string {
  const date = new Date(value);
  return `${formatThaiDate(date)} · ${format(date, "HH:mm")} น.`;
}

/** ทีมงานรับปากไว้ 1 วันทำการ — ข้ามเสาร์อาทิตย์ แต่ยังไม่รู้จักวันหยุดนักขัตฤกษ์ */
export function expectedDecisionDate(submittedAt: string): Date {
  return addBusinessDays(new Date(submittedAt), 1);
}

/** "APP-2569-0842" — id ของคำขอ นำหน้าด้วยปี พ.ศ. ที่ส่ง */
export function formatApplicationNumber(id: number, submittedAt: string): string {
  const year = buddhistYear(new Date(submittedAt));
  return `APP-${year}-${String(id).padStart(4, "0")}`;
}

/** เปิดแค่ 5 หลักท้าย เลขบัญชี 10 หลักจัดกลุ่มแบบหน้าสมุดบัญชี "xxx-x-x6789-0" */
export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, "");
  const masked = [...digits]
    .map((digit, index) => (index < digits.length - 5 ? "x" : digit))
    .join("");

  if (masked.length !== 10) {
    return masked;
  }
  return `${masked.slice(0, 3)}-${masked.slice(3, 4)}-${masked.slice(4, 9)}-${masked.slice(9)}`;
}
