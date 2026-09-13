import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/features/seller/shared/seller.types";

import type { OrdersData } from "../orders.types";

import { MonthlySummaryCard } from "./MonthlySummaryCard";
import { OrderCard } from "./OrderCard";
import { OrderFilterBar } from "./OrderFilterBar";
import { ShippingStepsCard } from "./ShippingStepsCard";
import { TipCard } from "./TipCard";

type OrdersContentProps = {
  data: OrdersData;
};

export function OrdersContent({ data }: OrdersContentProps) {
  const [activeFilterId, setActiveFilterId] = useState<OrderStatus>(
    data.filters[0]?.id ?? "awaiting_pack",
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const visibleOrders = data.orders.filter(
    (order) => order.status === activeFilterId,
  );

  /** ล้างการเลือกด้วยเมื่อสลับตัวกรอง กันสับสนว่ามีของที่เลือกไว้แต่มองไม่เห็น */
  function handleFilterChange(id: OrderStatus) {
    setActiveFilterId(id);
    setSelectedIds([]);
  }

  function handleToggleOrder(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-950">{data.title}</h1>
          <p className="text-xs text-gray-500">{data.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-md px-2.5">
            {selectedIds.length > 0
              ? `พิมพ์ใบปะหน้า ${selectedIds.length} รายการ`
              : data.actions.printAllLabel}
          </Button>
          <Button size="sm" className="rounded-md px-2.5">
            {data.actions.updateStatusLabel}
          </Button>
        </div>
      </div>

      <OrderFilterBar
        filters={data.filters}
        activeFilterId={activeFilterId}
        onFilterChange={handleFilterChange}
        sort={data.sort}
      />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-3.5">
          {visibleOrders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              labels={data.card}
              selected={selectedIds.includes(order.id)}
              onToggleSelect={() => handleToggleOrder(order.id)}
              defaultOpen={index === 0}
            />
          ))}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <ShippingStepsCard {...data.steps} />
          <MonthlySummaryCard {...data.summary} />
          <TipCard {...data.tip} />
        </div>
      </div>
    </div>
  );
}
