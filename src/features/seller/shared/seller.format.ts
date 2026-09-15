const bahtWhole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const bahtSatang = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * ฿1,850 เมื่อเป็นจำนวนเต็ม และ ฿92.50 เมื่อมีเศษสตางค์ — ตรงกับที่ดีไซน์ใช้
 * ใช้ทั้งหน้าจัดการคำสั่งซื้อและหน้าลงขายสินค้า
 */
export function formatBaht(amount: number): string {
  const formatter = Number.isInteger(amount) ? bahtWhole : bahtSatang;
  return `฿${formatter.format(amount)}`;
}
