import { api } from "@/lib/api";
import type { PageResponse } from "@/lib/api";

import type { CatalogCategory } from "./catalog.types";
import type {
  AdminPromotion,
  AdminPromotionInput,
  AdminPromotionPage,
  AdminPromotionQuery,
  AdminPromotionSummary,
  PromotionRedemption,
} from "./promotions.types";

/**
 * หน้า "โปรโมชั่น & โค้ดส่วนลด" — ฟังก์ชันเปล่า ๆ หนึ่งตัวต่อหนึ่ง endpoint
 * แก้/ลบได้เฉพาะโค้ด Pegasus โค้ดร้านแอดมินทำได้แค่หยุดและเปิดใช้อีกครั้ง
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `promotions.queries.ts`
 */

const ROOT = "/admin/promotions";

export function getPromotions(query: AdminPromotionQuery) {
  return api.get<AdminPromotionPage>(ROOT, { query });
}

export function getPromotionSummary() {
  return api.get<AdminPromotionSummary>(`${ROOT}/summary`);
}

export function getPromotion(id: number) {
  return api.get<AdminPromotion>(`${ROOT}/${id}`);
}

export function createPromotion(input: AdminPromotionInput) {
  return api.post<AdminPromotion>(ROOT, input);
}

export function updatePromotion(id: number, input: AdminPromotionInput) {
  return api.put<AdminPromotion>(`${ROOT}/${id}`, input);
}

/** ได้ `PROMO_IN_USE` ถ้ามีคนเก็บหรือใช้โค้ดแล้ว */
export function deletePromotion(id: number) {
  return api.delete<void>(`${ROOT}/${id}`);
}

/** โค้ดร้านต้องมีเหตุผลเสมอ เพราะร้านจะเห็นเหตุผลนั้น */
export function pausePromotion(id: number, reason: string | null, notifySeller: boolean) {
  return api.post<AdminPromotion>(`${ROOT}/${id}/pause`, { reason, notifySeller });
}

export function resumePromotion(id: number, notifySeller: boolean) {
  return api.post<AdminPromotion>(`${ROOT}/${id}/resume`, { notifySeller });
}

/** แทนแถบโค้ดบนหน้าแรกทั้งแถบในครั้งเดียว — ไม่เกิน 8 ใบ เรียงตามลำดับที่ส่ง */
export function setHomeOrder(promotionIds: number[]) {
  return api.put<AdminPromotion[]>(`${ROOT}/home-order`, { promotionIds });
}

export function getRedemptions(id: number, page: number, size: number) {
  return api.get<PageResponse<PromotionRedemption>>(`${ROOT}/${id}/redemptions`, {
    query: { page, size },
  });
}

/** backend ไม่มีรายการโค้ดที่ขึ้นหน้าแรกได้ จึงดึงโค้ด Pegasus ทุกหน้ามาเอง */
export async function getAllPlatformPromotions(): Promise<AdminPromotion[]> {
  const size = 100;
  const first = await getPromotions({ owner: "PLATFORM", page: 0, size });
  const items = [...first.page.items];
  for (let page = 1; page < first.page.totalPages; page++) {
    const next = await getPromotions({ owner: "PLATFORM", page, size });
    items.push(...next.page.items);
  }
  return items;
}

/** หมวดของทุกเกมและหมวดข้ามเกม รวมที่ปิดอยู่ — เลือกเป็นขอบเขตของโค้ด และแปลง id เป็นชื่อในตาราง */
export function getPromotionCategories() {
  return api.get<CatalogCategory[]>("/admin/categories", { query: { includeInactive: true } });
}
