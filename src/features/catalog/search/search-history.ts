/**
 * ประวัติของช่องค้นหาที่อยู่ในเครื่องผู้ใช้ [TCG-776]
 * - คำค้นล่าสุด `pegasus.search.recent` — สูงสุด 8 คำ ไม่ซ้ำ (ไม่สนตัวพิมพ์) ล่าสุดก่อน
 * - สินค้าที่เปิดดูล่าสุด `pegasus.search.viewed` — สูงสุด 4 ชิ้น
 *
 * localStorage อาจใช้ไม่ได้ (โหมด private / ถูกบล็อก) ทุกการอ่านเขียนจึงครอบ try/catch
 * แล้วถือว่าว่างเปล่า — ช่องค้นหายังใช้ได้ แค่จำอะไรไม่ได้
 *
 * ไม่มี React ในไฟล์นี้ — component ใช้ผ่าน `useSearchHistory`
 */

export const RECENT_SEARCHES_KEY = "pegasus.search.recent";
export const RECENT_SEARCHES_MAX = 8;
export const VIEWED_PRODUCTS_KEY = "pegasus.search.viewed";
export const VIEWED_PRODUCTS_MAX = 4;

export type ViewedProduct = {
  slug: string;
  name: string;
  /** บรรทัดรอง เช่น "151 · 199/165 · Pokémon" */
  subtitle: string | null;
  imageUrl: string | null;
  lowestPrice: number | null;
  sellerCount: number | null;
};

const listeners = new Set<() => void>();

export function subscribeSearchHistory(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

function read(key: string): unknown[] {
  try {
    const raw = window.localStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown[]) {
  try {
    if (value.length === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // เต็มหรือถูกบล็อก — ไม่จำก็ไม่เป็นไร
  }
  emit();
}

const same = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

export function readRecentSearches(): string[] {
  return read(RECENT_SEARCHES_KEY)
    .filter((item): item is string => typeof item === "string" && item.trim() !== "")
    .slice(0, RECENT_SEARCHES_MAX);
}

export function addRecentSearch(query: string) {
  const term = query.trim();
  if (!term) return;
  write(
    RECENT_SEARCHES_KEY,
    [term, ...readRecentSearches().filter((item) => !same(item, term))].slice(0, RECENT_SEARCHES_MAX),
  );
}

export function removeRecentSearch(query: string) {
  write(
    RECENT_SEARCHES_KEY,
    readRecentSearches().filter((item) => !same(item, query)),
  );
}

export function clearRecentSearches() {
  write(RECENT_SEARCHES_KEY, []);
}

function isViewedProduct(value: unknown): value is ViewedProduct {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.slug === "string" && typeof item.name === "string";
}

export function readViewedProducts(): ViewedProduct[] {
  return read(VIEWED_PRODUCTS_KEY).filter(isViewedProduct).slice(0, VIEWED_PRODUCTS_MAX);
}

export function addViewedProduct(product: ViewedProduct) {
  write(
    VIEWED_PRODUCTS_KEY,
    [product, ...readViewedProducts().filter((item) => item.slug !== product.slug)].slice(
      0,
      VIEWED_PRODUCTS_MAX,
    ),
  );
}
