"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { MonthlySubmission } from "@/lib/actions/hod-performance";

interface MonthlySubmissionChartProps {
  data: MonthlySubmission[];
}

const chartConfig = {
  submission_count: {
    label: "Submitted KPIs",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function MonthlySubmissionChart({ data }: MonthlySubmissionChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly KPI Submissions</CardTitle>
          <CardDescription>No submission data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Reverse to show chronologically (oldest to newest)
  const chartData = [...data].reverse().map((item) => ({
    month: item.month_year,
    submission_count: item.submission_count,
    employee_count: item.employee_count,
    month_short: item.month_year.split(" ")[0], // Just the month name
  }));

  const totalEmployees = data[0]?.employee_count || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly KPI Submissions</CardTitle>
        <CardDescription>
          Last {data.length} months submission trend
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month_short"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                      <div className="font-semibold mb-2">{data.month}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Submitted:</span>
                          <span className="font-semibold">{data.submission_count} employees</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-semibold">{data.employee_count} employees</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Rate:</span>
                          <span className="font-semibold">
                            {((data.submission_count / data.employee_count) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="submission_count"
              fill="var(--color-submission_count)"
              radius={8}
              maxBarSize={40}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <div>Total Division Employees</div>
          <div className="font-semibold text-foreground">{totalEmployees}</div>
        </div>
      </div>
    </Card>
  );
}
