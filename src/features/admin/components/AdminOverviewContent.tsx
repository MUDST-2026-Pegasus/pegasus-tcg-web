import { format } from "date-fns";

import { QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { downloadCsv } from "@/lib/csv";

import { useFileExport } from "../export";

import {
  gameShareHeadline,
  gameSlices,
  overviewCsvFilename,
  overviewCsvRows,
  salesPoints,
  salesTrendDescription,
  statCards,
  thaiMonthYear,
  topSellerBars,
} from "../metrics.format";
import { useOverviewMetrics } from "../metrics.queries";
import { GameShareChart } from "./GameShareChart";
import { MonthlySalesChart } from "./MonthlySalesChart";
import { RecentActivityCard } from "./RecentActivityCard";
import { AuctionOverviewCards } from "./AuctionOverviewCards";
import { ExportButton } from "./ExportButton";
import { StatCard } from "./StatCard";
import { TopSellersCard } from "./TopSellersCard";

/** หน้าแรกของหลังบ้าน — ตัวเลขเดือนปัจจุบันจาก `/admin/metrics/overview` */
export function AdminOverviewContent() {
  const overview = useOverviewMetrics();
  const report = useFileExport();
  // สร้างจากตัวเลขเดือนที่หน้าแสดงอยู่ ไม่ต้องเรียก backend เพิ่ม [TCG-749]
  const exportReport = () => {
    const data = overview.data;
    if (!data) return;
    void report.run(async () => downloadCsv(overviewCsvFilename(data), overviewCsvRows(data)));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            ภาพรวมแพลตฟอร์ม
          </h1>
          <p className="text-[13px] text-muted-foreground">
            สรุปผลประกอบการและกิจกรรมทั้งหมดบน Pegasus TCG
            {overview.dataUpdatedAt
              ? ` · อัปเดตล่าสุด ${format(overview.dataUpdatedAt, "HH:mm")} น.`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton
            label="ส่งออกรายงาน"
            pending={report.pending}
            disabled={!overview.data}
            onClick={exportReport}
          />
          {/* ยังไม่มีหน้าตั้งค่าระบบ ปิดไว้พร้อมบอกเหตุผล */}
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button className="rounded-md px-2.5" disabled>
                ตั้งค่าระบบ
              </Button>
            </TooltipTrigger>
            <TooltipContent>ยังไม่มีหน้าตั้งค่าระบบ</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <QueryBoundary
        query={overview}
        loading={<OverviewSkeleton />}
        errorTitle="โหลดภาพรวมแพลตฟอร์มไม่สำเร็จ"
      >
        {(data) => {
          const trend = data.monthlySales;
          return (
            <>
              <div className="flex flex-wrap items-start gap-4">
                {statCards(data).map((card) => (
                  <StatCard key={card.id} {...card} />
                ))}
              </div>

              {/* ตัวเลขระบบประมูล [TCG-636] */}
              <AuctionOverviewCards />

              <div className="flex flex-col items-start gap-4 lg:flex-row">
                <MonthlySalesChart
                  title="ยอดขายรายเดือน"
                  description={salesTrendDescription(trend)}
                  points={salesPoints(trend)}
                />
                <RecentActivityCard />
              </div>

              <div className="flex flex-col items-start gap-4 lg:flex-row">
                <TopSellersCard
                  title="ร้านค้าที่ทำยอดขายสูงสุด"
                  description={`จัดอันดับตามยอดขายเดือน${thaiMonthYear(data.period.month)}`}
                  items={topSellerBars(data.topSellers)}
                />
                <GameShareChart
                  title="สัดส่วนยอดขายตามเกม"
                  description={thaiMonthYear(data.period.month)}
                  slices={gameSlices(data.gameShare)}
                  footnoteTitle={gameShareHeadline(data.gameShare)}
                  footnoteDescription="ข้อมูลจากคำสั่งซื้อที่ชำระเงินแล้วและไม่ถูกยกเลิก"
                />
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[130px] min-w-[200px] flex-1 rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Skeleton className="h-[290px] flex-1 rounded-xl" />
        <Skeleton className="h-[290px] w-full rounded-xl lg:w-[400px]" />
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Skeleton className="h-[290px] flex-1 rounded-xl" />
        <Skeleton className="h-[290px] w-full rounded-xl lg:w-[400px]" />
      </div>
    </div>
  );
}
