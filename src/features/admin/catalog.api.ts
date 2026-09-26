import { api, type PageResponse } from "@/lib/api";

import type {
  AdminProductQuery,
  CardSet,
  CatalogCategory,
  CatalogImage,
  CatalogProduct,
  CatalogVariant,
  Game,
  GameAttribute,
  ImagePayload,
  ProductDetail,
  ProductPayload,
  ProductSummary,
  VariantPayload,
} from "./catalog.types";

/**
 * แคตตาล็อกกลางของแพลตฟอร์ม — `AdminCatalogProductController.java` กับ
 * `AdminCatalogTaxonomyController.java` ทุก endpoint ใต้ `/admin` บังคับ role ADMIN
 *
 * backend ไม่มีการลบสินค้าหรือ variant (ประกาศขาย คำสั่งซื้อ คอลเลกชันชี้อยู่) —
 * เลิกขายแล้วให้ปิด `active` แทน รูปเป็นข้อยกเว้นเดียวที่ลบได้
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `catalog.queries.ts`
 */

// ---------- ข้อมูลประกอบ (เกม ชุด หมวด ช่องของเกม) ----------

export function getGames(): Promise<Game[]> {
  return api.get<Game[]>("/admin/games");
}

/** ใช้ของ admin ไม่ใช่ `/games/{id}/attributes` เพราะตัว public หาเกมที่ปิดไปแล้วไม่เจอ */
export function getGameAttributes(gameId: number): Promise<GameAttribute[]> {
  return api.get<GameAttribute[]>(`/admin/games/${gameId}/attributes`);
}

/** backend ไม่มีรายการชุดฝั่ง admin — ตัว public ไม่ได้กรองเกมที่ปิด จึงใช้ได้เหมือนกัน */
export function getCardSets(gameId: number): Promise<CardSet[]> {
  return api.get<CardSet[]>("/card-sets", { query: { gameId } });
}

/** ได้ทั้งหมวดของเกมนั้นและหมวดข้ามเกม รวมที่ปิดใช้งาน (สินค้าเก่าอาจยังอยู่ในนั้น) */
export function getCategories(gameId: number): Promise<CatalogCategory[]> {
  return api.get<CatalogCategory[]>("/admin/categories", {
    query: { gameId, includeInactive: true },
  });
}

// ---------- สินค้า ----------

export function getProducts(
  query: AdminProductQuery,
): Promise<PageResponse<ProductSummary>> {
  return api.get<PageResponse<ProductSummary>>("/admin/catalog/products", {
    query,
  });
}

/** รวม variant และรูปมาในก้อนเดียว ทั้งตัวที่ปิดใช้งานแล้ว */
export function getProduct(productId: number): Promise<ProductDetail> {
  return api.get<ProductDetail>(`/admin/catalog/products/${productId}`);
}

export function createProduct(
  payload: ProductPayload,
): Promise<CatalogProduct> {
  return api.post<CatalogProduct>("/admin/catalog/products", payload);
}

/** เขียนทับทั้งแถว — `gameId` กับ `slug` ถูกเมิน ส่วนที่เหลือต้องส่งครบ */
export function updateProduct(
  productId: number,
  payload: ProductPayload,
): Promise<CatalogProduct> {
  return api.put<CatalogProduct>(
    `/admin/catalog/products/${productId}`,
    payload,
  );
}

// ---------- variant ----------

export function createVariant(
  productId: number,
  payload: VariantPayload,
): Promise<CatalogVariant> {
  return api.post<CatalogVariant>(
    `/admin/catalog/products/${productId}/variants`,
    payload,
  );
}

export function updateVariant(
  productId: number,
  variantId: number,
  payload: VariantPayload,
): Promise<CatalogVariant> {
  return api.put<CatalogVariant>(
    `/admin/catalog/products/${productId}/variants/${variantId}`,
    payload,
  );
}

// ---------- รูป ----------

/**
 * แนบไฟล์ที่อัปขึ้น storage แล้ว (presign → PUT ผ่าน `useFileUpload`)
 * backend เช็คว่าไฟล์มาถึงจริงก่อนบันทึก key ที่ไม่มีไฟล์จะได้ `FILE_NOT_FOUND`
 */
export function addImage(
  productId: number,
  payload: ImagePayload,
): Promise<CatalogImage> {
  return api.post<CatalogImage>(
    `/admin/catalog/products/${productId}/images`,
    payload,
  );
}

export function setPrimaryImage(
  productId: number,
  imageId: number,
): Promise<CatalogImage> {
  return api.put<CatalogImage>(
    `/admin/catalog/products/${productId}/images/${imageId}/primary`,
  );
}

/** ลบทั้งแถวและไฟล์ใน storage — ถ้าเป็นรูปหลัก รูปถัดไปขึ้นมาแทนเอง */
export function deleteImage(productId: number, imageId: number): Promise<void> {
  return api.delete<void>(
    `/admin/catalog/products/${productId}/images/${imageId}`,
  );
}
