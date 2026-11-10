import type { PageResponse } from "./types";

/** เพดาน `size` ของ backend (`Paging.MAX_SIZE`) */
export const MAX_PAGE_SIZE = 100;

/**
 * ดึงทุกหน้าของ list ที่แบ่งหน้า ไล่ตั้งแต่หน้า 0 จนครบ `totalPages` ของหน้าแรก
 * หน้าใดล้มเหลวทั้งก้อนล้มเหลวไปด้วย ฝั่งเรียกจะได้ไม่เอาข้อมูลที่ไม่ครบไปใช้
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>,
  size = MAX_PAGE_SIZE,
): Promise<T[]> {
  const first = await fetchPage(0, size);
  const items = [...first.items];
  for (let page = 1; page < first.totalPages; page++) {
    const next = await fetchPage(page, size);
    items.push(...next.items);
  }
  return items;
}
