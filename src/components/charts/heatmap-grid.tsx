"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export interface HeatmapDatum {
  weekday: number;
  hour: number;
  value: number;
}

interface HeatmapGridProps {
  data: HeatmapDatum[];
}

export function HeatmapGrid({ data }: HeatmapGridProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const map = new Map<string, number>();
  for (const d of data) map.set(`${d.weekday}-${d.hour}`, d.value);

  function intensity(value: number) {
    const ratio = value / max;
    if (ratio === 0) return "bg-black/[0.03]";
    if (ratio < 0.2) return "bg-brand-primary/15";
    if (ratio < 0.4) return "bg-brand-primary/30";
    if (ratio < 0.6) return "bg-brand-primary/50";
    if (ratio < 0.8) return "bg-brand-primary/70";
    return "bg-brand-primary";
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[48px_repeat(24,minmax(22px,1fr))] gap-[3px] mb-1">
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-center text-[9px] text-text-secondary">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {WEEKDAY_LABELS.map((label, weekday) => (
          <div key={label} className="grid grid-cols-[48px_repeat(24,minmax(22px,1fr))] gap-[3px] mb-[3px]">
            <div className="text-[11px] text-text-secondary flex items-center">{label}</div>
            {Array.from({ length: 24 }, (_, hour) => {
              const value = map.get(`${weekday}-${hour}`) ?? 0;
              return (
                <Tooltip key={hour} content={`${label} · ${hour}h — ${formatNumber(value)} acessos`}>
                  <div className={cn("h-5 w-full rounded-sm cursor-default", intensity(value))} />
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
