import { z } from 'zod';

export const shopSettingsSchema = z.object({
  handlingDays: z.number().int().min(0).max(30),
  vacationMode: z.boolean(),
  autoAcceptOrders: z.boolean(),
});
const money = z.number().min(0).max(999999999999.99).refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.001, 'ระบุทศนิยมไม่เกิน 2 ตำแหน่ง');
const days = z.number().int().min(0).max(32767).nullable();
export const shippingSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่อ').max(100),
  carrierCode: z.string().max(32).nullable(),
  baseFee: money,
  perItemFee: money,
  freeThreshold: money.refine((n) => n >= 0.01, 'ยอดขั้นต่ำ 0.01 บาท').nullable(),
  estDaysMin: days,
  estDaysMax: days,
  active: z.boolean(),
  displayOrder: z.number().int().min(-32768).max(32767),
}).refine((v) => v.estDaysMin === null || v.estDaysMax === null || v.estDaysMin <= v.estDaysMax, { path: ['estDaysMax'], message: 'วันสูงสุดต้องไม่น้อยกว่าวันต่ำสุด' });
