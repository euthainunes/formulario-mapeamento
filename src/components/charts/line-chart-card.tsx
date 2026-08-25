"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TimeSeriesPoint } from "@/types/metrics";
import { CHART_COLORS, GRID_COLOR, AXIS_COLOR } from "@/lib/chart-colors";
import { formatShortDate, formatNumber, formatChartValue } from "@/lib/formatters";

interface LineChartCardProps {
  data: TimeSeriesPoint[];
  color?: string;
  height?: number;
  /** Formatador do rótulo de data — use formatMonthLabel quando o período for longo o bastante pra série vir agrupada por mês (ver bucketTimeSeries). */
  dateFormatter?: (iso: string) => string;
}

export function LineChartCard({ data, color = CHART_COLORS.primary, height = 260, dateFormatter = formatShortDate }: LineChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={dateFormatter}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={44} />
        <Tooltip
          labelFormatter={(v) => dateFormatter(String(v))}
          formatter={(value) => formatChartValue(value)}
          contentStyle={{ borderRadius: 8, border: `1px solid ${GRID_COLOR}`, fontSize: 12 }}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
