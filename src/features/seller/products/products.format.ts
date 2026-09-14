import { formatBaht } from "@/features/seller/shared/seller.format";

/**
 * ตัวช่วยเรื่องตัวเลขที่ใช้ร่วมกันในหน้าลงขายสินค้าและหน้าเติมสต็อก
 */

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

/**
 * เก็บเฉพาะตัวเลข (และจุดทศนิยมไม่เกิน 2 ตำแหน่งถ้าอนุญาต) จากสิ่งที่ผู้ใช้พิมพ์/วาง
 * ตัด 0 นำหน้าทิ้ง ("007" → "7") ให้ตรงกับที่ช่องแสดง
 */
export function sanitizeNumberInput(
  value: string,
  allowDecimal: boolean,
): string {
  const stripLeadingZeros = (digits: string) => digits.replace(/^0+(?=\d)/, "");

  if (!allowDecimal) return stripLeadingZeros(value.replace(/\D/g, ""));

  const [whole, ...fraction] = value.replace(/[^\d.]/g, "").split(".");
  return fraction.length > 0
    ? `${stripLeadingZeros(whole)}.${fraction.join("").slice(0, 2)}`
    : stripLeadingZeros(whole);
}

/** "1290" → "1,290" · "1290." → "1,290." (เก็บจุดที่กำลังพิมพ์ไว้) */
export function groupThousands(value: string): string {
  if (value === "") return value;

  const [whole, fraction] = value.split(".");
  const grouped = Number(whole || "0").toLocaleString("en-US");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/** กำไรติดลบแสดงเป็น "−฿120" แทน "฿-120" */
export function formatSignedBaht(amount: number): string {
  return amount < 0 ? `−${formatBaht(-amount)}` : formatBaht(amount);
}

const bahtWithSatang = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** แสดงสตางค์เสมอ เช่น "฿1,028.00" — ใช้ตรงที่ดีไซน์ต้องการเทียบทศนิยม */
export function formatBahtWithSatang(amount: number): string {
  return `฿${bahtWithSatang.format(amount)}`;
}
