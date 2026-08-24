import { Area, AreaChart, XAxis } from "recharts";

import { Card } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { MonthlySalesPoint } from "@/features/admin/admin.types";

const chartConfig = {
  singles: { label: "การ์ดเดี่ยว", color: "var(--chart-1)" },
  sealed: { label: "กล่อง/ซองสุ่ม", color: "var(--chart-2)" },
} satisfies ChartConfig;

type MonthlySalesChartProps = {
  title: string;
  description: string;
  points: MonthlySalesPoint[];
};

export function MonthlySalesChart({
  title,
  description,
  points,
}: MonthlySalesChartProps) {
  return (
    <Card className="min-w-0 flex-1 gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-card-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <AreaChart data={points} margin={{ left: 0, right: 0, top: 4 }}>
          <defs>
            {Object.entries(chartConfig).map(([key, item]) => (
              <linearGradient
                key={key}
                id={`fill-${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={item.color} stopOpacity={0.85} />
                <stop offset="95%" stopColor={item.color} stopOpacity={0.15} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          {/* ซ้อนสองซีรีส์เป็นพื้นที่สะสม ให้หน้าตาเหมือน area chart ในดีไซน์ */}
          <Area
            dataKey="sealed"
            type="natural"
            stackId="sales"
            stroke="var(--color-sealed)"
            fill="url(#fill-sealed)"
          />
          <Area
            dataKey="singles"
            type="natural"
            stackId="sales"
            stroke="var(--color-singles)"
            fill="url(#fill-singles)"
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}
