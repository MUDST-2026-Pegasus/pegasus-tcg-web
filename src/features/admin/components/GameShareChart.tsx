import { Cell, Pie, PieChart } from "recharts";

import { Card } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { GameShareSlice } from "@/features/admin/admin.types";

const SLICE_COLORS = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type GameShareChartProps = {
  title: string;
  description: string;
  slices: GameShareSlice[];
  footnoteTitle: string;
  footnoteDescription: string;
};

export function GameShareChart({
  title,
  description,
  slices,
  footnoteTitle,
  footnoteDescription,
}: GameShareChartProps) {
  const chartConfig = Object.fromEntries(
    slices.map((slice, index) => [
      slice.id,
      { label: slice.name, color: SLICE_COLORS[index % SLICE_COLORS.length] },
    ]),
  ) satisfies ChartConfig;

  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0 lg:w-[400px]">
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-card-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={92}
            paddingAngle={1}
            strokeWidth={0}
          >
            {slices.map((slice, index) => (
              <Cell
                key={slice.id}
                fill={SLICE_COLORS[index % SLICE_COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium text-card-foreground">
          {footnoteTitle}
        </p>
        <p className="text-xs text-muted-foreground">{footnoteDescription}</p>
      </div>
    </Card>
  );
}
