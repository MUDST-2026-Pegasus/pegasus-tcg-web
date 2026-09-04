import { Button } from "@/components/ui/button";
import { SellerLowStockCard } from "@/features/seller/components/SellerLowStockCard";
import { SellerRecentOrdersCard } from "@/features/seller/components/SellerRecentOrdersCard";
import { SellerSalesCard } from "@/features/seller/components/SellerSalesCard";
import { SellerStatCard } from "@/features/seller/components/SellerStatCard";
import { SellerTodoCard } from "@/features/seller/components/SellerTodoCard";
import type { SellerDashboardData } from "@/features/seller/seller.types";

type SellerDashboardContentProps = {
  data: SellerDashboardData;
};

export function SellerDashboardContent({ data }: SellerDashboardContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-950">
            {data.greeting}
          </h1>
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
        <SellerSalesCard {...data.sales} />
        <SellerTodoCard {...data.todo} />
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {data.stats.map((stat) => (
          <SellerStatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <SellerRecentOrdersCard {...data.recentOrders} />
        <SellerLowStockCard {...data.lowStock} />
      </div>
    </div>
  );
}
