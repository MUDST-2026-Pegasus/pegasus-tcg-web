import { formatBaht } from '../shared/seller.format';
export function extraFeeLabel(fee: number) { return fee > 0 ? `+ ${formatBaht(fee)} ต่อใบถัดไป` : 'ไม่คิดเพิ่มต่อใบ'; }
export function shippingDays(min: number | null, max: number | null) {
  if (min === null && max === null) return '—';
  if (min === null) return `ไม่เกิน ${max} วัน`;
  if (max === null) return `ตั้งแต่ ${min} วัน`;
  return min === max ? `${min} วัน` : `${min}–${max} วัน`;
}
export function maskAccount(account: string) { const clean = account.replace(/\s|-/g, ''); return clean.length > 4 ? `${'•'.repeat(clean.length - 4)}${clean.slice(-4)}` : '••••'; }
