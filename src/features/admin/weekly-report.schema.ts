import { z } from "zod";

/**
 * ตั้งให้ตรงกับ `StockThresholdsUpdate` ใน `WeeklyStockProfitViews.java`
 * (`lowStockThreshold` 0 ขึ้นไป ไม่เกิน 9 หลัก, `fastMovingPercent` 1-100 จำนวนเต็ม)
 * ชื่อฟิลด์ตรงกับ DTO violations ที่หลุดมาจึงแปะช่องได้เลย
 */
export const weeklyThresholdsSchema = z.object({
  lowStockThreshold: z
    .string()
    .trim()
    .regex(/^\d{1,9}$/, "ระบุจำนวนชิ้นเป็นเลขจำนวนเต็มตั้งแต่ 0 ขึ้นไป"),
  fastMovingPercent: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "ระบุเปอร์เซ็นต์เป็นเลขจำนวนเต็ม 1-100")
    .refine((value) => Number(value) >= 1 && Number(value) <= 100, "ระบุเปอร์เซ็นต์เป็นเลขจำนวนเต็ม 1-100"),
});

export type WeeklyThresholdsValues = z.infer<typeof weeklyThresholdsSchema>;
