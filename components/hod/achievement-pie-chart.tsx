"use client";

import { Card } from "@/components/ui/card";
import { AchievementDistribution } from "@/lib/actions/hod-performance";
import { useMemo } from "react";

interface AchievementPieChartProps {
  data: AchievementDistribution[];
}

// Color palette for pie chart
const COLORS = [
  "hsl(var(--chart-1))", // #e11d48 - red for low
  "hsl(var(--chart-2))", // #f59e0b - orange
  "hsl(var(--chart-3))", // #eab308 - yellow
  "hsl(var(--chart-4))", // #84cc16 - lime
  "hsl(var(--chart-5))", // #22c55e - green
  "hsl(var(--primary))", // primary for high achievers
];

export function AchievementPieChart({ data }: AchievementPieChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filter out ranges with 0 employees and sort by range_start
    return data
      .filter((d) => d.employee_count > 0)
      .sort((a, b) => a.range_start - b.range_start);
  }, [data]);

  const totalEmployees = useMemo(
    () => chartData.reduce((sum, d) => sum + d.employee_count, 0),
    [chartData]
  );

  // Calculate pie slices
  const slices = useMemo(() => {
    let currentAngle = -90; // Start at top

    return chartData.map((item, index) => {
      const percentage = (item.employee_count / totalEmployees) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Calculate path for pie slice
      const start = polarToCartesian(100, 100, 80, endAngle);
      const end = polarToCartesian(100, 100, 80, startAngle);
      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M 100 100`,
        `L ${start.x} ${start.y}`,
        `A 80 80 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        `Z`,
      ].join(" ");

      // Calculate label position
      const midAngle = startAngle + angle / 2;
      const labelPos = polarToCartesian(100, 100, 95, midAngle);

      currentAngle = endAngle;

      return {
        ...item,
        pathData,
        color: getColorForRange(item.range_start, chartData.length, index),
        labelPos,
        percentage: percentage.toFixed(1),
        midAngle,
      };
    });
  }, [chartData, totalEmployees]);

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Achievement Distribution
        </h3>
        <p className="text-sm text-muted-foreground">
          No achievement data available
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Achievement Distribution</h3>
          <p className="text-sm text-muted-foreground">
            Current month performance breakdown
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Pie Chart */}
          <div className="relative w-[240px] h-[240px] flex-shrink-0">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full"
              style={{ transform: "rotate(0deg)" }}
            >
              {slices.map((slice, index) => (
                <g key={index} className="group cursor-pointer">
                  <path
                    d={slice.pathData}
                    fill={slice.color}
                    stroke="white"
                    strokeWidth="2"
                    className="transition-all duration-300 hover:opacity-80"
                  />
                  {/* Tooltip on hover */}
                  <title>
                    {slice.percentage_range}: {slice.employee_count} employees (
                    {slice.percentage}%)
                  </title>
                </g>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {slices.map((slice, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {slice.percentage_range}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {slice.employee_count} emp ({slice.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {chartData
                .filter((d) => d.range_start >= 91)
                .reduce((sum, d) => sum + d.employee_count, 0)}
            </div>
            <div className="text-xs text-muted-foreground">High Performers</div>
            <div className="text-xs text-muted-foreground">(≥91%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {chartData
                .filter((d) => d.range_start >= 51 && d.range_start < 91)
                .reduce((sum, d) => sum + d.employee_count, 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              Average Performers
            </div>
            <div className="text-xs text-muted-foreground">(51-90%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {chartData
                .filter((d) => d.range_start < 51)
                .reduce((sum, d) => sum + d.employee_count, 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              Needs Attention
            </div>
            <div className="text-xs text-muted-foreground">(≤50%)</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Helper functions
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function getColorForRange(
  rangeStart: number,
  totalRanges: number,
  index: number
): string {
  // Above 100% - special color
  if (rangeStart > 100) return "hsl(220, 90%, 56%)"; // Blue for overachievers

  // High performers (91-100%)
  if (rangeStart >= 91) return "hsl(142, 71%, 45%)"; // Green

  // Good performers (71-90%)
  if (rangeStart >= 71) return "hsl(84, 81%, 44%)"; // Lime

  // Average (51-70%)
  if (rangeStart >= 51) return "hsl(48, 96%, 53%)"; // Yellow

  // Below average (31-50%)
  if (rangeStart >= 31) return "hsl(38, 92%, 50%)"; // Orange

  // Low performers (0-30%)
  return "hsl(0, 84%, 60%)"; // Red
}
