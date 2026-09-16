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
import { BarChart3 } from "lucide-react";

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

interface IncomeBarChartProps {
  data?: { month: string; sent: number; interviews: number }[];
}

export const IncomeBarChart: React.FC<IncomeBarChartProps> = ({
  data = [],
}) => {
  const hasData = data.some((item) => item.sent > 0 || item.interviews > 0);

  return (
    <Card className="md:col-span-2 xl:col-span-4 rounded-2xl p-5 shadow-xs border border-border bg-card text-card-foreground flex flex-col justify-between">
      <CardHeader className="p-0 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-normal tracking-tight text-foreground">
            Monthly Application Activity
          </CardTitle>
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-muted-foreground inline-block" />
              <span>Sent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-primary inline-block" />
              <span>Interviews</span>
            </div>
          </div>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Track outreach velocity and interview conversion across time
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 pt-2 flex-1 flex flex-col justify-center min-h-[176px]">
        {!hasData ? (
          <div className="h-44 w-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/70 rounded-xl space-y-1.5">
            <BarChart3 className="w-6 h-6 text-muted-foreground opacity-50" />
            <p className="text-xs font-medium text-foreground">No activity recorded yet</p>
            <p className="text-[11px] text-muted-foreground max-w-[200px]">
              Applications submitted will display monthly volume and interview trends here.
            </p>
          </div>
        ) : (
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
                allowDecimals={false}
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
        )}
      </CardContent>
    </Card>
  );
};
