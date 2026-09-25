import { PRODUCT_SORTS, PRODUCT_TYPES } from "./catalog.format";
import type {
  AdminProductQuery,
  ProductSort,
  ProductType,
} from "./catalog.types";

/**
 * ตัวกรองของหน้าแคตตาล็อกอยู่ใน URL ทั้งหมด (`?game=1&set=12&q=pikachu&page=2`)
 * แชร์ลิงก์หรือกด back แล้วได้หน้าเดิม และทุกอย่างกรอง/แบ่งหน้าที่ backend
 */

/** 4 คอลัมน์ × 6 แถว — หารด้วย 2 และ 3 ลงตัวด้วย จอแคบก็ไม่เหลือเศษแถวสุดท้าย */
export const CATALOG_PAGE_SIZE = 24;

export const DEFAULT_SORT: ProductSort = "newest";

export type CatalogFilters = {
  /** `null` = URL ไม่ได้ระบุ หน้าเลือกเกมแรกให้ */
  gameId: number | null;
  /** backend กรองได้ทีละชุด */
  cardSetId: number | null;
  categoryId: number | null;
  productType: ProductType | null;
  sort: ProductSort;
  /** false = รวมสินค้าที่ปิดใช้งาน (ค่าเริ่มต้นของหลังบ้าน) */
  activeOnly: boolean;
  q: string;
  /** เริ่มที่ 1 ให้คนอ่านรู้เรื่อง — backend เริ่มที่ 0 */
  page: number;
};

const PARAM = {
  game: "game",
  set: "set",
  category: "category",
  type: "type",
  sort: "sort",
  status: "status",
  q: "q",
  page: "page",
} as const;

function readId(value: string | null): number | null {
  if (value === null) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function readFilters(params: URLSearchParams): CatalogFilters {
  const type = params.get(PARAM.type);
  const sort = params.get(PARAM.sort);

  return {
    gameId: readId(params.get(PARAM.game)),
    cardSetId: readId(params.get(PARAM.set)),
    categoryId: readId(params.get(PARAM.category)),
    productType: PRODUCT_TYPES.find((value) => value === type) ?? null,
    sort: PRODUCT_SORTS.find((value) => value === sort) ?? DEFAULT_SORT,
    activeOnly: params.get(PARAM.status) === "active",
    q: params.get(PARAM.q)?.trim() ?? "",
    page: readId(params.get(PARAM.page)) ?? 1,
  };
}

export type FilterChanges = Partial<CatalogFilters>;

/**
 * เขียนตัวกรองที่เปลี่ยนลง URL โดยไม่แตะพารามิเตอร์อื่น (เช่น `product` ของหน้าต่างแก้ไข)
 *
 * - เปลี่ยนเกม = ล้างชุดกับหมวด เพราะเป็นของเกมเดิม
 * - เปลี่ยนตัวกรองอะไรก็ตาม = กลับไปหน้า 1
 */
export function writeFilters(
  current: URLSearchParams,
  changes: FilterChanges,
): URLSearchParams {
  const next = new URLSearchParams(current);
  const set = (key: string, value: string | null) => {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  };

  if (changes.gameId !== undefined) {
    set(PARAM.game, changes.gameId === null ? null : String(changes.gameId));
    next.delete(PARAM.set);
    next.delete(PARAM.category);
  }
  if (changes.cardSetId !== undefined) {
    set(PARAM.set, changes.cardSetId === null ? null : String(changes.cardSetId));
  }
  if (changes.categoryId !== undefined) {
    set(
      PARAM.category,
      changes.categoryId === null ? null : String(changes.categoryId),
    );
  }
  if (changes.productType !== undefined) {
    set(PARAM.type, changes.productType);
  }
  if (changes.sort !== undefined) {
    set(PARAM.sort, changes.sort === DEFAULT_SORT ? null : changes.sort);
  }
  if (changes.activeOnly !== undefined) {
    set(PARAM.status, changes.activeOnly ? "active" : null);
  }
  if (changes.q !== undefined) {
    set(PARAM.q, changes.q.trim());
  }

  if (changes.page !== undefined) {
    set(PARAM.page, changes.page <= 1 ? null : String(changes.page));
  } else {
    next.delete(PARAM.page);
  }

  return next;
}

/** มีตัวกรองอะไรนอกจากเกมกับการเรียงอยู่ไหม — ใช้ตัดสินข้อความตอนไม่เจออะไรเลย */
export function hasNarrowingFilters(filters: CatalogFilters): boolean {
  return (
    filters.cardSetId !== null ||
    filters.categoryId !== null ||
    filters.productType !== null ||
    filters.activeOnly ||
    filters.q !== ""
  );
}

// ---------- หน้าต่างแก้ไขสินค้า (`?product=<id>&tab=<tab>`) ----------

/** สินค้าที่หน้าต่างแก้ไขเปิดอยู่ — `"new"` = เพิ่มใหม่ */
export type ProductTarget = "new" | number;

export const PRODUCT_TABS = ["details"] as const;

export type ProductTab = (typeof PRODUCT_TABS)[number];

/** `?product=` → สินค้าที่ต้องเปิด · ไม่มีหรือพิมพ์มั่ว → `null` (ปิด) */
export function readProductTarget(params: URLSearchParams): ProductTarget | null {
  const value = params.get("product");
  return value === "new" ? "new" : readId(value);
}

export function readProductTab(params: URLSearchParams): ProductTab {
  const value = params.get("tab");
  return PRODUCT_TABS.find((tab) => tab === value) ?? "details";
}

/** เปิด/ปิดหน้าต่างแก้ไขโดยไม่แตะตัวกรองที่อยู่ข้างหลัง */
export function writeProductTarget(
  current: URLSearchParams,
  target: ProductTarget | null,
  tab: ProductTab = "details",
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (target === null) {
    next.delete("product");
    next.delete("tab");
    return next;
  }
  next.set("product", String(target));
  if (tab === "details") next.delete("tab");
  else next.set("tab", tab);
  return next;
}

export function toProductQuery(
  filters: CatalogFilters,
  gameId: number,
): AdminProductQuery {
  return {
    gameId,
    cardSetId: filters.cardSetId ?? undefined,
    categoryId: filters.categoryId ?? undefined,
    productType: filters.productType ?? undefined,
    q: filters.q || undefined,
    sort: filters.sort,
    activeOnly: filters.activeOnly || undefined,
    page: filters.page - 1,
    size: CATALOG_PAGE_SIZE,
  };
}
