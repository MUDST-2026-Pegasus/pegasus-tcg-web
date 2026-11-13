import { Cell, Pie, PieChart } from "recharts";

import { Card } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslate } from "@/lib/i18n";

import { formatShare, GAME_COLORS } from "../weekly-report.format";
import type { WeeklyGameDistribution } from "../weekly-report.types";

type WeeklyGameShareChartProps = {
  description: string;
  items: WeeklyGameDistribution[];
};

export function WeeklyGameShareChart({ description, items: allItems }: WeeklyGameShareChartProps) {
  const { t } = useTranslate("admin");
  // เกมที่ส่วนแบ่ง 0% ไม่มีชิ้นบนโดนัท ไม่ต้องกินที่ในคำอธิบายสี
  const items = allItems.filter((item) => item.percentage > 0);
  const colorOf = (index: number) => GAME_COLORS[index % GAME_COLORS.length];
  const leader = items.reduce<WeeklyGameDistribution | null>(
    (best, item) => (best === null || item.percentage > best.percentage ? item : best),
    null,
  );
  const hasShare = (leader?.percentage ?? 0) > 0;
  const chartConfig = Object.fromEntries(
    items.map((item, index) => [item.gameSlug, { label: item.game, color: colorOf(index) }]),
  ) satisfies ChartConfig;

  return (
    <Card className="w-full gap-0 rounded-xl border border-border p-6 shadow-none ring-0 lg:w-[385px]">
      <p className="text-lg font-semibold text-card-foreground">
        {t("weeklyReport.chart.gameShareTitle", "สัดส่วนสต็อกและกำไรตามเกม")}
      </p>
      <p className="mt-[3px] text-[13px] text-muted-foreground">{description}</p>

      {hasShare && leader ? (
        <>
          <div className="relative mx-auto mt-2 h-[220px] w-full max-w-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="gameSlug" hideLabel />} />
                <Pie
                  data={items}
                  dataKey="percentage"
                  nameKey="gameSlug"
                  innerRadius={50}
                  outerRadius={90}
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {items.map((item, index) => (
                    <Cell key={item.gameSlug} fill={colorOf(index)} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[22px] leading-tight font-bold text-foreground">
                {formatShare(leader.percentage)}
              </p>
              <p className="max-w-[80px] truncate text-[11px] text-muted-foreground">{leader.game}</p>
            </div>
          </div>

          <ul className="flex flex-wrap justify-center gap-x-3.5 gap-y-2">
            {items.map((item, index) => (
              <li key={item.gameSlug} className="min-w-[90px] text-xs text-muted-foreground">
                <span aria-hidden="true" className="font-bold" style={{ color: colorOf(index) }}>
                  ●
                </span>{" "}
                {item.game}
                <br />
                {formatShare(item.percentage)}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[13px] leading-[19.5px] font-medium text-foreground">
            {t(
              "weeklyReport.chart.leaderShareNote",
              "{game} ครองส่วนแบ่งยอดขายสูงสุด {percentage} · ข้อมูลจากคำสั่งซื้อที่สำเร็จแล้ว",
              {
                game: leader.game,
                percentage: formatShare(leader.percentage),
              },
            )}
          </p>
        </>
      ) : (
        <p className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
          {t("weeklyReport.chart.noGameShare", "ยังไม่มีสัดส่วนตามเกมในสัปดาห์นี้")}
        </p>
      )}
    </Card>
  );
}
