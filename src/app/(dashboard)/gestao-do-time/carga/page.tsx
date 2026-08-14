"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { Tooltip } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { TeamNav } from "@/components/team-management/team-nav";
import { WorkloadNotice } from "@/components/team-management/workload-notice";
import { BarChartCard } from "@/components/charts/bar-chart-card";
import { useTeamWorkload } from "@/hooks/use-team-workload";
import { TEAM_METRIC_FORMULAS } from "@/lib/team-metrics";
import { formatPercent } from "@/lib/formatters";

export default function GestaoDoTimeCargaPage() {
  const { data, isLoading, isError } = useTeamWorkload();

  return (
    <RouteGuard permission="team-management.view">
      <PageHeader
        title="Gestão do Time — Carga do Time"
        description="Distribuição de demanda entre a equipe de Comunicação Interna."
      />
      <TeamNav />
      <WorkloadNotice />

      <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data} partialCoverage={data?.partialCoverage}>
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-card border border-border bg-surface p-5">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs font-medium text-text-secondary">Concentração de carga</p>
                  <Tooltip content={<span>Fórmula: {TEAM_METRIC_FORMULAS.concentration}</span>}>
                    <HelpCircle className="h-3.5 w-3.5 text-text-secondary/70" />
                  </Tooltip>
                </div>
                <p className="text-2xl font-semibold text-text-primary">
                  {data.concentration != null ? formatPercent(data.concentration * 100) : "sem dado"}
                </p>
                <p className="text-xs text-text-secondary mt-1">Maior carga individual ÷ carga total aberta do time.</p>
              </div>
              <div className="rounded-card border border-border bg-surface p-5">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs font-medium text-text-secondary">Índice de equilíbrio</p>
                  <Tooltip content={<span>Fórmula: {TEAM_METRIC_FORMULAS.balanceIndex}</span>}>
                    <HelpCircle className="h-3.5 w-3.5 text-text-secondary/70" />
                  </Tooltip>
                </div>
                <p className="text-2xl font-semibold text-text-primary">{data.balanceIndex != null ? data.balanceIndex.toFixed(2) : "sem dado"}</p>
                <p className="text-xs text-text-secondary mt-1">1 = distribuição perfeitamente equilibrada entre a equipe.</p>
              </div>
            </div>

            <SectionCard
              title="Carga por responsável"
              description="Tarefas abertas por pessoa (tarefas com múltiplos responsáveis são divididas igualmente entre eles)."
            >
              <BarChartCard data={data.workload.map((w) => ({ label: w.name, value: Number(w.openTaskLoad.toFixed(1)) }))} layout="vertical" height={320} />
            </SectionCard>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
