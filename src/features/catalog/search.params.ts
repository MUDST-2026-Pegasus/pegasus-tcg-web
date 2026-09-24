import type {
  CardCondition,
  CategoryDto,
  GameDto,
  ProductQuery,
  ProductSort,
} from "./catalog.types";

/**
 * ตัวกรองของหน้าค้นหาอยู่ใน URL ทั้งหมด — แชร์ลิงก์ได้ กด back ได้ และลิงก์จากหน้าแรก
 * (`?game=pokemon-tcg`, `?category=booster-boxes`, `?sort=newest`) ใช้ได้ทันที
 *
 * เกมกับหมวดหมู่อยู่ใน URL เป็น slug เพราะอ่านรู้เรื่อง แล้วค่อยแปลงเป็น id ตอนยิง API
 * ไม่มี React ในไฟล์นี้
 */

export const SEARCH_PAGE_SIZE = 20;

export const SEARCH_SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
] as const;

export type SearchSort = (typeof SEARCH_SORTS)[number]["value"];

export const SEARCH_CONDITIONS: CardCondition[] = ["NM", "LP", "MP", "HP", "DMG", "SEALED"];

export type SearchFilters = {
  q: string;
  /** slug ของเกม */
  games: string[];
  /** slug ของหมวดหมู่ */
  category: string | null;
  conditions: CardCondition[];
  /** เก็บเป็นข้อความตามที่พิมพ์ ว่าง = ไม่กรอง */
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sort: SearchSort;
  /** นับจาก 1 เหมือนที่คนเห็น — API นับจาก 0 */
  page: number;
};

const SORT_TO_API: Record<SearchSort, ProductSort> = {
  featured: "popular",
  newest: "newest",
  price_asc: "price_asc",
  price_desc: "price_desc",
  name: "name",
};

function isSort(value: string | null): value is SearchSort {
  return SEARCH_SORTS.some((sort) => sort.value === value);
}

function isCondition(value: string): value is CardCondition {
  return (SEARCH_CONDITIONS as string[]).includes(value);
}

function priceText(value: string | null): string {
  const number = Number(value);
  return value && Number.isFinite(number) && number >= 0 ? value : "";
}

export function readFilters(params: URLSearchParams): SearchFilters {
  const page = Number(params.get("page"));
  const sort = params.get("sort");
  return {
    q: params.get("q")?.trim() ?? "",
    games: params.getAll("game").filter(Boolean),
    category: params.get("category") || null,
    conditions: params.getAll("condition").filter(isCondition),
    minPrice: priceText(params.get("min")),
    maxPrice: priceText(params.get("max")),
    inStock: params.get("inStock") === "true",
    sort: isSort(sort) ? sort : "featured",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** เขียนเฉพาะค่าที่ไม่ใช่ค่าเริ่มต้น URL จะได้สั้น */
export function writeFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  filters.games.forEach((game) => params.append("game", game));
  if (filters.category) params.set("category", filters.category);
  filters.conditions.forEach((condition) => params.append("condition", condition));
  if (filters.minPrice) params.set("min", filters.minPrice);
  if (filters.maxPrice) params.set("max", filters.maxPrice);
  if (filters.inStock) params.set("inStock", "true");
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function hasActiveFilters(filters: SearchFilters): boolean {
  return (
    filters.games.length > 0 ||
    filters.category !== null ||
    filters.conditions.length > 0 ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.inStock
  );
}

/**
 * แปลงตัวกรองใน URL เป็น query ของ API
 *
 * `ready` เป็น false ระหว่างรอรายชื่อเกมหรือหมวดหมู่ที่ต้องใช้แปลง slug — ถ้ายิงไปก่อน
 * จะได้ผลที่ไม่ได้กรองโผล่มาแวบหนึ่ง slug ที่ไม่รู้จักถูกข้ามไป ไม่ใช่ทำให้หน้าพัง
 */
export function toProductQuery(
  filters: SearchFilters,
  games: GameDto[] | undefined,
  categories: CategoryDto[] | undefined,
): { query: ProductQuery; ready: boolean } {
  const ready =
    (filters.games.length === 0 || games !== undefined) &&
    (filters.category === null || categories !== undefined);

  const gameIds = (games ?? [])
    .filter((game) => filters.games.includes(game.slug))
    .map((game) => game.id);
  const category = (categories ?? []).find((c) => c.slug === filters.category);

  const min = filters.minPrice === "" ? undefined : Number(filters.minPrice);
  const max = filters.maxPrice === "" ? undefined : Number(filters.maxPrice);

  return {
    ready,
    query: {
      q: filters.q || undefined,
      gameId: gameIds.length ? gameIds : undefined,
      categoryId: category?.id,
      condition: filters.conditions.length ? filters.conditions : undefined,
      minPrice: min,
      maxPrice: max,
      inStock: filters.inStock || undefined,
      sort: SORT_TO_API[filters.sort],
      page: filters.page - 1,
      size: SEARCH_PAGE_SIZE,
    },
  };
}

/** เลขหน้าที่จะโชว์ใน pagination: หน้าแรก หน้าสุดท้าย และรอบ ๆ หน้าปัจจุบัน — null = ช่อง … */
export function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push(null);
    }
    result.push(page);
  });
  return result;
}
