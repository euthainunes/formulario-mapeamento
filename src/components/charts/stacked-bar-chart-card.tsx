"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MultiSeriesPoint } from "@/types/metrics";
import { GRID_COLOR, AXIS_COLOR } from "@/lib/chart-colors";
import { formatShortDate, formatNumber, formatChartValue } from "@/lib/formatters";

export interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

interface StackedBarChartCardProps {
  data: MultiSeriesPoint[];
  series: SeriesConfig[];
  height?: number;
}

export function StackedBarChartCard({ data, series, height = 280 }: StackedBarChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} stackId="stack" fill={s.color} radius={[0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
