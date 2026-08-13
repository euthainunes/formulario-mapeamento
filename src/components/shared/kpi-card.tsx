import { ArrowUp, ArrowDown, Minus, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { KpiCard as KpiCardType } from "@/types/metrics";
import { formatNumber, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  kpi: KpiCardType;
}

export function KpiCard({ kpi }: KpiCardProps) {
  const { variation } = kpi;
  const displayValue = kpi.formattedValue ?? formatNumber(kpi.value);

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-text-secondary">{kpi.label}</p>
          {kpi.formula && (
            <Tooltip content={<span>Fórmula: {kpi.formula}</span>}>
              <HelpCircle className="h-3.5 w-3.5 text-text-secondary/70 shrink-0" />
            </Tooltip>
          )}
        </div>
        <p className="mt-1.5 text-2xl font-semibold text-text-primary">{displayValue}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <VariationTag variation={variation} />
          {kpi.partialCoverage && <Badge tone="warning">Cobertura parcial</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

export function VariationTag({ variation }: { variation: KpiCardType["variation"] }) {
  if (!variation.comparable) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
        <Minus className="h-3.5 w-3.5" /> sem dado comparável
      </span>
    );
  }
  const isUp = variation.direction === "up";
  const isDown = variation.direction === "down";
  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;
  const colorClass = isUp ? "text-success" : isDown ? "text-error" : "text-text-secondary";
  const pct = variation.percentChange ?? 0;

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", colorClass)}>
      <Icon className="h-3.5 w-3.5" />
      {formatPercent(Math.abs(pct))} vs. período anterior
    </span>
  );
}
