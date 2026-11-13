import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import emptyIllustration from "@/assets/admin/weekly-report-empty.svg";
import { QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslate } from "@/lib/i18n";

import { useAdminGames } from "../catalog.queries";
import {
  addWeeks,
  bangkokToday,
  resolveWeekParam,
  weekRangeLabel,
  weeklyStatCards,
  weeklyTrendPoints,
  weekStartOf,
} from "../weekly-report.format";
import { useWeeklyReport } from "../weekly-report.queries";
import { StatCard } from "./StatCard";
import { WeeklyGameShareChart } from "./WeeklyGameShareChart";
import { WeeklyReportExportDialog } from "./WeeklyReportExportDialog";
import { WeeklyReportSettingsDialog } from "./WeeklyReportSettingsDialog";
import { GameFilter, WeekFilter, type GameFilterOption } from "./WeeklyReportFilters";
import { WeeklyReportTable } from "./WeeklyReportTable";
import { WeeklyTrendChart } from "./WeeklyTrendChart";

/** รายงานสต็อกและกำไรรายสัปดาห์ — ตัวกรองอยู่ใน URL (`?week=&game=`) เปิดลิงก์ซ้ำได้สัปดาห์เดิม */
export function AdminWeeklyReportContent() {
  const { t } = useTranslate("admin");
  const [searchParams, setSearchParams] = useSearchParams();
  const today = bangkokToday();
  const weekStart = resolveWeekParam(searchParams.get("week"), today);
  const game = searchParams.get("game") || null;
  const filters = { weekStart, game };

  const report = useWeeklyReport(filters);
  // การ์ดเทียบกับสัปดาห์ก่อนด้วยตัวกรองเดียวกัน พังก็แค่ไม่โชว์ป้ายเทียบ
  const previous = useWeeklyReport({ weekStart: addWeeks(weekStart, -1), game });
  // % ในเมนูเกมต้องมาจากรายงานทุกเกม เลือกเกมอยู่หรือไม่ก็ตาม
  const allGames = useWeeklyReport({ weekStart, game: null });
  const games = useAdminGames();
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const gameOptions = useMemo<GameFilterOption[]>(
    () =>
      (games.data ?? [])
        .filter((item) => item.active)
        .map((item) => ({
          slug: item.slug,
          name: item.name,
          share: allGames.data
            ? (allGames.data.gameDistribution.find((row) => row.gameSlug === item.slug)
                ?.percentage ?? 0)
            : undefined,
        })),
    [games.data, allGames.data],
  );
  const gameLabel =
    gameOptions.find((option) => option.slug === game)?.name ??
    (game ?? t("weeklyReport.filter.allGames", "ทุกเกม"));

  const setFilter = (key: "week" | "game", value: string | null) => {
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            {t("weeklyReport.title", "รายงานสต็อกและกำไรรายสัปดาห์")}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {t("weeklyReport.subtitle", "สรุปความเคลื่อนไหวสต็อกสินค้าและผลกำไรสุทธิรายสัปดาห์บน Pegasus TCG")}
            {report.dataUpdatedAt
              ? t("weeklyReport.lastUpdated", " · อัปเดตล่าสุด {time} น.", {
                  time: format(report.dataUpdatedAt, "HH:mm"),
                })
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <WeekFilter
            weekStart={weekStart}
            disabled={report.isFetching}
            onChange={(next) => setFilter("week", next)}
          />
          <GameFilter
            game={game}
            options={gameOptions}
            disabled={report.isFetching}
            onChange={(next) => setFilter("game", next)}
          />
          <Button
            variant="outline"
            className="h-[41px] rounded-lg px-3.5 font-normal"
            disabled={report.isFetching || !report.data?.hasData}
            onClick={() => setExportOpen(true)}
          >
            {t("weeklyReport.exportReport", "ส่งออกรายงาน")}
          </Button>
          <Button
            className="h-[41px] rounded-lg px-3.5 font-normal"
            onClick={() => setSettingsOpen(true)}
          >
            {t("weeklyReport.systemSettings", "ตั้งค่าระบบ")}
          </Button>
        </div>
      </div>

      <QueryBoundary
        query={report}
        loading={<WeeklyReportSkeleton />}
        errorTitle={t("weeklyReport.loadError", "โหลดรายงานรายสัปดาห์ไม่สำเร็จ")}
      >
        {(data) => (
          <>
            <div className="flex flex-wrap items-stretch gap-4">
              {weeklyStatCards(data, previous.data).map((card) => (
                <StatCard key={card.id} {...card} />
              ))}
            </div>

            {data.hasData ? (
              <>
                <div className="flex flex-col items-stretch gap-4 lg:flex-row">
                  <WeeklyTrendChart points={weeklyTrendPoints(data)} />
                  <WeeklyGameShareChart
                    description={t("weeklyReport.weekNumber", "สัปดาห์ที่ {range}", {
                      range: weekRangeLabel(weekStart),
                    })}
                    items={data.gameDistribution}
                  />
                </div>
                <WeeklyReportTable report={data} />
              </>
            ) : (
              <WeeklyReportEmptyCard
                isCurrentWeek={weekStart === weekStartOf(today)}
                onBackToCurrent={() => setFilter("week", null)}
              />
            )}

            <WeeklyReportExportDialog
              open={exportOpen}
              onOpenChange={setExportOpen}
              filters={filters}
              gameLabel={gameLabel}
              report={data}
            />
          </>
        )}
      </QueryBoundary>

      <WeeklyReportSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function WeeklyReportEmptyCard({
  isCurrentWeek,
  onBackToCurrent,
}: {
  isCurrentWeek: boolean;
  onBackToCurrent: () => void;
}) {
  const { t } = useTranslate("admin");

  return (
    <Card className="items-center gap-0 rounded-xl border border-border px-6 py-20 text-center shadow-none ring-0">
      {/* Card ตัด padding บนออกเมื่อลูกตัวแรกเป็น img จึงต้องมีกรอบครอบ */}
      <div>
        <img src={emptyIllustration} alt="" width={96} height={96} />
      </div>
      <p className="mt-5 text-xl font-semibold text-foreground">
        {t("weeklyReport.empty.title", "ไม่พบรายการเคลื่อนไหวสต็อกและกำไรในสัปดาห์ที่เลือก")}
      </p>
      <p className="mt-2 max-w-[520px] text-sm leading-[22.4px] text-muted-foreground">
        {t(
          "weeklyReport.empty.desc",
          "ยังไม่มีคำสั่งซื้อที่สำเร็จสมบูรณ์หรือรายการสต็อกในช่วงเวลานี้ กรุณาเลือกสัปดาห์อื่นหรือเปลี่ยนตัวกรองเกม",
        )}
      </p>
      {isCurrentWeek ? null : (
        <Button
          variant="outline"
          className="mt-6 h-[43px] rounded-lg border-primary px-5 font-medium text-primary hover:text-primary"
          onClick={onBackToCurrent}
        >
          {t("weeklyReport.empty.backToCurrent", "กลับไปสัปดาห์ปัจจุบัน")}
        </Button>
      )}
    </Card>
  );
}

function WeeklyReportSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[160px] min-w-[200px] flex-1 rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <Skeleton className="h-[420px] flex-1 rounded-xl" />
        <Skeleton className="h-[420px] w-full rounded-xl lg:w-[385px]" />
      </div>
      <Skeleton className="h-[380px] rounded-xl" />
    </div>
  );
}
