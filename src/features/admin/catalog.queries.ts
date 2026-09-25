import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as catalogApi from "./catalog.api";
import type {
  AdminProductQuery,
  ImagePayload,
  ProductDetail,
  ProductPayload,
  VariantPayload,
} from "./catalog.types";

/**
 * query key ต้องรวมทุกค่าที่ทำให้ผลต่างกัน — ผลค้นหาจึงใส่ทั้ง query ลงไป
 *
 * `products()` ครอบทั้งผลค้นหาและตัวนับจำนวนต่อเกม สร้าง/แก้สินค้า แก้ variant
 * หรือเปลี่ยนรูปแล้วล้างที่ระดับนี้ทีเดียว (การ์ดในตารางโชว์รูปหลักกับจำนวน variant)
 * ส่วน `detail(id)` คือก้อนที่ฟอร์มแก้ไขอ่าน
 */
export const adminCatalogKeys = {
  all: ["admin-catalog"] as const,
  games: () => [...adminCatalogKeys.all, "games"] as const,
  attributes: (gameId: number) =>
    [...adminCatalogKeys.all, "attributes", gameId] as const,
  cardSets: (gameId: number) =>
    [...adminCatalogKeys.all, "card-sets", gameId] as const,
  categories: (gameId: number) =>
    [...adminCatalogKeys.all, "categories", gameId] as const,
  products: () => [...adminCatalogKeys.all, "products"] as const,
  productList: (query: AdminProductQuery) =>
    [...adminCatalogKeys.products(), "list", query] as const,
  productCount: (gameId: number | null) =>
    [...adminCatalogKeys.products(), "count", gameId] as const,
  detail: (productId: number) =>
    [...adminCatalogKeys.all, "detail", productId] as const,
};

/** เกม ชุด หมวด และช่องของเกมแทบไม่เปลี่ยนระหว่างใช้หน้า — ไม่ต้องดึงใหม่บ่อย */
const TAXONOMY_STALE_MS = 5 * 60_000;

export function useAdminGames() {
  return useQuery({
    queryKey: adminCatalogKeys.games(),
    queryFn: catalogApi.getGames,
    staleTime: TAXONOMY_STALE_MS,
  });
}

/** ช่อง attribute ของเกม — ฟอร์มสินค้าวาดช่องตามนี้ `null` = ยังไม่ได้เลือกเกม */
export function useGameAttributes(gameId: number | null) {
  return useQuery({
    queryKey: adminCatalogKeys.attributes(gameId ?? 0),
    queryFn: () => catalogApi.getGameAttributes(gameId as number),
    enabled: gameId !== null,
    staleTime: TAXONOMY_STALE_MS,
  });
}

export function useCardSets(gameId: number | null) {
  return useQuery({
    queryKey: adminCatalogKeys.cardSets(gameId ?? 0),
    queryFn: () => catalogApi.getCardSets(gameId as number),
    enabled: gameId !== null,
    staleTime: TAXONOMY_STALE_MS,
  });
}

export function useCategories(gameId: number | null) {
  return useQuery({
    queryKey: adminCatalogKeys.categories(gameId ?? 0),
    queryFn: () => catalogApi.getCategories(gameId as number),
    enabled: gameId !== null,
    staleTime: TAXONOMY_STALE_MS,
  });
}

/**
 * หนึ่งหน้าผลค้นหา — เปลี่ยนหน้า/ตัวกรองแล้วยังโชว์ผลเดิมจนชุดใหม่มา (`isPlaceholderData`)
 * ภาพไม่กระพริบเป็นโครงว่าง
 *
 * @param enabled false ระหว่างรอรายชื่อเกม (หน้าเลือกเกมแรกให้เองเมื่อ URL ไม่ได้ระบุ)
 */
export function useAdminProducts(query: AdminProductQuery, enabled = true) {
  return useQuery({
    queryKey: adminCatalogKeys.productList(query),
    queryFn: () => catalogApi.getProducts(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export type CatalogCounts = {
  /** จำนวนสินค้าต่อเกม (`gameId` → จำนวน) รวมที่ปิดใช้งาน */
  byGame: Record<number, number>;
  /** ทุกเกมรวมกัน */
  total: number | undefined;
  isPending: boolean;
};

/**
 * ตัวเลขข้างชื่อเกมกับกล่องสรุป — backend ไม่มี endpoint นับ จึงยิง `size=1`
 * ต่อเกมแล้วอ่านแค่ `totalItems` (เกมมีไม่กี่เกม)
 */
export function useCatalogCounts(gameIds: number[]): CatalogCounts {
  const scopes: (number | null)[] = [null, ...gameIds];

  return useQueries({
    queries: scopes.map((gameId) => ({
      queryKey: adminCatalogKeys.productCount(gameId),
      queryFn: () =>
        catalogApi.getProducts({
          gameId: gameId ?? undefined,
          page: 0,
          size: 1,
        }),
      select: (page: { totalItems: number }) => page.totalItems,
    })),
    combine: (results) => {
      const byGame: Record<number, number> = {};
      gameIds.forEach((gameId, index) => {
        const count = results[index + 1].data;
        if (count !== undefined) {
          byGame[gameId] = count;
        }
      });
      return {
        byGame,
        total: results[0].data,
        isPending: results.some((result) => result.isPending),
      };
    },
  });
}

/** สินค้าหนึ่งตัวพร้อม variant และรูป — ฟอร์มแก้ไขอ่านจากที่นี่ */
export function useAdminProduct(productId: number) {
  return useQuery({
    queryKey: adminCatalogKeys.detail(productId),
    queryFn: () => catalogApi.getProduct(productId),
  });
}

// ---------- เขียน ----------

/**
 * หลังเขียนอะไรก็ตาม ล้างผลค้นหา/ตัวนับ และก้อน detail ของสินค้านั้น
 * รูปใน detail เป็น URL ที่เซ็นใหม่ทุกครั้ง จึงดึงใหม่ทั้งก้อนแทนการแก้ cache เอง
 */
function useInvalidateProduct() {
  const queryClient = useQueryClient();
  return (productId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminCatalogKeys.products() }),
      queryClient.invalidateQueries({
        queryKey: adminCatalogKeys.detail(productId),
      }),
    ]);
}

export function useCreateProduct() {
  const invalidate = useInvalidateProduct();
  return useMutation({
    mutationFn: (payload: ProductPayload) => catalogApi.createProduct(payload),
    onSuccess: (product) => invalidate(product.id),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateProduct();
  return useMutation({
    mutationFn: (input: { productId: number; payload: ProductPayload }) =>
      catalogApi.updateProduct(input.productId, input.payload),
    onSuccess: (product) => {
      // ฟอร์มเห็นค่าใหม่ทันที ไม่ต้องรอ refetch
      queryClient.setQueryData<ProductDetail>(
        adminCatalogKeys.detail(product.id),
        (detail) => (detail ? { ...detail, product } : detail),
      );
      return invalidate(product.id);
    },
  });
}

/** `variantId: null` = เพิ่มใหม่ — body หน้าตาเดียวกันทั้ง POST และ PUT */
export function useSaveVariant(productId: number) {
  const invalidate = useInvalidateProduct();
  return useMutation({
    mutationFn: (input: { variantId: number | null; payload: VariantPayload }) =>
      input.variantId === null
        ? catalogApi.createVariant(productId, input.payload)
        : catalogApi.updateVariant(productId, input.variantId, input.payload),
    onSuccess: () => invalidate(productId),
  });
}

export function useAddImage(productId: number) {
  const invalidate = useInvalidateProduct();
  return useMutation({
    mutationFn: (payload: ImagePayload) =>
      catalogApi.addImage(productId, payload),
    onSettled: () => invalidate(productId),
  });
}

export function useSetPrimaryImage(productId: number) {
  const invalidate = useInvalidateProduct();
  return useMutation({
    mutationFn: (imageId: number) =>
      catalogApi.setPrimaryImage(productId, imageId),
    onSettled: () => invalidate(productId),
  });
}

/** `onSettled` — ลบพลาดเพราะรูปหายไปแล้ว (`IMAGE_NOT_FOUND`) ก็ต้องดึงใหม่ให้หายจากจอ */
export function useDeleteImage(productId: number) {
  const invalidate = useInvalidateProduct();
  return useMutation({
    mutationFn: (imageId: number) => catalogApi.deleteImage(productId, imageId),
    onSettled: () => invalidate(productId),
  });
}
