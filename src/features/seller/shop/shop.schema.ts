import { z } from 'zod';
import { translate } from "@/lib/i18n";

export const shopSettingsSchema = z.object({
  handlingDays: z.number().int().min(0).max(30),
  vacationMode: z.boolean(),
  autoAcceptOrders: z.boolean(),
});
const money = z.number().min(0).max(999999999999.99).refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.001, { error: () => translate("seller", "shop.validation.twoDecimals", "ระบุทศนิยมไม่เกิน 2 ตำแหน่ง") });
const days = z.number().int().min(0).max(32767).nullable();
export const shippingSchema = z.object({
  name: z.string().trim().min(1, { error: () => translate("seller", "shop.validation.nameRequired", "กรุณาระบุชื่อ") }).max(100),
  carrierCode: z.string().max(32).nullable(),
  baseFee: money,
  perItemFee: money,
  freeThreshold: money.refine((n) => n >= 0.01, { error: () => translate("seller", "shop.validation.minThreshold", "ยอดขั้นต่ำ 0.01 บาท") }).nullable(),
  estDaysMin: days,
  estDaysMax: days,
  active: z.boolean(),
  displayOrder: z.number().int().min(-32768).max(32767),
}).refine((v) => v.estDaysMin === null || v.estDaysMax === null || v.estDaysMin <= v.estDaysMax, { path: ['estDaysMax'], error: () => translate("seller", "shop.validation.daysOrder", "วันสูงสุดต้องไม่น้อยกว่าวันต่ำสุด") });

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "shop.validation.twoDecimals", "ns": "seller", "defaultValue": "ระบุทศนิยมไม่เกิน 2 ตำแหน่ง"}
// @tolgee-key {"key": "shop.validation.nameRequired", "ns": "seller", "defaultValue": "กรุณาระบุชื่อ"}
// @tolgee-key {"key": "shop.validation.minThreshold", "ns": "seller", "defaultValue": "ยอดขั้นต่ำ 0.01 บาท"}
// @tolgee-key {"key": "shop.validation.daysOrder", "ns": "seller", "defaultValue": "วันสูงสุดต้องไม่น้อยกว่าวันต่ำสุด"}
