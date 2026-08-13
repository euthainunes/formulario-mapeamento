"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CATEGORICAL_PALETTE, GRID_COLOR } from "@/lib/chart-colors";
import { formatNumber, formatPercent } from "@/lib/formatters";

export interface DonutDatum {
  label: string;
  value: number;
}

interface DonutChartCardProps {
  data: DonutDatum[];
  height?: number;
}

export function DonutChartCard({ data, height = 260 }: DonutChartCardProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius="58%"
          outerRadius="85%"
          paddingAngle={2}
          strokeWidth={1}
          stroke={GRID_COLOR}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const num = Number(value) || 0;
            return [`${formatNumber(num)} (${formatPercent((num / total) * 100)})`, String(name)];
          }}
          contentStyle={{ borderRadius: 8, border: `1px solid ${GRID_COLOR}`, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
