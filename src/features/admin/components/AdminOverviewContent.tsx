import { Button } from "@/components/ui/button";
import type { AdminOverviewData } from "@/features/admin/admin.types";
import { GameShareChart } from "@/features/admin/components/GameShareChart";
import { MonthlySalesChart } from "@/features/admin/components/MonthlySalesChart";
import { RecentActivityCard } from "@/features/admin/components/RecentActivityCard";
import { StatCard } from "@/features/admin/components/StatCard";
import { TopSellersCard } from "@/features/admin/components/TopSellersCard";

type AdminOverviewContentProps = {
  data: AdminOverviewData;
};

export function AdminOverviewContent({ data }: AdminOverviewContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            {data.title}
          </h1>
          <p className="text-[13px] text-muted-foreground">{data.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-md px-2.5">
            ส่งออกรายงาน
          </Button>
          <Button className="rounded-md px-2.5">ตั้งค่าระบบ</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {data.stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <MonthlySalesChart {...data.monthlySales} />
        <RecentActivityCard {...data.activity} />
      </div>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <TopSellersCard {...data.topSellers} />
        <GameShareChart {...data.gameShare} />
      </div>
    </div>
  );
}
