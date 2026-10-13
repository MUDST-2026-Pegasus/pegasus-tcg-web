import { useSearchParams } from "react-router-dom";

import { OrdersContent } from "./components/OrdersContent";
import { sortOf, tabOf, type OrderTab, type SortChoice } from "./orders.format";

/**
 * ตัวกรองทั้งหมดอยู่ใน URL (`?status=&q=&sort=&page=`) — breadcrumb หน้ารายละเอียด
 * ลิงก์กลับมาที่แท็บเดิมได้ กด back แล้วยังอยู่ที่เดิม และแชร์ลิงก์ให้คนในร้านได้
 */
export function SellerOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = tabOf(searchParams.get("status"));
  const search = searchParams.get("q") ?? "";
  const sort = sortOf(searchParams.get("sort"));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  /** เปลี่ยนตัวกรองแล้วกลับหน้าแรกเสมอ หน้าที่ 5 ของแท็บเก่าอาจไม่มีในแท็บใหม่ */
  function update(next: { status?: OrderTab; q?: string; sort?: SortChoice; page?: number }) {
    const params = new URLSearchParams(searchParams);
    const set = (key: string, value: string | undefined) =>
      value ? params.set(key, value) : params.delete(key);

    if (next.status !== undefined) set("status", next.status);
    if (next.q !== undefined) set("q", next.q.trim());
    if (next.sort !== undefined) set("sort", next.sort === "default" ? undefined : next.sort);
    set("page", next.page && next.page > 1 ? String(next.page) : undefined);
    setSearchParams(params, { replace: true });
  }

  return (
    <OrdersContent
      tab={tab}
      search={search}
      sort={sort}
      page={page}
      onTabChange={(status) => update({ status })}
      onSearchChange={(q) => update({ q })}
      onSortChange={(next) => update({ sort: next })}
      onPageChange={(next) => {
        update({ page: next });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}
