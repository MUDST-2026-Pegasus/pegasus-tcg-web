import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as catalogApi from "./catalog.api";
import { adminCatalogKeys } from "./catalog.queries";
import type { GameAttribute } from "./catalog.types";
import * as taxonomyApi from "./taxonomy.api";
import type {
  AttributePayload,
  CardSetPayload,
  CategoryPayload,
  GamePayload,
} from "./taxonomy.types";

/**
 * hook ของหน้า "เกมและคุณสมบัติการ์ด" — ตัวอ่านเกม/ฟิลด์/ชุด/หมวดใช้ของ `catalog.queries.ts`
 * (key ชุดเดียวกัน) เขียนที่นี่แล้วหน้าแคตตาล็อกกับฟอร์มเพิ่มการ์ดเห็นค่าใหม่ทันที
 */
export const taxonomyKeys = {
  /** รูปหมวดที่เซ็นแล้วจากตัว public — อยู่ใต้ `admin-catalog` จะได้ล้างไปพร้อมกัน */
  categoryImages: (gameId: number) =>
    [...adminCatalogKeys.all, "category-images", gameId] as const,
  /** อยู่ใต้ `products()` เพราะเพิ่ม/ย้ายการ์ดในหน้าแคตตาล็อกแล้วตัวเลขต้องเปลี่ยน */
  cardSetUsage: (cardSetId: number) =>
    [...adminCatalogKeys.products(), "card-set-usage", cardSetId] as const,
};

/** signed URL ของรูปอายุสั้น — ดึงใหม่ก่อนหมดอายุ */
const IMAGE_STALE_MS = 4 * 60_000;

/** จำนวนฟิลด์ของทุกเกม (`gameId` → จำนวน) ใช้ cache ก้อนเดียวกับตาราง schema */
export function useAttributeCounts(gameIds: number[]): Record<number, number> {
  return useQueries({
    queries: gameIds.map((gameId) => ({
      queryKey: adminCatalogKeys.attributes(gameId),
      queryFn: () => catalogApi.getGameAttributes(gameId),
      staleTime: 5 * 60_000,
    })),
    combine: (results) => {
      const counts: Record<number, number> = {};
      gameIds.forEach((gameId, index) => {
        const attributes = results[index].data;
        if (attributes) {
          counts[gameId] = attributes.length;
        }
      });
      return counts;
    },
  });
}

/**
 * จำนวนการ์ดในแคตตาล็อกที่อยู่ในชุดนี้ (รวมที่ปิดแล้ว) — backend ไม่มี endpoint นับ
 * จึงยิง `size=1` แล้วอ่าน `totalItems` เปิดเฉพาะตอนถามก่อนลบ
 */
export function useCardSetUsage(gameId: number, cardSetId: number | null) {
  return useQuery({
    queryKey: taxonomyKeys.cardSetUsage(cardSetId ?? 0),
    queryFn: () =>
      catalogApi.getProducts({
        gameId,
        cardSetId: cardSetId as number,
        page: 0,
        size: 1,
      }),
    select: (page) => page.totalItems,
    enabled: cardSetId !== null,
  });
}

/** `categoryId` → URL รูปที่เปิดได้ (เฉพาะหมวดที่เปิดใช้งานและมีรูป) */
export function useCategoryImages(gameId: number) {
  return useQuery({
    queryKey: taxonomyKeys.categoryImages(gameId),
    queryFn: () => taxonomyApi.getPublicCategories(gameId),
    select: (categories) =>
      new Map(
        categories.flatMap((category) =>
          category.imageUrl ? [[category.id, category.imageUrl] as const] : [],
        ),
      ),
    staleTime: IMAGE_STALE_MS,
  });
}

// ---------- เขียน ----------

/** `gameId: null` = เพิ่มใหม่ — body หน้าตาเดียวกันทั้ง POST และ PUT */
export function useSaveGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { gameId: number | null; payload: GamePayload }) =>
      input.gameId === null
        ? taxonomyApi.createGame(input.payload)
        : taxonomyApi.updateGame(input.gameId, input.payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminCatalogKeys.games() }),
  });
}

function useInvalidateAttributes(gameId: number) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: adminCatalogKeys.attributes(gameId),
    });
}

/** `attributeId: null` = เพิ่มใหม่ */
export function useSaveAttribute(gameId: number) {
  const invalidate = useInvalidateAttributes(gameId);
  return useMutation({
    mutationFn: (input: {
      attributeId: number | null;
      payload: AttributePayload;
    }) =>
      input.attributeId === null
        ? taxonomyApi.createAttribute(gameId, input.payload)
        : taxonomyApi.updateAttribute(gameId, input.attributeId, input.payload),
    onSettled: invalidate,
  });
}

export function useDeleteAttribute(gameId: number) {
  const invalidate = useInvalidateAttributes(gameId);
  return useMutation({
    mutationFn: (attributeId: number) =>
      taxonomyApi.deleteAttribute(gameId, attributeId),
    onSettled: invalidate,
  });
}

/**
 * เรียงฟิลด์ใหม่ — backend ไม่มี endpoint เรียงทีเดียว จึง PUT ทีละแถวเฉพาะแถวที่ลำดับเปลี่ยน
 * ยิงต่อกันทีละตัว พังกลางทางก็ดึงใหม่ให้จอตรงกับที่บันทึกไปแล้วจริง
 */
export function useReorderAttributes(gameId: number) {
  const invalidate = useInvalidateAttributes(gameId);
  return useMutation({
    mutationFn: async (ordered: GameAttribute[]) => {
      for (const [index, attribute] of ordered.entries()) {
        const displayOrder = index + 1;
        if (attribute.displayOrder !== displayOrder) {
          await taxonomyApi.updateAttribute(gameId, attribute.id, {
            attrKey: attribute.attrKey,
            label: attribute.label,
            dataType: attribute.dataType,
            options: attribute.options,
            filterable: attribute.filterable,
            required: attribute.required,
            displayOrder,
          });
        }
      }
    },
    onSettled: invalidate,
  });
}

function useInvalidateCardSets(gameId: number) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: adminCatalogKeys.cardSets(gameId),
    });
}

/** `cardSetId: null` = เพิ่มใหม่ */
export function useSaveCardSet(gameId: number) {
  const invalidate = useInvalidateCardSets(gameId);
  return useMutation({
    mutationFn: (input: { cardSetId: number | null; payload: CardSetPayload }) =>
      input.cardSetId === null
        ? taxonomyApi.createCardSet(gameId, input.payload)
        : taxonomyApi.updateCardSet(input.cardSetId, input.payload),
    onSuccess: invalidate,
  });
}

/** `onSettled` — ลบพลาดเพราะชุดหายไปแล้ว (`CARD_SET_NOT_FOUND`) ก็ต้องดึงใหม่ให้หายจากจอ */
export function useDeleteCardSet(gameId: number) {
  const invalidate = useInvalidateCardSets(gameId);
  return useMutation({
    mutationFn: (cardSetId: number) => taxonomyApi.deleteCardSet(cardSetId),
    onSettled: invalidate,
  });
}

/**
 * หมวดข้ามเกมอยู่ในรายการของทุกเกม จึงล้างรายการหมวดของทุกเกม (prefix `categories`)
 * พร้อมรูปที่เซ็นแล้ว ไม่ใช่เฉพาะเกมที่เปิดอยู่
 */
export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      categoryId: number | null;
      payload: CategoryPayload;
    }) =>
      input.categoryId === null
        ? taxonomyApi.createCategory(input.payload)
        : taxonomyApi.updateCategory(input.categoryId, input.payload),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...adminCatalogKeys.all, "categories"],
        }),
        queryClient.invalidateQueries({
          queryKey: [...adminCatalogKeys.all, "category-images"],
        }),
      ]),
  });
}
