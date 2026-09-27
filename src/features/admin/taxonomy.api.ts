import { api } from "@/lib/api";

import type {
  CardSet,
  CatalogCategory,
  Game,
  GameAttribute,
} from "./catalog.types";
import type {
  AttributePayload,
  CardSetPayload,
  CategoryPayload,
  GamePayload,
  PublicCategory,
} from "./taxonomy.types";

/**
 * เขียนเกม ฟิลด์ของการ์ด ชุดการ์ด และหมวดหมู่ — `AdminCatalogTaxonomyController.java`
 * ทุก endpoint บังคับ role ADMIN ส่วนตัวอ่านอยู่ใน `catalog.api.ts` (หน้าแคตตาล็อกใช้ร่วม)
 *
 * ลบได้แค่ฟิลด์ กับชุดการ์ดที่ยังไม่มีการ์ดอยู่ในชุด — เกมและหมวดหมู่ลบไม่ได้
 * เพราะสินค้าชี้อยู่ เลิกใช้แล้วให้ปิด `active` แทน
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `taxonomy.queries.ts`
 */

// ---------- เกม ----------

export function createGame(payload: GamePayload): Promise<Game> {
  return api.post<Game>("/admin/games", payload);
}

/** `slug` ถูกเมิน ที่เหลือเขียนทับทั้งแถว */
export function updateGame(gameId: number, payload: GamePayload): Promise<Game> {
  return api.put<Game>(`/admin/games/${gameId}`, payload);
}

// ---------- ฟิลด์ของการ์ด ----------

export function createAttribute(
  gameId: number,
  payload: AttributePayload,
): Promise<GameAttribute> {
  return api.post<GameAttribute>(`/admin/games/${gameId}/attributes`, payload);
}

/** เปลี่ยนคีย์หรือตัดตัวเลือก ENUM ไม่ย้ายค่าที่การ์ดเก็บไว้ — ค่าเดิมจะค้างอยู่ใต้คีย์เก่า */
export function updateAttribute(
  gameId: number,
  attributeId: number,
  payload: AttributePayload,
): Promise<GameAttribute> {
  return api.put<GameAttribute>(
    `/admin/games/${gameId}/attributes/${attributeId}`,
    payload,
  );
}

/** ค่าที่การ์ดเก็บไว้ใต้คีย์นี้ไม่ถูกลบ แค่ไม่มีใครอ่านอีก */
export function deleteAttribute(
  gameId: number,
  attributeId: number,
): Promise<void> {
  return api.delete<void>(`/admin/games/${gameId}/attributes/${attributeId}`);
}

// ---------- ชุดการ์ด ----------

export function createCardSet(
  gameId: number,
  payload: CardSetPayload,
): Promise<CardSet> {
  return api.post<CardSet>(`/admin/games/${gameId}/card-sets`, payload);
}

export function updateCardSet(
  cardSetId: number,
  payload: CardSetPayload,
): Promise<CardSet> {
  return api.put<CardSet>(`/admin/card-sets/${cardSetId}`, payload);
}

/** ยังมีการ์ดในแคตตาล็อกอยู่ในชุด (รวมที่ปิดแล้ว) → `CARD_SET_IN_USE` */
export function deleteCardSet(cardSetId: number): Promise<void> {
  return api.delete<void>(`/admin/card-sets/${cardSetId}`);
}

// ---------- หมวดหมู่ ----------

export function createCategory(
  payload: CategoryPayload,
): Promise<CatalogCategory> {
  return api.post<CatalogCategory>("/admin/categories", payload);
}

/** `gameId` กับ `slug` ถูกเมิน ที่เหลือเขียนทับทั้งแถว */
export function updateCategory(
  categoryId: number,
  payload: CategoryPayload,
): Promise<CatalogCategory> {
  return api.put<CatalogCategory>(`/admin/categories/${categoryId}`, payload);
}

/**
 * ตัว admin ส่งแค่ `imageKey` ไม่มี URL ที่เปิดได้ — ใช้ตัว public ที่เซ็นรูปให้
 * แทนเพื่อโชว์ตัวอย่าง (ได้เฉพาะหมวดที่เปิดใช้งาน)
 */
export function getPublicCategories(gameId: number): Promise<PublicCategory[]> {
  return api.get<PublicCategory[]>("/categories", { query: { gameId } });
}
