import type { Address } from "./address.types";

const present = (part: string | null): part is string =>
  part !== null && part.trim() !== "";

/**
 * รวมที่อยู่เป็นบรรทัดสำหรับแสดงผล ข้ามช่องที่ผู้ใช้ไม่ได้กรอก
 * ไม่งั้นจะเห็นลูกน้ำหรือช่องว่างลอยอยู่กลางการ์ด
 */
export function formatAddressLines(address: Address): string[] {
  const area = [address.subdistrict, address.district]
    .filter(present)
    .join(", ");
  const city = [address.province, address.postalCode]
    .filter(present)
    .join(" ");

  return [address.line1, address.line2, area, city].filter(present);
}
