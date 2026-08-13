"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { GlobalFiltersBar } from "@/components/filters/global-filters-bar";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { useAudienceData } from "@/hooks/use-audience-data";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { AreaChartCard } from "@/components/charts/area-chart-card";
import { DonutChartCard } from "@/components/charts/donut-chart-card";
import { BarChartCard } from "@/components/charts/bar-chart-card";
import { DataTable } from "@/components/tables/data-table";
import { collaboratorColumns } from "@/components/tables/columns/collaborators-columns";
import { ExportButtons } from "@/components/shared/export-buttons";
import { CHART_COLORS } from "@/lib/chart-colors";

export default function PessoasAudienciaPage() {
  const filters = useGlobalFilters();
  const { data, isLoading, isError } = useAudienceData(filters);

  return (
    <RouteGuard permission="audience.view">
      <PageHeader
        title="Pessoas e Audiência"
        description="Visão de audiência ativa e engajada da intranet, com detalhamento por colaborador."
        actions={<ExportButtons label="audiência" />}
      />
      <GlobalFiltersBar />

      <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data} partialCoverage={data?.partialCoverage}>
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <SectionCard title="Evolução de ativos" className="lg:col-span-2" description="Colaboradores ativos por data, no período selecionado.">
                <AreaChartCard data={data.activeEvolution} color={CHART_COLORS.primary} />
              </SectionCard>
              <SectionCard title="Distribuição por dispositivo">
                <DonutChartCard data={data.deviceBreakdown.map((d) => ({ label: d.device, value: d.count }))} />
              </SectionCard>
            </div>

            <SectionCard title="Comparação entre períodos" description="Ativos e engajados no período atual vs. período anterior.">
              <BarChartCard
                data={data.periodComparison.flatMap((p) => [
                  { label: `${p.label} (atual)`, value: p.currentPeriod },
                  { label: `${p.label} (anterior)`, value: p.previousPeriod },
                ])}
                color={CHART_COLORS.info}
              />
            </SectionCard>

            <SectionCard title="Colaboradores" description="Detalhamento por colaborador, com busca, ordenação e paginação.">
              <DataTable columns={collaboratorColumns} data={data.collaborators} searchPlaceholder="Buscar colaborador..." />
            </SectionCard>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
