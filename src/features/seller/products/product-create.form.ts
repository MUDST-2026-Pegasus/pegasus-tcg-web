import type { ListingDraft, ReadinessId } from "./product-create.types";

/** "1290" / "1290.5" → ตัวเลข · ช่องว่างหรือพิมพ์ไม่ครบ (".") → null */
export function toNumber(value: string): number | null {
  if (value === "" || value === ".") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** ปัดเป็นสตางค์ กันเลขทศนิยมลอยอย่าง 64.50000000000001 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** เก็บเฉพาะตัวเลข (และจุดทศนิยมไม่เกิน 2 ตำแหน่งถ้าอนุญาต) จากสิ่งที่ผู้ใช้พิมพ์/วาง */
export function sanitizeNumberInput(
  value: string,
  allowDecimal: boolean,
): string {
  if (!allowDecimal) return value.replace(/\D/g, "");

  const [whole, ...fraction] = value.replace(/[^\d.]/g, "").split(".");
  return fraction.length > 0
    ? `${whole}.${fraction.join("").slice(0, 2)}`
    : whole;
}

/** "1290" → "1,290" สำหรับแสดงตอนไม่ได้พิมพ์อยู่ */
export function groupThousands(value: string): string {
  if (value === "") return value;

  const [whole, fraction] = value.split(".");
  const grouped = Number(whole || "0").toLocaleString("en-US");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/** สถานะแต่ละข้อของการ์ด "พร้อมลงขายหรือยัง" */
export function getReadiness(draft: ListingDraft): Record<ReadinessId, boolean> {
  const price = toNumber(draft.price);
  const cost = toNumber(draft.cost);
  const quantity = toNumber(draft.quantity);

  return {
    // มาถึงขั้นนี้ได้แปลว่าเลือกการ์ดในขั้นแรกมาแล้ว
    card: true,
    condition: draft.condition !== null,
    pricing: price !== null && price > 0 && cost !== null,
    quantity: quantity !== null && Number.isInteger(quantity) && quantity > 0,
    // สองข้อนี้อยู่ในขั้น "รูปภาพ" กับ "ตรวจสอบ" ซึ่งยังไม่มีดีไซน์
    photos: false,
    review: false,
  };
}
