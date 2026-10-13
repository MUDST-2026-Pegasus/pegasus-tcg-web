import { EmptyState, QueryBoundary } from "@/components/common";
import { useSellerDashboard } from "@/features/seller/dashboard/dashboard.queries";

import {
  PACKING_TIP,
  SHIPPING_STEPS,
  monthlySummary,
  ordersSubtitle,
  type OrderTabMeta,
  type SortChoice,
} from "../orders.format";
import { useSellerOrderCounts, useSellerOrders } from "../orders.queries";

import { MonthlySummaryCard } from "./MonthlySummaryCard";
import { OrderCard } from "./OrderCard";
import { OrderFilterBar } from "./OrderFilterBar";
import { OrderListSkeleton } from "./OrderListSkeleton";
import { OrderPagination } from "./OrderPagination";
import { ShippingStepsCard } from "./ShippingStepsCard";
import { TipCard } from "./TipCard";

export const ORDERS_PAGE_SIZE = 10;

type OrdersContentProps = {
  tab: OrderTabMeta;
  search: string;
  sort: SortChoice;
  /** เริ่มที่ 1 */
  page: number;
  onTabChange: (tab: OrderTabMeta["id"]) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: SortChoice) => void;
  onPageChange: (page: number) => void;
};

export function OrdersContent({
  tab,
  search,
  sort,
  page,
  onTabChange,
  onSearchChange,
  onSortChange,
  onPageChange,
}: OrdersContentProps) {
  const counts = useSellerOrderCounts();
  const dashboard = useSellerDashboard();
  const orders = useSellerOrders({
    statuses: tab.statuses,
    q: search || undefined,
    sort: sort === "default" ? tab.sort : sort,
    page: page - 1,
    size: ORDERS_PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-950">จัดการคำสั่งซื้อ</h1>
        <p className="text-xs text-gray-500">{ordersSubtitle(counts.data)}</p>
      </div>

      <OrderFilterBar
        activeTab={tab.id}
        onTabChange={onTabChange}
        counts={counts.data}
        search={search}
        onSearchChange={onSearchChange}
        sort={sort}
        onSortChange={onSortChange}
      />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-3.5">
          <QueryBoundary
            query={orders}
            loading={<OrderListSkeleton />}
            errorTitle="โหลดคำสั่งซื้อไม่สำเร็จ"
            isEmpty={(result) => result.items.length === 0}
            empty={
              <EmptyState
                title={search ? `ไม่พบคำสั่งซื้อที่ตรงกับ "${search}"` : `ไม่มีคำสั่งซื้อในแท็บ${tab.label}`}
                description={search ? "ลองค้นด้วยเลขออเดอร์ หรือชื่อผู้ใช้ของผู้ซื้อ" : undefined}
              />
            }
          >
            {(result) => (
              <>
                {result.items.map((summary, index) => (
                  <OrderCard
                    key={summary.order.id}
                    summary={summary}
                    defaultOpen={index === 0 && page === 1}
                  />
                ))}
                <OrderPagination
                  page={page}
                  totalPages={result.totalPages}
                  totalItems={result.totalItems}
                  disabled={orders.isFetching}
                  onPageChange={onPageChange}
                />
              </>
            )}
          </QueryBoundary>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <ShippingStepsCard {...SHIPPING_STEPS} />
          {dashboard.data ? <MonthlySummaryCard {...monthlySummary(dashboard.data.month)} /> : null}
          <TipCard {...PACKING_TIP} />
        </div>
      </div>
    </div>
  );
}
