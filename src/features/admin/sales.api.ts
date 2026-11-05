import { api } from "@/lib/api";

import { getCardSets } from "./catalog.api";
import type { CardSet } from "./catalog.types";
import type {
  AdminSale,
  AdminSaleInput,
  AdminSalePage,
  AdminSaleQuery,
  AdminSaleSummary,
  SaleScopePreview,
  SaleScopePreviewInput,
  SaleSellerOption,
} from "./sales.types";
import { getAdminUsers } from "./users.api";

/**
 * แท็บ "ลดราคาสินค้า" ของหน้าโปรโมชั่น (TCG-681 · SAL-06) — ฟังก์ชันเปล่าหนึ่งตัวต่อหนึ่ง endpoint ของ SAL-02
 * แก้/ลบได้เฉพาะแคมเปญ Pegasus · การลดราคาของร้านแอดมินทำได้แค่หยุด (พร้อมเหตุผล) / เปิด / จบ
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `sales.queries.ts`
 */

const ROOT = "/admin/sales";

export function getSales(query: AdminSaleQuery) {
  return api.get<AdminSalePage>(ROOT, { query });
}

export function getSaleSummary() {
  return api.get<AdminSaleSummary>(`${ROOT}/summary`);
}

export function getSale(id: number) {
  return api.get<AdminSale>(`${ROOT}/${id}`);
}

export function createSale(input: AdminSaleInput) {
  return api.post<AdminSale>(ROOT, input);
}

/** หลังมีออเดอร์แก้ได้แค่ชื่อ วันจบ งบ (เพิ่ม) โควตา (เพิ่ม) — อื่น ๆ ได้ `SALE_INVALID` */
export function updateSale(id: number, input: AdminSaleInput) {
  return api.put<AdminSale>(`${ROOT}/${id}`, input);
}

/** มีออเดอร์แล้วได้ 409 `SALE_IN_USE` */
export function deleteSale(id: number) {
  return api.delete<void>(`${ROOT}/${id}`);
}

/** การลดราคาของร้านต้องมี `reason` เสมอ (ร้านเห็น) */
export function pauseSale(id: number, reason: string | null, notifySeller: boolean) {
  return api.post<AdminSale>(`${ROOT}/${id}/pause`, { reason, notifySeller });
}

export function resumeSale(id: number, notifySeller = false) {
  return api.post<AdminSale>(`${ROOT}/${id}/resume`, { notifySeller });
}

/** จบทันที — listing กลับราคาปกติภายใน 1 นาที ออเดอร์ที่จ่ายแล้วไม่กระทบ */
export function endSale(id: number) {
  return api.post<AdminSale>(`${ROOT}/${id}/end`);
}

/** นับ listing / ร้าน / ราคารวมก่อนลดที่เข้าเงื่อนไขตอนนี้ (การ์ด 2 ของ A2) */
export function previewScope(input: SaleScopePreviewInput) {
  return api.post<SaleScopePreview>(`${ROOT}/preview-scope`, input);
}

/** ช่อง "ยกเว้นร้าน" — ค้นจากบัญชีที่มี role SELLER */
export async function searchSellers(q: string): Promise<SaleSellerOption[]> {
  const page = await getAdminUsers({ q, role: "SELLER", page: 0, size: 8 });
  return page.items.map((user) => ({ id: user.id, username: user.username, displayName: user.displayName }));
}

/** ชุดการ์ดของหลายเกมรวมกัน — ใช้กับขอบเขต CARD_SET */
export async function getAllCardSets(gameIds: number[]): Promise<CardSet[]> {
  const lists = await Promise.all(gameIds.map((gameId) => getCardSets(gameId)));
  return lists.flat();
}
