"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { GlobalFiltersBar } from "@/components/filters/global-filters-bar";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { usePodsData } from "@/hooks/use-pods-data";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { AreaChartCard } from "@/components/charts/area-chart-card";
import { BarChartCard } from "@/components/charts/bar-chart-card";
import { DataTable } from "@/components/tables/data-table";
import { podColumns } from "@/components/tables/columns/pods-columns";
import { ExportButtons } from "@/components/shared/export-buttons";
import { CHART_COLORS } from "@/lib/chart-colors";

export default function PodsPage() {
  const filters = useGlobalFilters();
  const { data, isLoading, isError } = usePodsData(filters);

  return (
    <RouteGuard permission="pods.view">
      <PageHeader
        title="Pods"
        description="Espaços colaborativos por tema dentro da intranet BeeHome."
        actions={<ExportButtons label="Pods" />}
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

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Evolução por período">
                <AreaChartCard data={data.evolution} color={CHART_COLORS.primary} />
              </SectionCard>
              <SectionCard title="Comparação entre Pods">
                <BarChartCard
                  data={[...data.pods].sort((a, b) => b.accessCount - a.accessCount).map((p) => ({ label: p.name, value: p.accessCount }))}
                  layout="vertical"
                  color={CHART_COLORS.info}
                  height={320}
                />
              </SectionCard>
            </div>

            <SectionCard title="Pods">
              <DataTable columns={podColumns} data={data.pods} searchPlaceholder="Buscar Pod..." />
            </SectionCard>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
