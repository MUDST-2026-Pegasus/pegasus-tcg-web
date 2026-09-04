import { Button } from "@/components/ui/button";

import type { DashboardData } from "../dashboard.types";

import { LowStockCard } from "./LowStockCard";
import { RecentOrdersCard } from "./RecentOrdersCard";
import { SalesCard } from "./SalesCard";
import { StatCard } from "./StatCard";
import { TodoCard } from "./TodoCard";

type DashboardContentProps = {
  data: DashboardData;
};

export function DashboardContent({ data }: DashboardContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-950">{data.greeting}</h1>
          <p className="text-xs text-gray-500">{data.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-md px-2.5">
            {data.actions.viewShopLabel}
          </Button>
          <Button size="sm" className="rounded-md px-2.5">
            {data.actions.createListingLabel}
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <SalesCard {...data.sales} />
        <TodoCard {...data.todo} />
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {data.stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <RecentOrdersCard {...data.recentOrders} />
        <LowStockCard {...data.lowStock} />
      </div>
    </div>
  );
}
