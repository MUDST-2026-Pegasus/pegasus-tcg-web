/**
 * backend ยังไม่มี bulk endpoint สำหรับประกาศ งานหลายใบจึงยิงทีละใบ
 * แต่คุมไม่ให้ค้างพร้อมกันเกิน `limit` — ยิงทั้งหมดทีเดียวจะแย่งคอนเนกชัน DB กันเอง
 * และทุกคำขอล็อกแถวประกาศของตัวเอง
 *
 * ใบที่พลาดไม่ทำให้ใบอื่นหยุด ผลลัพธ์เรียงตรงกับ `items` แบบ `Promise.allSettled`
 */
export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      try {
        results[index] = {
          status: "fulfilled",
          value: await task(items[index]),
        };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  const workers = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workers }, worker));
  return results;
}
