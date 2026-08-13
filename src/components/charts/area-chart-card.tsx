"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TimeSeriesPoint } from "@/types/metrics";
import { CHART_COLORS, GRID_COLOR, AXIS_COLOR } from "@/lib/chart-colors";
import { formatShortDate, formatNumber, formatChartValue } from "@/lib/formatters";

interface AreaChartCardProps {
  data: TimeSeriesPoint[];
  color?: string;
  height?: number;
}

export function AreaChartCard({ data, color = CHART_COLORS.info, height = 260 }: AreaChartCardProps) {
  const gradientId = `area-gradient-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={44} />
        <Tooltip
          labelFormatter={(v) => formatShortDate(String(v))}
          formatter={(value) => formatChartValue(value)}
          contentStyle={{ borderRadius: 8, border: `1px solid ${GRID_COLOR}`, fontSize: 12 }}
        />
        <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
