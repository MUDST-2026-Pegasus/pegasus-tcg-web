import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { compactBaht, type WeeklyTrendPoint } from "../weekly-report.format";

const chartConfig = {
  singles: { label: "การ์ดเดี่ยว", color: "#38bdf8" },
  sealed: { label: "กล่อง/ซองสุ่ม", color: "var(--primary)" },
  other: { label: "อื่น ๆ", color: "#cbd5e1" },
} satisfies ChartConfig;

const LEGEND_ORDER = ["singles", "sealed", "other"];

/**
 * พื้นที่ซ้อน เทียบการ์ดเดี่ยวกับกล่อง/ซองสุ่มรายวัน
 * ชั้น "อื่น ๆ" โผล่เฉพาะสัปดาห์ที่มี ทั้งกราฟจะได้รวมเท่ายอดขายบนการ์ด
 */
export function WeeklyTrendChart({ points }: { points: WeeklyTrendPoint[] }) {
  const hasOther = points.some((point) => point.other > 0);

  return (
    <Card className="min-w-0 flex-1 gap-0 rounded-xl border border-border p-6 shadow-none ring-0">
      <p className="text-lg font-semibold text-card-foreground">
        แนวโน้มสต็อกและกำไรรายวัน (จ. - อา.)
      </p>
      <p className="mt-[3px] text-[13px] text-muted-foreground">
        แสดงยอดขาย 7 วันของสัปดาห์ที่เลือก (บาท)
      </p>
      <ChartContainer config={chartConfig} className="mt-3 h-[320px] w-full">
        <AreaChart data={points} margin={{ left: 0, right: 16, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            tickFormatter={compactBaht}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            dataKey="sealed"
            type="linear"
            stackId="sales"
            stroke="none"
            fill="var(--color-sealed)"
            fillOpacity={0.9}
          />
          <Area
            dataKey="singles"
            type="linear"
            stackId="sales"
            stroke="none"
            fill="var(--color-singles)"
            fillOpacity={0.5}
          />
          {hasOther ? (
            <Area
              dataKey="other"
              type="linear"
              stackId="sales"
              stroke="none"
              fill="var(--color-other)"
              fillOpacity={0.7}
            />
          ) : null}
          <ChartLegend
            itemSorter={(item) => LEGEND_ORDER.indexOf(String(item.dataKey))}
            content={<ChartLegendContent className="justify-start pt-3" />}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}
