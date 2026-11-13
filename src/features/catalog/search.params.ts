import type {
  CardCondition,
  CategoryDto,
  GameDto,
  ProductQuery,
  ProductSort,
  ShopQuery,
} from "./catalog.types";

/**
 * ตัวกรองของหน้าค้นหาอยู่ใน URL ทั้งหมด — แชร์ลิงก์ได้ กด back ได้ และลิงก์จากหน้าแรก
 * (`?game=pokemon-tcg`, `?category=booster-boxes`, `?sort=newest`) ใช้ได้ทันที
 *
 * เกมกับหมวดหมู่อยู่ใน URL เป็น slug เพราะอ่านรู้เรื่อง แล้วค่อยแปลงเป็น id ตอนยิง API
 * ไม่มี React ในไฟล์นี้
 */

export const SEARCH_PAGE_SIZE = 24;

export const SEARCH_SORTS = ["relevance", "featured", "newest", "price_asc", "price_desc", "name"] as const;

/** ที่อยู่ในเมนู "เรียงตาม" [TCG-777] — `name` ยังอ่านจากลิงก์เก่าได้แต่ไม่อยู่ในเมนู */
export const SEARCH_SORT_MENU = ["relevance", "price_asc", "price_desc", "newest", "featured"] as const;

export const SEARCH_TABS = ["products", "shops"] as const;
export type SearchTab = (typeof SEARCH_TABS)[number];

/** คะแนนร้านขั้นต่ำในแท็บร้านค้า — null = ทั้งหมด */
export const SHOP_RATINGS = ["4.5", "4"] as const;
export type ShopRating = (typeof SHOP_RATINGS)[number];

export const SHOP_PAGE_SIZE = 10;

export const SEARCH_VIEWS = ["grid", "list"] as const;
export type SearchView = (typeof SEARCH_VIEWS)[number];

/** chip ราคาเร็วใต้ช่อง min–max */
export const PRICE_PRESETS: { min: string; max: string }[] = [
  { min: "", max: "500" },
  { min: "500", max: "2000" },
  { min: "2000", max: "10000" },
  { min: "10000", max: "" },
];

export type SearchSort = (typeof SEARCH_SORTS)[number];

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
  /** เฉพาะสินค้าที่กำลังลดราคา */
  onSale: boolean;
  sort: SearchSort;
  /** null = ไม่ได้ระบุใน URL ใช้ค่าที่ผู้ใช้เลือกล่าสุด (localStorage) */
  view: SearchView | null;
  /** แท็บผลการค้นหา [TCG-778] */
  tab: SearchTab;
  /** แท็บร้านค้า: คะแนนร้านขั้นต่ำ */
  minRating: ShopRating | null;
  /** แท็บร้านค้า: เรียงตามจำนวนสินค้าที่ตรง (ค่าเริ่มต้น) หรือคะแนน */
  shopSort: "MATCHES" | "RATING";
  /** นับจาก 1 เหมือนที่คนเห็น — API นับจาก 0 */
  page: number;
};

const SORT_TO_API: Record<SearchSort, ProductSort> = {
  relevance: "relevance",
  featured: "popular",
  newest: "newest",
  price_asc: "price_asc",
  price_desc: "price_desc",
  name: "name",
};

function isSort(value: string | null): value is SearchSort {
  return SEARCH_SORTS.some((sort) => sort === value);
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
  const q = params.get("q")?.trim() ?? "";
  let minPrice = priceText(params.get("min"));
  let maxPrice = priceText(params.get("max"));
  // ลิงก์ที่แก้มือหรือแชร์มาผิด (?min=500&max=100) — backend ตอบ VALIDATION_FAILED
  // ซึ่งกดลองใหม่กี่ครั้งก็ไม่ผ่าน ทิ้งช่วงราคาไปดีกว่าให้หน้าพัง
  if (minPrice !== "" && maxPrice !== "" && Number(minPrice) > Number(maxPrice)) {
    minPrice = "";
    maxPrice = "";
  }
  return {
    q,
    games: params.getAll("game").filter(Boolean),
    category: params.get("category") || null,
    conditions: params.getAll("condition").filter(isCondition),
    minPrice,
    maxPrice,
    inStock: params.get("inStock") === "true",
    onSale: params.get("onSale") === "true",
    view: (SEARCH_VIEWS as readonly string[]).includes(params.get("view") ?? "")
      ? (params.get("view") as SearchView)
      : null,
    tab: params.get("tab") === "shops" ? "shops" : "products",
    minRating: (SHOP_RATINGS as readonly string[]).includes(params.get("rating") ?? "")
      ? (params.get("rating") as ShopRating)
      : null,
    shopSort: params.get("shopSort") === "RATING" ? "RATING" : "MATCHES",
    sort: isSort(sort) ? sort : q ? "relevance" : "featured",
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
  if (filters.onSale) params.set("onSale", "true");
  if (filters.sort !== (filters.q ? "relevance" : "featured")) params.set("sort", filters.sort);
  if (filters.view) params.set("view", filters.view);
  if (filters.tab !== "products") params.set("tab", filters.tab);
  if (filters.minRating) params.set("rating", filters.minRating);
  if (filters.shopSort !== "MATCHES") params.set("shopSort", filters.shopSort);
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
    filters.inStock ||
    filters.onSale
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
      onSale: filters.onSale || undefined,
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

/** ตัวกรองว่าง (คง q / sort / view เดิม) — ปุ่ม "ล้างทั้งหมด" */
export function clearedFilters(filters: SearchFilters): SearchFilters {
  return {
    ...readFilters(new URLSearchParams()),
    q: filters.q,
    sort: filters.sort,
    view: filters.view,
    tab: filters.tab,
    shopSort: filters.shopSort,
  };
}

/**
 * สลับแท็บ — คง q และเกมไว้ (ใช้ได้ทั้งสองแท็บ) กลับหน้า 1 [TCG-778]
 * ตัวกรองเฉพาะแท็บสินค้ายังอยู่ใน URL กลับมาแท็บสินค้าแล้วได้สถานะเดิม
 */
export function switchTab(filters: SearchFilters, tab: SearchTab): SearchFilters {
  return { ...filters, tab, page: 1 };
}

/** แปลงตัวกรองใน URL เป็น query ของ `/catalog/shops` */
export function toShopQuery(filters: SearchFilters, games: GameDto[] | undefined): { query: ShopQuery; ready: boolean } {
  const gameIds = (games ?? []).filter((game) => filters.games.includes(game.slug)).map((game) => game.id);
  return {
    ready: filters.games.length === 0 || games !== undefined,
    query: {
      q: filters.q || undefined,
      gameId: gameIds.length ? gameIds : undefined,
      minRating: filters.minRating ? Number(filters.minRating) : undefined,
      sort: filters.shopSort,
      page: filters.page - 1,
      size: SHOP_PAGE_SIZE,
    },
  };
}

const VIEW_KEY = "pegasus.search.view";

/** มุมมองที่ผู้ใช้เลือกล่าสุด — ครอบ try/catch โหมด private ใช้ grid */
export function readViewPreference(): SearchView {
  try {
    return window.localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

export function saveViewPreference(view: SearchView) {
  try {
    window.localStorage.setItem(VIEW_KEY, view);
  } catch {
    // จำไม่ได้ก็ไม่เป็นไร URL ยังมี ?view=
  }
}
