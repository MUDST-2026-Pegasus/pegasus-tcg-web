/**
 * แถวที่เลือกได้ด้วยคีย์บอร์ดใน dropdown ค้นหา [TCG-776]
 *
 * panel สร้างรายการนี้ตามลำดับเดียวกับที่ render — ↑↓ จึงเลื่อนตามที่ตาเห็น
 * และ `aria-activedescendant` ชี้ id ของแถวได้ตรง ไม่มี React ในไฟล์นี้
 */

export type SearchOption = {
  id: string;
  href: string;
  /** คำที่ควรจำไว้ใน "ค้นหาล่าสุด" เมื่อเลือกแถวนี้ */
  term?: string;
};

export class SearchOptionList {
  readonly items: SearchOption[] = [];
  private readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  add(href: string, term?: string): SearchOption & { index: number } {
    const option = { id: `${this.prefix}-${this.items.length}`, href, term };
    this.items.push(option);
    return { ...option, index: this.items.length - 1 };
  }
}

/** ↑↓ วนรอบรายการ · Home/End ไปหัว/ท้าย · -1 = ยังไม่มีแถวที่ไฮไลต์ (ช่องพิมพ์) */
export function moveHighlight(current: number, count: number, key: string): number {
  if (count === 0) return -1;
  switch (key) {
    case "ArrowDown":
      return current < 0 || current >= count - 1 ? 0 : current + 1;
    case "ArrowUp":
      return current <= 0 ? count - 1 : current - 1;
    default:
      return current;
  }
}

/** ลิงก์ไปหน้า /search — เปิดจากหน้า /search คงตัวกรองเดิม (เกม/หมวดหมู่) ไว้ และกลับไปหน้า 1 */
export function searchHref(
  term: string,
  current: { pathname: string; params: URLSearchParams },
  extra: Record<string, string> = {},
): string {
  const params =
    current.pathname === "/search" && Object.keys(extra).length === 0
      ? new URLSearchParams(current.params)
      : new URLSearchParams();
  const trimmed = term.trim();
  if (trimmed) params.set("q", trimmed);
  else params.delete("q");
  params.delete("page");
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  return `/search${params.size ? `?${params}` : ""}`;
}
