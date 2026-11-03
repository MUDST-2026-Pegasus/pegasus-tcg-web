export {
  formatBaht as money,
  formatPromoDate as thaiDate,
  formatPromoDateTime,
  formatPeriod,
  discountLabel,
  discountCapLabel,
  minSpendLabel,
  limitLabel,
} from "@/features/admin/promotions.format";

/**
 * ชื่อลูกค้าที่ร้านเห็นในการใช้โค้ด (Figma PRM-M2: "ธ***ร ส.", "P***y K.") — backend ส่งชื่อเต็มมา
 * ชื่อแรกเหลือตัวแรกกับตัวท้าย ส่วนที่เหลือเหลือแค่อักษรแรก
 */
export function maskBuyer(name: string): string {
  const [first = "", ...rest] = name.trim().split(/\s+/);
  const chars = [...first];
  const head = chars.length > 2 ? `${chars[0]}***${chars.at(-1)}` : `${chars[0] ?? ""}*`;
  return [head, ...rest.map((part) => `${[...part][0]}.`)].join(" ");
}
