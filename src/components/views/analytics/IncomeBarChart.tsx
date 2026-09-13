"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  sent: {
    label: "Applications Sent",
    color: "var(--muted-foreground)",
  },
  interviews: {
    label: "Interviews Secured",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const DEFAULT_CHART_DATA = [
  { month: "Jan", sent: 24, interviews: 13 },
  { month: "Feb", sent: 18, interviews: 22 },
  { month: "Mar", sent: 21, interviews: 15 },
  { month: "Apr", sent: 23, interviews: 17 },
  { month: "May", sent: 18, interviews: 25 },
  { month: "Jun", sent: 30, interviews: 19 },
  { month: "Jul", sent: 24, interviews: 17 },
  { month: "Aug", sent: 23, interviews: 12 },
];

interface IncomeBarChartProps {
  data?: { month: string; sent: number; interviews: number }[];
}

export const IncomeBarChart: React.FC<IncomeBarChartProps> = ({
  data = DEFAULT_CHART_DATA,
}) => {
  return (
    <Card className="md:col-span-2 xl:col-span-4 rounded-2xl p-5 shadow-xs border border-border bg-card text-card-foreground flex flex-col justify-between">
      <CardHeader className="p-0 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-normal tracking-tight text-foreground">
            Total Income
          </CardTitle>
          {/* Small legend matching reference in top-right */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-primary inline-block" />
              <span>Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-muted-foreground inline-block" />
              <span>Loss</span>
            </div>
          </div>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          View your income in a certain period of time
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 pt-2 flex-1">
        <ChartContainer
          config={chartConfig}
          className="h-44 w-full aspect-auto"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-border"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[11px] fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[10px] fill-muted-foreground font-mono"
              domain={[0, 50]}
              ticks={[0, 10, 20, 30, 40, 50]}
              tickFormatter={(v) => (v === 0 ? "00" : `${v}k`)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="sent"
              stackId="a"
              fill="var(--color-sent)"
              radius={[0, 0, 4, 4]}
              maxBarSize={24}
            />
            <Bar
              dataKey="interviews"
              stackId="a"
              fill="var(--color-interviews)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

